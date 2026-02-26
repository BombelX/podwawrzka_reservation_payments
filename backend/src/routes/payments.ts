import e, { response, Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { mockP24Tokens, payments, reservations, specialPrices, users } from "../db/schema";
import * as crypto from "crypto";
import { and, or, gte, lte, sql, count, eq ,lt, gt, inArray} from "drizzle-orm";
import winston, { child } from "winston"
import { sendSMS,sendEmail } from "./clientNotify";
import { cached3rdPartyReservations, sync3PartyReservations} from "./reservations";
import { stat } from "fs";
import { s } from "react-router/dist/development/index-react-server-client-BSxMvS7Z";
import { ba } from "react-router/dist/development/instrumentation-iAqbU5Q4";
// import { settings } from "cluster";
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

const PAID_PAYMENT_STATUSES = ["success", "paid", "Paid"] as const;
const FAILED_PAYMENT_STATUSES = ["error", "failed", "rejected", "cancelled", "canceled", "declined", "archive", "Archive", "expired", "timeout"] as const;
const BLOCKING_PAYMENT_STATUSES = ["begin", "pending", "Pending", ...PAID_PAYMENT_STATUSES] as const;
const STALE_PENDING_PAYMENT_STATUSES = ["begin", "pending", "Pending"] as const;
const PAYMENT_PENDING_TTL_MINUTES = Number(process.env.PAYMENT_PENDING_TTL_MINUTES ?? 30);

function normalizeStatus(status: string): string {
  return String(status ?? "").trim().toLowerCase();
}

function isPaidStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return PAID_PAYMENT_STATUSES.some((s) => s.toLowerCase() === normalized);
}

function isFailedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return FAILED_PAYMENT_STATUSES.some((s) => s.toLowerCase() === normalized);
}

function mapToFrontendPaymentStatus(status: string): "success" | "pending" | "error" {
  if (isPaidStatus(status)) return "success";
  if (isFailedStatus(status)) return "error";
  return "pending";
}

async function releaseReservationForFailedPayment(sid: string, failedStatus: string) {
  const linked = await db
    .select({ reservationId: payments.reservations_id })
    .from(payments)
    .where(eq(payments.token, sid))
    .limit(1);

  db.transaction((tx) => {
    tx.update(payments).set({ status: failedStatus }).where(eq(payments.token, sid)).run();

    const reservationId = linked[0]?.reservationId;
    if (reservationId != null) {
      tx.delete(reservations).where(eq(reservations.id, reservationId)).run();
    }
  });
}

function isCreatedAtStale(createdAt: string): boolean {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) return false;
  return parsed <= Date.now() - PAYMENT_PENDING_TTL_MINUTES * 60 * 1000;
}

export async function cleanupStalePendingPayments(targetSid?: string): Promise<number> {
  const conditions = [inArray(payments.status, STALE_PENDING_PAYMENT_STATUSES as unknown as string[])];
  if (targetSid) {
    conditions.push(eq(payments.token, targetSid));
  }

  const candidates = await db
    .select({ sid: payments.token, createdAt: payments.created_at })
    .from(payments)
    .where(and(...conditions));

  const stale = candidates.filter((p) => isCreatedAtStale(p.createdAt));

  for (const payment of stale) {
    await releaseReservationForFailedPayment(payment.sid, "expired");
  }

  return stale.length;
}

// const ReservationMonth = z.object({
//     month: z.coerce.number().int().min(0).max(11),
//     year: z.coerce.number().int().min(2023)
// })

function toUtcMidnightISO(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

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
        arrivalTime: z.string(),
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

  // console.log("LOCAL HASH (verify sign):", hash);

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
    await releaseReservationForFailedPayment(sid, "error");
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
    if (isFailedStatus(status)) {
      await releaseReservationForFailedPayment(sid, normalizeStatus(status));
    } else {
      await db
        .update(payments)
        .set({ status }) 
        .where(eq(payments.token, sid));
    }


      const orderinfo = await db.select().from(payments).innerJoin(reservations, eq(payments.reservations_id, reservations.id)).innerJoin(users, eq(payments.user_id, users.id)
       ).where(eq(payments.token, sid)).limit(1);

      console.log(orderinfo.length);


      if (isPaidStatus(status) && orderinfo.length > 0){
          sendEmail(orderinfo[0].users.email,amount/100,orderId,sid,orderinfo[0].users.name ?? "Niepodano", orderinfo[0].reservations.arrivalTime ?? "Niepodano",
          orderinfo[0].reservations.how_many_people ?? 0, orderinfo[0].reservations.start,orderinfo[0].reservations.end);

          sendSMS("Dziękujemy za rezerwację w dniach od " +  new Date(orderinfo[0].reservations.start).getDate()+"."+ (new Date(orderinfo[0].reservations.start).getMonth()+1) 
          + "." + new Date(orderinfo[0].reservations.start).getFullYear() + " do " + new Date(orderinfo[0].reservations.end).getDate() +"."+ 
          (new Date(orderinfo[0].reservations.end).getMonth()+1) + "." + new Date(orderinfo[0].reservations.end).getFullYear()+ "\n Czekamy na Was! ","+48739973665");
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
  await cleanupStalePendingPayments(sid);
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
    if (isFailedStatus(status)) {
      await releaseReservationForFailedPayment(sid, normalizeStatus(status));
    }
    return res.status(200).json({ paymentStatus: mapToFrontendPaymentStatus(status) })
    }
  else{
    return res.status(404).json({
      paymentStatus : "error",
      errDescription : "Wrong SessionID"
    })
  }
})


