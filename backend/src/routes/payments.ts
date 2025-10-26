import { Router } from "express";
import { email, z } from "zod";
import { db } from "../db/client";
import { payments, reservations, users } from "../db/schema";
import { and, lte, gte } from "drizzle-orm";

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



    router.post("/payment",async (req,res) =>{
        const paredData = PaymentsData.safeParse(req.body);
        if (!paredData.success){
            return res.status(400).json({
                error:"Wrong Payment Data",
                details:paredData.error.issues
            })
        }
        let payment_id;
        //to-do sprawdzic czy napewno niema tu zadneij rezerwacji w tej dacie 
        await db.transaction(async (tx)=>{
            
            const insertedUser = await tx.insert(users).values(
                {
                    email:paredData.data.email,
                    phone:paredData.data.phone
                }
            ).returning({ insertedId: users.id });
            
            const user_id = insertedUser[0].insertedId;

            const insertedReservation  = await tx.insert(reservations).values(
                {
                    start: paredData.data.start.toISOString(),
                    end:paredData.data.end.toISOString(),
                    arrivalTime: paredData.data.arrivalTime ? paredData.data.arrivalTime.toString() : null
                } 
            ).returning({ insertedId: reservations.id });
            const reservation_id = insertedReservation[0].insertedId;
            
            const insertedPayment = await tx.insert(payments).values(
                {
                    token: -1,
                    status: "begin",
                    reservations_id:reservation_id,
                    user_id:user_id
                } 
            ).returning({ insertedId: payments.id });
            payment_id = insertedPayment[0].insertedId;
        });



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
// router.get("/already", async(req,res) =>{
//     const parsed = ReservationMonth.safeParse(req.query)
//     if (!parsed.success){
//         return res.status(400).json({
//             error:"Wrong Month or year",
//             details:parsed.error.issues
//         })
//     }
//     const { month, year } = parsed.data;
//     const monthStart = new Date(year, month, 1);
//     const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

//     const monthStartStr = monthStart.toISOString();
//     const monthEndStr = monthEnd.toISOString();
//     const result = await db
//         .select()
//         .from(reservations)
//         .where(
//         and(
//             lte(reservations.start, monthEndStr), 
//             gte(reservations.end, monthStartStr)  
//         )
//         );

//     return res.json(result);

// }
// )


export default router;
