import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { mockP24Tokens, payments, reservations, users } from "../db/schema";
import * as crypto from "crypto";
import { and, or, gte, lte, sql, count, eq } from "drizzle-orm";
import { string } from "zod/v4/classic/coerce.cjs";
import { parse } from "path";

const router = Router();

// const ReservationMonth = z.object({
//     month: z.coerce.number().int().min(0).max(11),
//     year: z.coerce.number().int().min(2023)
// })


const PaymentsData = z.object(
    {
        sid: z.coerce.string(),
        amount: z.coerce.number(),
        email: z.coerce.string(),
        name: z.coerce.string(),
        surname: z.coerce.string(),
        phone: z.coerce.string(),
        start: z.coerce.date(),
        end: z.coerce.date(),
        arrivalTime: z.number()
    }
)


router.get("/testAccess", async (_req, res) => {
    const P24_POS_ID = (process.env.P24_POS_ID ?? "").trim();
    const P24_API_KEY = (process.env.P24_API_KEY ?? "").trim();
    const baseUrl =  "https://sandbox.przelewy24.pl";

    if (!P24_POS_ID || !P24_API_KEY) {
        return res.status(500).json({ error: "Brak P24_POS_ID lub P24_API_KEY (REST API KEY z panelu)" });
    }
    const auth = Buffer.from(`${P24_POS_ID}:${P24_API_KEY}`).toString("base64");
    try {
        const response = await fetch(`${baseUrl}/api/v1/testAccess`, {
            method: "GET",
            headers: { Authorization: `Basic ${auth}` },
        });
        const text = await response.text();
        console.log(text)
        return res.status(response.ok ? 200 : response.status).send(text);
    } catch (e: any) {
        return res.status(500).json({ error: "testAccess request failed", details: e?.message });
    }
});




async function mockresponse() {
  const uuid = crypto.randomUUID();
  console.log(uuid); 
  const res = await db.insert(mockP24Tokens).values({
    token: uuid,
    status: 0
  }).run();
  return uuid;
}

const paymentMock = z.object({
  sid: z.coerce.string(),
  amount: z.coerce.number(),
  method: z.coerce.string().optional(),
});

router.post("/mockpay", async (req, res) => {
  const parsed = paymentMock.safeParse(req.body)
  if (!parsed.success) {
      return  res.status(400).json({ error: "Wrong Payment Mock Data", details: parsed.error.issues });
  }
  else {
    const result = await db.update(mockP24Tokens).set({
      status: 1
    }).where(eq(mockP24Tokens.token, parsed.data.sid)).run();
    return res.json({ message: "Payment mocked", result });
  }
}
)
router.post("/mockrefuse", async (req, res) => {
  const parsed = paymentMock.safeParse(req.body)
  if (!parsed.success) {
      return  res.status(400).json({ error: "Wrong Payment Mock Data", details: parsed.error.issues });
  }
  else {
    const result = await db.update(mockP24Tokens).set({
      status: -1
    }).where(eq(mockP24Tokens.token, parsed.data.sid)).run();
    return res.json({ message: "Payment mocked", result });
  }
}
)

type statusCodes = -1 | 0 | 1 | 2
type statusNames = 'Rejected'|'Pending'|'Paid'|'Archive'

const paymentStatusMap = new Map<statusCodes,statusNames>(
  [
    [-1, "Rejected"],
    [0, "Pending"],
    [1, "Paid"],
    [2, "Archive"],
  ]
)
const statusCheck = z.object(
  {
    sid : z.coerce.string() 
  }
)

function  isStatusCode(val: number): val is statusCodes{
  return val === -1 || val === 0 || val === 1 || val === 2;
}


router.post("/status", async (req, res) => {
  const parsed = statusCheck.safeParse(req.body)
  if (!parsed.success){
    return res.status(400).json({
      error: "Wrong type of sid or not sid"
    })
  }
  // zastapic na zapytanie do p24
  const statusData = await db.select({ status: mockP24Tokens.status }).from(mockP24Tokens).where(eq(mockP24Tokens.token, parsed.data.sid))
  if (statusData.length > 0){
    const status = Number(statusData[0].status)
    if (isStatusCode(status) || !Number.isFinite(status)){
      
    if (!paymentStatusMap.has(status as statusCodes)) {
      return res.status(500).json({
        error: "Status map missing entry",
        code: status,
      });
    }
    const statusName  = paymentStatusMap.get(status as statusCodes)!
      const updateRes = await db.update(payments).set({status : statusName}).where(eq(payments.token,parsed.data.sid!))
      return res.status(200).json({
        status : status
      })
    }
    return res.status(422).json({
    error: `Wrong status , sync issue with p24 codes`,
    sid: parsed.data.sid
  })


  } 
  return res.status(404).json({
    error: `Wrong sid , this sid didn't exist in our db`,
    sid: parsed.data.sid
  })
})



