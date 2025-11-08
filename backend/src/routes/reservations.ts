import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { reservations, users } from "../db/schema";
import { and, or, gte, lte, sql, count, eq } from "drizzle-orm";
import { parse } from "node:path";
import { error } from "node:console";

const router = Router();

const ReservationMonth = z.object({
    month: z.coerce.number().int().min(0).max(11),
    year: z.coerce.number().int().min(2023)
})


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



router.post("/make", async(req, res) => {
    console.log("[REQ] /reservations/make query:", req.query);
    const parsed = ReservationRequest.safeParse(req.query)
    if (!parsed.success){
        console.log("[VALIDATION ERROR]", parsed.error.issues);
        return res.status(400).json({
            error: "Invalid reservation data",
            details: parsed.error.issues,
            received: req.query,
        })
    }

    const startDate:Date = new Date(parsed.data.start);
    const today : Date = new Date();
    if (startDate < today){
        return res.status(400).json({
            error: "Nie da się zarezerować przeszłośći"
        })
    }


    const resultOccupied = await db
        .select({ count: count() })
        .from(reservations)
        .where(
            and(
                lte(reservations.start, parsed.data.end),
                gte(reservations.end, parsed.data.start)
            )
        );

    const occupiedCount = Number(resultOccupied[0]?.count ?? 0);
    if (occupiedCount === 0) {
        console.log("Można Zarezerwować")

        let usr_id : number;
        const isUsers = await db
        .select()
        .from(users)
        .where(
            or(
                eq(users.email, parsed.data.guestEmail),
                eq(users.phone, parsed.data.guestPhone)
            )
        )
        
        if (isUsers.length ===  0){
            const insertUsers = await db
            .insert(users).values({
                email:parsed.data.guestEmail,
                phone:parsed.data.guestPhone,
                name: parsed.data.guestName,
                surname: parsed.data.guestSurname,
            })
            usr_id = insertUsers.lastInsertRowid as number;
        }
        else{
            usr_id = isUsers[0].id
        }

        const insertReservation = await db
        .insert(reservations).values({
            start:parsed.data.start,
            end:parsed.data.end,
            user_id: usr_id,
            arrivalTime: parsed.data.arrivalTime,
            how_many_people: parsed.data.how_many_people,
            nights: parsed.data.nights,
            price: parsed.data.price,
        })
        return res.status(200).json(
        {
            success: "Zarezerwowano pomyślnie",
            reservationId: insertReservation.lastInsertRowid
        }
        )





        

    } else {
        return res.status(400).json(
        {
            error: "Ktoś zarezerowwał ten termin przed toba :c"
        }
        )
    }

}),

router.get("/already", async(req,res) =>{
    const parsed = ReservationMonth.safeParse(req.query)
    if (!parsed.success){
        return res.status(400).json({
            error:"Wrong Month or year",
            details:parsed.error.issues
        })
    }
    const { month, year } = parsed.data;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const monthStartStr = monthStart.toISOString();
    const monthEndStr = monthEnd.toISOString();
    const result = await db
        .select({start: reservations.start, end: reservations.end})
        .from(reservations)
        .where(
        and(
            lte(reservations.start, monthEndStr), 
            gte(reservations.end, monthStartStr)  
        )
        );
    console.log(result);
    return res.json(result);
    

},
)


export default router;
