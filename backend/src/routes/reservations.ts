import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { reservations } from "../db/schema";
import { and, lte, gte } from "drizzle-orm";

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
        .select()
        .from(reservations)
        .where(
        and(
            lte(reservations.start, monthEndStr), 
            gte(reservations.end, monthStartStr)  
        )
        );

    return res.json(result);

}
)


export default router;
