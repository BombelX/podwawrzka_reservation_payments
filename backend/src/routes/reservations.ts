import { Router } from "express";
import { date, set, z } from "zod";
import { db } from "../db/client";
import { reservations, users } from "../db/schema";
import { and, or, gte, lte,lt,gt, sql, count, eq } from "drizzle-orm";
import { parse } from "node:path";
import { error } from "node:console";
import * as icalParse from "node-ical";
import icalgen, { ICalCalendarMethod } from "ical-generator";
import { start } from "node:repl";

const router = Router();

const ReservationMonth = z.object({
    month: z.coerce.number().int().min(0).max(11),
    year: z.coerce.number().int().min(2023)
})

let cached3rdPartyReservations: Set<z.infer<typeof Reservation3rdParty>> = new Set();
export { cached3rdPartyReservations };
/**
 * @openapi
 * /reservations/already:
 *   get:
 *     summary: List of reservations from specified month
 *     description: Returning all reservation for specified month
 *     tags:
 *       - Reservations
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 11
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       '400':
 *         description: Nieprawidłowe parametry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const Reservation3rdParty = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});
function parseApiDate(s: string): Date {
  if (s.includes("T")) return new Date(s);
  return new Date(s + "T00:00:00");
}
type Reservation3rdPartyT = z.infer<typeof Reservation3rdParty>;

async function addIcsToSet(url: string, set: Set<Reservation3rdPartyT>) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`iCal fetch failed: ${res.status} ${res.statusText}`);

  const icsText = await res.text();
  const events = icalParse.parseICS(icsText);

  const now = new Date();

  for (const e of Object.values(events)) {
    const event = e as icalParse.VEvent;
    if (event.type !== "VEVENT") continue;
    if (!event.start || !event.end) continue;
    if (event.end <= now) continue;

    const reservation = Reservation3rdParty.parse({
      start: new Date(event.start).toISOString(),
      end: new Date(event.end).toISOString(),
    });

    set.add(reservation);
  }
}



export async function sync3PartyReservations() {
  const tempSet = new Set<Reservation3rdPartyT>();

  const icalUrl1 = process.env.THIRD_PARTY_ICAL_URL_1;
  const icalUrl2 = process.env.THIRD_PARTY_ICAL_URL_2;

  if (!icalUrl1 && !icalUrl2) {
    console.log("No 3rd party ical urls provided, skipping sync");
    return;
  }

  try {
    if (icalUrl1) await addIcsToSet(icalUrl1, tempSet);
    if (icalUrl2) await addIcsToSet(icalUrl2, tempSet);
  } catch (e) {
    console.error("3rd party iCal sync failed:", e);
    return;
  }

  console.log(tempSet);
  cached3rdPartyReservations = tempSet;


}



const ReservationRequest = z.object({
    start: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    end: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    guestName: z.string().min(1),
    guestSurname: z.string().min(1),
    guestEmail: z.string().email(),
    guestPhone: z.string().min(1),
    arrivalTime: z.string().optional(),
    nights: z.coerce.number(),
    price: z.coerce.number(),
    how_many_people: z.coerce.number().optional().default(2),
});



router.post("/make", async (req, res) => {
  console.log("[REQ] /reservations/make query:", req.query);

  const parsed = ReservationRequest.safeParse(req.query);
  if (!parsed.success) {
    console.log("[VALIDATION ERROR]", parsed.error.issues);
    return res.status(400).json({
      error: "Invalid reservation data",
      details: parsed.error.issues,
      received: req.query,
    });
  }

  const startDate = parseApiDate(parsed.data.start);
  const today: Date = new Date();
  if (startDate < today) {
    return res.status(400).json({ error: "Nie da się zarezerować przeszłości" });
  }

  await sync3PartyReservations(); 

  for (const r of cached3rdPartyReservations.values()) { 
    const rs = new Date(r.start);
    const re = new Date(r.end);
    const ns = parseApiDate(parsed.data.start);
    const ne = parseApiDate(parsed.data.end);
    if (rs < ne && re > ns) {
      return res.status(400).json({ error: "Termin zajęty (3rd party)" });
    }
  }

  const resultOccupied = await db
    .select({ count: count() })
    .from(reservations)
    .where(
      and(
        lt(reservations.start, parsed.data.end), 
        gt(reservations.end, parsed.data.start) 
      )
    );

  const occupiedCount = Number(resultOccupied[0]?.count ?? 0);

  if (occupiedCount === 0) {
    console.log("Można Zarezerwować");

    let usr_id: number;

    const isUsers = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, parsed.data.guestEmail),
          eq(users.phone, parsed.data.guestPhone)
        )
      );

    if (isUsers.length === 0) {
      const insertUsers = await db.insert(users).values({
        email: parsed.data.guestEmail,
        phone: parsed.data.guestPhone,
        name: parsed.data.guestName,
        surname: parsed.data.guestSurname,
      });
      usr_id = insertUsers.lastInsertRowid as number;
    } else {
      usr_id = isUsers[0].id;
    }

    const insertReservation = await db.insert(reservations).values({
      start: parsed.data.start,
      end: parsed.data.end,
      user_id: usr_id,
      arrivalTime: parsed.data.arrivalTime,
      how_many_people: parsed.data.how_many_people,
      nights: parsed.data.nights,
      price: parsed.data.price,
    });

    return res.status(200).json({
      success: "Zarezerwowano pomyślnie",
      reservationId: insertReservation.lastInsertRowid,
    });
  } else {
    return res.status(400).json({ error: "Ktoś zarezerowwał ten termin przed toba :c" });
  }
});



router.get("/all", async(_req,res) =>{
    const calendar = icalgen({name: 'podwawrzka_all_reservations'})
    calendar.method(ICalCalendarMethod.PUBLISH);
    const today = new Date().toISOString()
    const result = await db.select({id:reservations.id,start:reservations.start,end:reservations.end}).from(reservations).where(
        gte(reservations.end,today)
    )

    for (const resv of result){
        calendar.createEvent({
            id: `reservation@${resv.id}@podwawrzka`,
            start: new Date(resv.start),
            end: new Date(resv.end),
            summary: "Zarezerwowane",
            description: "Termin zarezerwowany",
            allDay: true
        })

    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=300"); 
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="reservations.ics"');
    return res.send(calendar.toString());
})

router.get("/already", async (req, res) => {
  const parsed = ReservationMonth.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Wrong Month or year",
      details: parsed.error.issues,
    });
  }
  await sync3PartyReservations();
  const { month, year } = parsed.data;

  const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const monthEndExclusive = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));

  const monthStartStr = monthStart.toISOString();
  const monthEndStr = monthEndExclusive.toISOString();

  const dbRes = await db
    .select({
      start: reservations.start, 
      end: reservations.end, 
    })
    .from(reservations)
    .where(
      and(
        lt(reservations.start, monthEndStr),
        gt(reservations.end, monthStartStr)
      )
    );

  const third = Array.from(cached3rdPartyReservations).filter((r) => {
    const rs = new Date(r.start);
    const re = new Date(r.end);
    return rs < monthEndExclusive && re > monthStart; 
  });
    console.log("month/year", month, year);
    console.log("dbRes", dbRes.length, "cached3rdParty", cached3rdPartyReservations.size, "third", third.length);

  return res.json([...dbRes, ...third]);
});


export default router;
