import { response, Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { mockP24Tokens, payments, reservations, users } from "../db/schema";
import * as crypto from "crypto";
import { and, or, gte, lte, sql, count, eq } from "drizzle-orm";
import winston, { child } from "winston"
import { sendSMS,sendEmail } from "./clientNotify";
import { stat } from "fs";
const { combine, timestamp, errors, json } = winston.format;
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(),errors({ stack: true }), json()),
  transports: [new winston.transports.File({filename: 'logs/payments.log'}), new winston.transports.Console()],
  defaultMeta: {service: "payments-route"},
  exceptionHandlers:[
    new winston.transports.File({filename: "logs/exeptions.log"})
  ]
});

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
        arrivalTime: z.number(),
        guestNumber: z.number()
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
    merchantId: z.coerce.number(),
    posId: z.coerce.number(),
    sessionId: z.coerce.string(),
    amount: z.coerce.number(),
    currency: z.coerce.string(),
    orderId: z.coerce.number(),
    sign: z.coerce.string()
  }
)

function  isStatusCode(val: number): val is statusCodes{
  return val === -1 || val === 0 || val === 1 || val === 2;
}





router.post("/status", async (req, res) => {
  const parsed = statusCheck.safeParse(req.body);
  if (!parsed.success) {
    logger.error("Wrong body from P24");
    return res.status(400).json({
      error: "Wrong body from P24",
    });
  }

  console.log("recived body:", parsed.data);

  const sid = parsed.data.sessionId;
  const payStatuslogger = logger.child({ sid });

  const P24_POS_ID = (process.env.P24_POS_ID ?? "").trim();
  const P24_API_KEY = (process.env.P24_API_KEY ?? "").trim();
  const P24_CRC = (process.env.P24_CRC ?? "").trim();
  const baseUrl = "https://sandbox.przelewy24.pl";

  const auth = Buffer.from(`${P24_POS_ID}:${P24_API_KEY}`).toString("base64");

  const amount: number = Number(parsed.data.amount);
  const orderId: number = Number(parsed.data.orderId);
  const currency: string = parsed.data.currency; 
  payStatuslogger.info("sending a request to p24");

  const signParams = {
    sessionId: sid,
    orderId,
    amount,
    currency,
    crc: P24_CRC,
  };

  const hash = crypto
    .createHash("sha384")
    .update(JSON.stringify(signParams))
    .digest("hex");

  console.log("LOCAL HASH (verify sign):", hash);

  const p24response = await fetch(baseUrl + "/api/v1/transaction/verify", {
    method: "PUT",
    redirect: "manual",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchantId: P24_POS_ID,
      posId: P24_POS_ID,
      sessionId: sid,
      amount,
      currency,
      orderId,
      sign: hash,
    }),
  });

  console.log("P24 RESPONSE STATUS:", p24response.status);
  const rawResp = await p24response.text();
  console.log("P24 RAW RESPONSE:", rawResp);

  if (!p24response.ok) {
    payStatuslogger.error(
      "P24 verify failed",
      { status: p24response.status, rawResp },
    );
    return res
      .status(502)
      .json({ error: "P24 verify failed", status: p24response.status, rawResp });
  }

  let payload: any;
  try {
    payload = rawResp ? JSON.parse(rawResp) : null;
  } catch {
    payload = { rawResp };
  }

  const status = payload?.data?.status ?? "";
  if (status !== "") {
    await db
      .update(payments)
      .set({ status }) // poprawka: musi być obiekt
      .where(eq(payments.token, sid));
      const orderinfo = await db
      .select()
      .from(reservations)
      .innerJoin(users, eq(users.id, reservations.user_id))
      .where(eq(reservations.id, orderId));


      if (status == 'success'){
        sendEmail(orderinfo[0].users.email,amount/100,orderId,orderinfo[0].users.name ?? "Niepodano", orderinfo[0].reservations.arrivalTime ?? "Niepodano",
           orderinfo[0].reservations.how_many_people ?? 0, orderinfo[0].reservations.start,orderinfo[0].reservations.end);
        // sendSMS("Dziękujemy za rezerwację","+48739973665");
      }
  }
  if (status == ""){

  }
  return res.status(200).json({ status });
});


const PaymentStatus = z.object(
  {
    sid : z.coerce.string()
  }

)

router.post("/checkpayment", async (req, res) => {
  const parsed = PaymentStatus.safeParse(req.body)
  if (!parsed.success){
    return res.status(400).json({
      paymentStatus : "error",
      errDescription : "Wrong SessionID Format"
    })
  }

  const sid = parsed.data.sid
  console.log("Checking payment status for SID:", sid);
  let result;
  console.log(await db.select().from(payments).where(eq(payments.token, sid)));
  try{
    result = await db.select({ status: payments.status }).from(payments).where(eq(payments.token, sid))
  }
  catch{
    return res.status(402).json({
      paymentStatus : "error",
      errDescription : "Database connection cannot be established , try again later"
    })
  }
  if (result[0]){
    const status = result[0].status
    return res.status(200).json({ paymentStatus: status })
    }
  else{
    return res.status(404).json({
      paymentStatus : "error",
      errDescription : "Wrong SessionID"
    })
  }
})


router.post("/begin", async (req, res) => {
  const parsed = PaymentsData.safeParse(req.body);
  if (!parsed.success) {

    console.log("here")
    return res.status(400).json({ error: "Wrong Payment Data", details: parsed.error.issues });
  }
  const data = parsed.data;
  console.log("Parsed data:", data);

  const startDate = data.start;
  const endDate = data.end;
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay));
  const price = Math.round(Number(data.amount));
  const guestNumber = data.guestNumber;

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
        how_many_people: guestNumber,
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
  const combinedString = JSON.stringify(params);
  const hash = crypto.createHash('sha384').update(combinedString).digest('hex');
  console.log('Suma kontrolna parametrów wynosi:', hash);
  const auth = Buffer.from(`${P24_POS_ID}:${P24_API_KEY}`).toString("base64");
  try {
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
        "urlReturn": `http://46.224.13.142:3000/paymentStatus/${sessionId}`,
        "urlStatus": `http://46.224.13.142:3100/payments/status`,
        "sign": hash,
      }),
    });

    const raw = await response.text();
    let payload: any;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = { raw }; }
    console.log("P24 REGISTER RESPONSE:", payload);
    if (!response.ok) {
      return res.status(response.status).json({
        error: "P24 register failed",
        details: payload,
      });
    }

    const p24token = payload?.data?.token ?? payload?.token;
    
    try{
      db.transaction((tx) => {
        tx.update(payments).set({p24_token : p24token}).where(eq(payments.token, sessionId)).run()
      })
    } catch (e: any) {
      return res.status(500).json({ error: "DB transaction failed", details: e?.message });
    }

    if (!p24token) {
      return res.status(502).json({ error: "Brak tokenu w odpowiedzi P24", details: payload });
    }

    const redirectBase =  "https://sandbox.przelewy24.pl";
    return res.json({ url: `${redirectBase}/trnRequest/${p24token}` });

  } catch (e: any) {
    return res.status(500).json({ error: "P24 register request failed", details: e?.message });
  }
});


export default router;