async function checkReservationConflicts(
  data: z.infer<typeof PaymentsData>
): Promise<boolean> {
  if (data.start >= data.end) return false;

  await sync3PartyReservations();

  for (const reservation of cached3rdPartyReservations.values()) {
      const rs = new Date(reservation.start).toISOString().split('T')[0];
      const re = new Date(reservation.end).toISOString().split('T')[0];
      const ds = data.start.toLocaleDateString('en-CA');
      
      
      const de = new Date(data.end).toISOString().split('T')[0];
      // console.log(`DDEBUG: Sprawdzam rezerwację ${reservation.start} - ${reservation.end}`);
      // console.log(`DDEBUG: rs: ${rs}, de: ${de} | re: ${re}, ds: ${ds}`);
      // console.log(`DDEBUG: Czy rs < de? ${rs < de} | Czy re > ds? ${re > ds}`);
    if (rs < de && re > ds) {
      console.log("Found 3rd party reservation conflicts:", reservation);
      return false;
    }
  }

  const startISO = data.start.toISOString();
  const endISO = data.end.toISOString();


  const now = new Date();
  if (data.start < now) {
    console.log("Attempt to make reservation in the past:", data.start);
    return false;
  }


  const resp = await db
    .select({ reservationId: reservations.id })
    .from(reservations)
    .innerJoin(payments, eq(payments.reservations_id, reservations.id))
    .where(
      and(
        lt(reservations.start, endISO),
        gt(reservations.end, startISO),
        inArray(payments.status, BLOCKING_PAYMENT_STATUSES as unknown as string[])
      )
    );

  if (resp.length > 0) {
    console.log("Found reservation conflicts in DB:", resp);
    return false;
  }

  return true;
}

function priceCheck( nights: number, guestNumber: number,start: Date,end: Date) {
  const settings = require("../settings.json");
  let totalPrice = nights *( settings.pricePerPerson * (guestNumber-1) + settings.basePrice); ;

  const res = db.select().from(specialPrices).where(and(gte(specialPrices.date, start.toISOString()), lte(specialPrices.date, end.toISOString()))).all();
  for (const reserv of res){
    totalPrice += Math.max(0, reserv.price-settings.basePrice);
  }


  for (let day = new Date(start); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    const dayOfWeek = day.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      totalPrice += settings.weekendIncrease;
    }
    if (settings.fixedHolidays.includes(`${day.getUTCMonth() + 1}-${day.getUTCDate()}`)) {
      totalPrice += settings.holidayIncrease;
    }
  }
  return totalPrice;
}

router.post("/begin", async (req, res) => {
  await cleanupStalePendingPayments();

  const parsed = PaymentsData.safeParse(req.body);
  if (!parsed.success) {

    console.log("here")
    return res.status(400).json({ error: "Wrong Payment Data", details: parsed.error.issues });
  }
  const data = parsed.data;
  console.log("Parsed data:", data);

  const startDate = data.start;
  const endDate = data.end;

  if (endDate <= startDate) {
    return res.status(400).json({ error: "End date must be after start date" });
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay));
  const price = Math.round(Number(data.amount));
  const guestNumber = data.guestNumber;
  const settings = require("../settings.json");

  if (nights < settings.minDuration) {
    return res.status(400).json({ error: "Reservation is too short" });
  }

  const calculatedPrice = priceCheck(nights, guestNumber,startDate,endDate);
  if (price < calculatedPrice) {
    return res.status(400).json({ error: "Price is too low", expected: calculatedPrice });
  }
  // reservation check
  if (!(await checkReservationConflicts(data))) {
    return res.status(400).json({ error: "Reservation conflicts detected" });
  }

  console.log("No reservation conflicts detected, proceeding with payment initiation.");

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
        start: toUtcMidnightISO(data.start),
        end: toUtcMidnightISO(data.end),
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
        created_at: new Date().toISOString(),
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
        "urlReturn": `https://rezerwacje.podwawrzka.pl/paymentStatus/${sessionId}`,
        "urlStatus": `https://rezerwacje.podwawrzka.pl/api/payments/status`,
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