router.post("/begin", async (req, res) => {

  const parsed = PaymentsData.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Wrong Payment Data", details: parsed.error.issues });
  }
  const data = parsed.data;
  console.log("Parsed data:", data);

  const startDate = data.start;
  const endDate = data.end;
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay));
  const price = Math.round(Number(data.amount));

  let paymentId: number | undefined;
  try {
    db.transaction((tx) => {
      const u = tx.insert(users).values({
        email: data.email,
        phone: data.phone,
        name: data.name,
        surname: data.surname,
      }).run();
      const userId = Number(u.lastInsertRowid);

      const r = tx.insert(reservations).values({
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        arrivalTime: data.arrivalTime != null ? String(data.arrivalTime) : null,
        user_id: userId,
        nights,
        price,
        how_many_people: 2,
      }).run();
      const reservationId = Number(r.lastInsertRowid);

      const p = tx.insert(payments).values({
        token: data.sid,
        status: "begin",
        reservations_id: reservationId,
        user_id: userId,
      }).run();
      paymentId = Number(p.lastInsertRowid);
    });
  } catch (e: any) {
    return res.status(500).json({ error: "DB transaction failed", details: e?.message });
  }

    const P24_POS_ID = (process.env.P24_POS_ID ?? "").trim();
    const P24_API_KEY = (process.env.P24_API_KEY ?? "").trim();
    const baseUrl =  "https://sandbox.przelewy24.pl";

    if (!P24_POS_ID || !P24_API_KEY) {
        return res.status(500).json({ error: "Brak P24_POS_ID lub P24_API_KEY (REST API KEY z panelu)" });
    }
  const P24_CRC = (process.env.P24_CRC ?? "").trim();
  const sessionId = String(data.sid).slice(0, 100);

  const params = {
    sessionId: String(parsed.data.sid), // Tutaj należy umieścić unikalne wygenerowane ID sesji
    merchantId: Number(P24_POS_ID), // Tutaj należy umieścić ID Sprzedawcy z panelu Przelewy24
    amount: Number(parsed.data.amount), // Tutaj należy umieścić kwotę transakcji w groszach, 1234 oznacza 12,34 PLN
    currency: "PLN", // Tutaj należy umieścić walutę transakcji
    crc: String(P24_CRC) // Tutaj należy umieścić pobrany klucz CRC z panelu Przelewy24
  };
  // Sklejanie parametrów w ciąg
  const combinedString = JSON.stringify(params);
  const hash = crypto.createHash('sha384').update(combinedString).digest('hex');
  console.log('Suma kontrolna parametrów wynosi:', hash);
  const auth = Buffer.from(`${P24_POS_ID}:${P24_API_KEY}`).toString("base64");
  try {

    mockresponse()
    const response = await fetch(`${baseUrl}/api/v1/transaction/register`, {
      method: "POST",
      redirect: "manual",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        "merchantId": P24_POS_ID,
        "posId": P24_POS_ID,
        "sessionId": String(parsed.data.sid),
        "amount": parsed.data.amount,
        "currency": "PLN",
        "description": `Opłata za rezerwacje nr ${paymentId}`,
        "email": String(data.email),
        "client": `${data.name} ${data.surname}`,
        "country": "PL",
        "phone": String(data.phone),
        "language": "pl",
        "urlReturn": `https://podwawrzka.pl/${sessionId}`,
        "urlStatus": `https://podwawrzka.pl/payments/status/change/${sessionId}`,
        "sign": hash,
      }),
    });

    const raw = await response.text();
    let payload: any;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = { raw }; }

    console.log("STATUS:", response.status, response.statusText);
    if (!response.ok) {
      return res.status(response.status).json({
        error: "P24 register failed",
        details: payload,
      });
    }

    const token = payload?.data?.token ?? payload?.token;
    if (!token) {
      return res.status(502).json({ error: "Brak tokenu w odpowiedzi P24", details: payload });
    }

    const redirectBase =  "https://sandbox.przelewy24.pl";
    return res.json({ url: `${redirectBase}/trnRequest/${token}` });

  } catch (e: any) {
    return res.status(500).json({ error: "P24 register request failed", details: e?.message });
  }
});


export default router;
