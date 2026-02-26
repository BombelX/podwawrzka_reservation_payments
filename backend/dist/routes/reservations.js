"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cached3rdPartyReservations = void 0;
exports.sync3PartyReservations = sync3PartyReservations;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const icalParse = __importStar(require("node-ical"));
const ical_generator_1 = __importStar(require("ical-generator"));
const router = (0, express_1.Router)();
const BLOCKING_PAYMENT_STATUSES = ["begin", "pending", "Pending", "success", "paid", "Paid"];
const ReservationMonth = zod_1.z.object({
    month: zod_1.z.coerce.number().int().min(0).max(11),
    year: zod_1.z.coerce.number().int().min(2023)
});
let cached3rdPartyReservations = new Set();
exports.cached3rdPartyReservations = cached3rdPartyReservations;
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
const Reservation3rdParty = zod_1.z.object({
    start: zod_1.z.string().datetime(),
    end: zod_1.z.string().datetime(),
});
function parseApiDate(s) {
    if (s.includes("T"))
        return new Date(s);
    return new Date(s + "T00:00:00");
}
async function addIcsToSet(url, set) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok)
        throw new Error(`iCal fetch failed: ${res.status} ${res.statusText}`);
    const icsText = await res.text();
    const events = icalParse.parseICS(icsText);
    const now = new Date();
    for (const e of Object.values(events)) {
        const event = e;
        if (event.type !== "VEVENT")
            continue;
        if (!event.start || !event.end)
            continue;
        if (event.end <= now)
            continue;
        const reservation = Reservation3rdParty.parse({
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
        });
        set.add(reservation);
    }
}
async function sync3PartyReservations() {
    const tempSet = new Set();
    const icalUrl1 = process.env.THIRD_PARTY_ICAL_URL_1;
    const icalUrl2 = process.env.THIRD_PARTY_ICAL_URL_2;
    const icalUrl3 = process.env.THIRD_PARTY_ICAL_URL_3;
    if (!icalUrl1 && !icalUrl2 && !icalUrl3) {
        console.log("No 3rd party ical urls provided, skipping sync");
        return;
    }
    try {
        if (icalUrl2)
            await addIcsToSet(icalUrl2, tempSet);
        if (icalUrl3)
            await addIcsToSet(icalUrl3, tempSet);
        if (icalUrl1)
            await addIcsToSet(icalUrl1, tempSet);
    }
    catch (e) {
        console.error("3rd party iCal sync failed:", e);
        return;
    }
    // console.log(tempSet);
    exports.cached3rdPartyReservations = cached3rdPartyReservations = tempSet;
}
const ReservationRequest = zod_1.z.object({
    start: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    end: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    guestName: zod_1.z.string().min(1),
    guestSurname: zod_1.z.string().min(1),
    guestEmail: zod_1.z.string().email(),
    guestPhone: zod_1.z.string().min(1),
    arrivalTime: zod_1.z.string().optional(),
    nights: zod_1.z.coerce.number(),
    price: zod_1.z.coerce.number(),
    how_many_people: zod_1.z.coerce.number().optional().default(2),
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
    const today = new Date();
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
    const resultOccupied = await client_1.db
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(schema_1.reservations)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.reservations.start, parsed.data.end), (0, drizzle_orm_1.gt)(schema_1.reservations.end, parsed.data.start)));
    const occupiedCount = Number(resultOccupied[0]?.count ?? 0);
    if (occupiedCount === 0) {
        console.log("Można Zarezerwować");
        let usr_id;
        const isUsers = await client_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, parsed.data.guestEmail), (0, drizzle_orm_1.eq)(schema_1.users.phone, parsed.data.guestPhone)));
        if (isUsers.length === 0) {
            const insertUsers = await client_1.db.insert(schema_1.users).values({
                email: parsed.data.guestEmail,
                phone: parsed.data.guestPhone,
                name: parsed.data.guestName,
                surname: parsed.data.guestSurname,
            });
            usr_id = insertUsers.lastInsertRowid;
        }
        else {
            usr_id = isUsers[0].id;
        }
        const insertReservation = await client_1.db.insert(schema_1.reservations).values({
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
    }
    else {
        return res.status(400).json({ error: "Ktoś zarezerowwał ten termin przed toba :c" });
    }
});
router.get("/all", async (_req, res) => {
    const calendar = (0, ical_generator_1.default)({ name: 'podwawrzka_all_reservations' });
    calendar.method(ical_generator_1.ICalCalendarMethod.PUBLISH);
    const today = new Date().toISOString();
    const result = await client_1.db.select({ id: schema_1.reservations.id, start: schema_1.reservations.start, end: schema_1.reservations.end }).from(schema_1.reservations).where((0, drizzle_orm_1.gte)(schema_1.reservations.end, today));
    for (const resv of result) {
        calendar.createEvent({
            id: `reservation@${resv.id}@podwawrzka`,
            start: new Date(resv.start),
            end: new Date(resv.end),
            summary: "Zarezerwowane",
            description: "Termin zarezerwowany",
            allDay: true
        });
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="reservations.ics"');
    return res.send(calendar.toString());
});
const adminReservation = zod_1.z.object({
    month: zod_1.z.number().min(1).max(12),
    year: zod_1.z.number().min(2010).max(2100),
});
router.post("/admin", async (req, res) => {
    const parsed = adminReservation.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: "Wrong Month or year",
            details: parsed.error.issues,
        });
    }
    const result = await client_1.db.select().from(schema_1.reservations).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.reservations.start, new Date(Date.UTC(parsed.data.year, parsed.data.month, 1)).toISOString()), (0, drizzle_orm_1.gt)(schema_1.reservations.end, new Date(Date.UTC(parsed.data.year, parsed.data.month - 1, 1)).toISOString())));
    return res.status(200).json(result);
});
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
    const dbRes = await client_1.db
        .select({
        start: schema_1.reservations.start,
        end: schema_1.reservations.end,
    })
        .from(schema_1.reservations)
        .innerJoin(schema_1.payments, (0, drizzle_orm_1.eq)(schema_1.payments.reservations_id, schema_1.reservations.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.reservations.start, monthEndStr), (0, drizzle_orm_1.gt)(schema_1.reservations.end, monthStartStr), (0, drizzle_orm_1.inArray)(schema_1.payments.status, BLOCKING_PAYMENT_STATUSES)));
    const third = Array.from(cached3rdPartyReservations).filter((r) => {
        const rs = new Date(r.start);
        const re = new Date(r.end);
        return rs < monthEndExclusive && re > monthStart;
    });
    // console.log("month/year", month, year);
    // console.log("dbRes", dbRes.length, "cached3rdParty", cached3rdPartyReservations.size, "third", third.length);
    return res.json([...dbRes, ...third]);
});
exports.default = router;
