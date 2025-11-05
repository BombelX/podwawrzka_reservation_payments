import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { payments, reservations, users } from "../db/schema";
import * as crypto from "crypto";

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




    // router.post("/begin",async (req,res) =>{
    //     const paredData = PaymentsData.safeParse(req.body);
    //     if (!paredData.success){
    //         return res.status(400).json({
    //             error:"Wrong Payment Data",
    //             details:paredData.error.issues
    //         })
    //     }
    //     console.log("paredData:",paredData);
    //     let payment_id : number | undefined;
    //     //to-do sprawdzic czy napewno niema tu zadneij rezerwacji w tej dacie 
    //     db.transaction((tx) => {
    //         const u = tx.insert(users).values({
    //             email: paredData.data.email,
    //             phone: paredData.data.phone,
    //         }).run();
    //         const user_id = Number(u.lastInsertRowid);

    //         const r = tx.insert(reservations).values({
    //             start: paredData.data.start.toISOString(),
    //             end: paredData.data.end.toISOString(),
    //             arrivalTime: paredData.data.arrivalTime
    //             ? paredData.data.arrivalTime.toString()
    //             : null,
    //         }).run();
    //         const reservation_id = Number(r.lastInsertRowid);

    //         const p = tx.insert(payments).values({
    //             token: -1,
    //             status: "begin",
    //             reservations_id: reservation_id,
    //             user_id: user_id,
    //         }).run();
    //         payment_id = Number(p.lastInsertRowid);
    //         });

    //         // Wymagane zmienne środowiskowe z panelu P24
    //         // Używamy wyłącznie REST API KEY (nie report key!)
    //         const P24_API_KEY = (process.env.P24_API_KEY ?? "").trim();
    //         const P24_CRC = (process.env.P24_CRC ?? "").trim();
    //         const P24_POS_ID_STR = (process.env.P24_POS_ID ?? "").trim();
    //         const P24_POS_ID = Number(P24_POS_ID_STR);
    //         const P24_MERCHANT_ID = Number((process.env.P24_MERCHANT_ID ?? "").trim());
    //         const sandbox = String(process.env.P24_SANDBOX ?? "true").toLowerCase() === "true";
    //         const baseUrl = sandbox
    //             ? "https://sandbox.przelewy24.pl"
    //             : "https://secure.przelewy24.pl";


    //         if (!P24_MERCHANT_ID || !P24_POS_ID || !P24_API_KEY || !P24_CRC) {
    //             return res.status(500).json({
    //                 error: "Brak konfiguracji P24",
    //                 missing: {
    //                     P24_MERCHANT_ID: !!P24_MERCHANT_ID,
    //                     P24_POS_ID: !!P24_POS_ID,
    //                     P24_API_KEY: !!P24_API_KEY, // musi to być REST API KEY
    //                     P24_CRC: !!P24_CRC,
    //                 },
    //             });
    //         }

    //         // Kwota w groszach (minor units). Jeśli przyjdzie 123.45 -> 12345
    //         const rawAmount = Number(paredData.data.amount);
    //         const amount = Number.isInteger(rawAmount) ? rawAmount : Math.round(rawAmount * 100);

    //         // Obliczenie podpisu (sign) wymagane przez P24: sha384("sessionId|merchantId|amount|currency|crc")
    //         const signBase = `${String(paredData.data.sid)}|${P24_MERCHANT_ID}|${amount}|PLN|${P24_CRC}`;
    //         const hash = crypto.createHash('sha384').update(signBase).digest('hex');

    //         // Authorization: Basic base64("POS_ID:API_KEY")
    //         const basicToken = Buffer.from(`${P24_POS_ID_STR}:${P24_API_KEY}`).toString('base64');
    //         console.log("[P24] Using", sandbox ? "SANDBOX" : "PROD", "environment");
    //         console.log("[P24] Register endpoint:", `${baseUrl}/api/v1/transaction/register`);
    //         console.log("[P24] Basic auth username (posId):", P24_POS_ID_STR);

    //         const response = await fetch(`${baseUrl}/api/v1/transaction/register`,
    //             {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     "Accept": "application/json",
    //                     "Authorization": `Basic ${basicToken}`,
    //                 },
    //                 body: JSON.stringify({
    //                     merchantId: P24_MERCHANT_ID,
    //                     posId: P24_POS_ID,
    //                     sessionId: `${String(paredData.data.sid)}`,
    //                     amount,
    //                     currency: "PLN",
    //                     description: `Opłata za rezerwacje nr ${payment_id}`,
    //                     email: paredData.data.email,
    //                     client: `${paredData.data.name} ${paredData.data.surname}`,
    //                     country: "PL",
    //                     phone: paredData.data.phone,
    //                     language: "pl",
    //                     urlReturn: `https://podwawrzka.pl/${String(paredData.data.sid)}`,
    //                     urlStatus: `https://podwawrzka.pl/payments/status/change/${String(paredData.data.sid)}`,
    //                     timeLimit: 0,
    //                     waitForResult: true,
    //                     regulationAccept: true,
    //                     transferLabel: `tranzakcja nr. ${payment_id}`,
    //                     sign: `${hash}`,
    //                 })
    //             }
    //         )
    //     console.log("STATUS:", response.status, response.statusText);
    //     console.log("WWW-AUTHENTICATE:", response.headers.get("www-authenticate"));

    //     let payload: any = null;
    //     const raw = await response.text();
    //     try {
    //         payload = raw ? JSON.parse(raw) : null;
    //     } catch {
    //         payload = { raw };
    //     }
    //     console.log("RESPONSE_BODY:", payload);

    //     if (!response.ok) {
    //         return res.status(response.status).json({ error: "P24 register failed", details: payload });
    //     }

    //     const token = payload?.data?.token ?? payload?.token;
    //     if (!token) {
    //         return res.status(502).json({ error: "Brak tokenu w odpowiedzi P24", details: payload });
    //     }
    //     const redirectBase = sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
    //     return res.json({ url: `${redirectBase}/trnRequest/${token}` });

    // })

router.post("/begin", async (req, res) => {

  const parsed = PaymentsData.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Wrong Payment Data", details: parsed.error.issues });
  }
  const data = parsed.data;
  console.log("Parsed data:", data);

  let paymentId: number | undefined;
  try {
    db.transaction((tx) => {
      const u = tx.insert(users).values({
        email: data.email,
        phone: data.phone,
      }).run();
      const userId = Number(u.lastInsertRowid);

      const r = tx.insert(reservations).values({
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        arrivalTime: data.arrivalTime != null ? String(data.arrivalTime) : null,
      }).run();
      const reservationId = Number(r.lastInsertRowid);

      const p = tx.insert(payments).values({
        token: -1,
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
  // sessionId (<=100 znaków zgodnie z zaleceniami)
  const sessionId = String(data.sid).slice(0, 100);

  // sign = sha384("sessionId|merchantId|amount|currency|crc")
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
      // 401/403 itp. – zwracamy pełny kontekst do debugowania
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
