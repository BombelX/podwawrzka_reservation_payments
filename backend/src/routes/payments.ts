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
    // testAccess wymaga Basic auth na bazie POS_ID i API_KEY (nie report key!)
    const P24_POS_ID = (process.env.P24_POS_ID ?? "").trim();
    // UWAGA: używamy wyłącznie REST API KEY. Report key nie działa do Basic Auth i spowoduje 401.
    const P24_API_KEY = (process.env.P24_API_KEY ?? "").trim();
    const sandbox = String(process.env.P24_SANDBOX ?? "true").toLowerCase() === "true";
    const baseUrl = sandbox
        ? "https://sandbox.przelewy24.pl"
        : "https://secure.przelewy24.pl";

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
  // 1) Walidacja wejścia
  const parsed = PaymentsData.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Wrong Payment Data", details: parsed.error.issues });
  }
  const data = parsed.data;

  // 2) Zapis bazowy (user/reservation/payment) w 1 transakcji
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

  // 3) Konfiguracja P24 (używamy PROD/SANDBOX spójnie)
  const sandbox = String(process.env.P24_SANDBOX ?? "true").toLowerCase() === "true";
  const baseUrl = sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";

  const P24_POS_ID_STR = (process.env.P24_POS_ID ?? "").trim();
  const P24_API_KEY    = (process.env.P24_API_KEY ?? "").trim(); // bez fallbacku – unikamy pomyłek środowisk
  const P24_MERCHANT_ID_STR = (process.env.P24_MERCHANT_ID ?? P24_POS_ID_STR).trim(); // domyślnie = POS
  const P24_CRC        = (process.env.P24_CRC ?? "").trim();

  if (!P24_POS_ID_STR || !P24_API_KEY || !P24_MERCHANT_ID_STR || !P24_CRC) {
    return res.status(500).json({
      error: "Brak konfiguracji P24",
      missing: {
        P24_POS_ID: !!P24_POS_ID_STR,
        P24_API_KEY: !!P24_API_KEY,
        P24_MERCHANT_ID: !!P24_MERCHANT_ID_STR,
        P24_CRC: !!P24_CRC,
      },
    });
  }

  const posId = Number(P24_POS_ID_STR);
  const merchantId = Number(P24_MERCHANT_ID_STR);
  if (!Number.isFinite(posId) || !Number.isFinite(merchantId)) {
    return res.status(500).json({ error: "POS_ID / MERCHANT_ID muszą być liczbami całkowitymi" });
  }

  // 4) Przygotowanie pól transakcji
  // kwota w groszach (jeśli przyszła 123.45 -> 12345), u Ciebie już przychodzi 10000, więc pozostaje 10000
  const rawAmount = Number(data.amount);
  const amount = Number.isInteger(rawAmount) ? rawAmount : Math.round(rawAmount * 100);

  // sessionId (<=100 znaków zgodnie z zaleceniami)
  const sessionId = String(data.sid).slice(0, 100);

  // sign = sha384("sessionId|merchantId|amount|currency|crc")
  const signBase = `${sessionId}|${merchantId}|${amount}|PLN|${P24_CRC}`;
  const sign = crypto.createHash("sha384").update(signBase).digest("hex");

  // Basic Auth = base64("posId:apiKey")
  const basic = Buffer.from(`${P24_POS_ID_STR}:${P24_API_KEY}`).toString("base64");

  // 5) Rejestracja transakcji w P24
  try {
    console.log("[P24] Using", sandbox ? "SANDBOX" : "PROD", "environment");
    console.log("[P24] Register endpoint:", `${baseUrl}/api/v1/transaction/register`);
    console.log("[P24] posId:", posId, "merchantId:", merchantId);
    console.log("[P24] signBase:", signBase);

    const response = await fetch(`${baseUrl}/api/v1/transaction/register`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchantId,
        posId,
        sessionId,
        amount,
        currency: "PLN",
        description: `Opłata za rezerwacje nr ${paymentId}`,
        email: data.email,
        client: `${data.name} ${data.surname}`,
        country: "PL",
        phone: data.phone,
        language: "pl",
        urlReturn: `https://podwawrzka.pl/${sessionId}`,
        urlStatus: `https://podwawrzka.pl/payments/status/change/${sessionId}`,
        timeLimit: 0,
        waitForResult: true,
        regulationAccept: true,
        transferLabel: `tranzakcja nr. ${paymentId}`,
        sign,
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

    const redirectBase = sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
    return res.json({ url: `${redirectBase}/trnRequest/${token}` });

  } catch (e: any) {
    return res.status(500).json({ error: "P24 register request failed", details: e?.message });
  }
});


export default router;
