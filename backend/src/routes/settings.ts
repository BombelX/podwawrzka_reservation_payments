import Router from "express";
import { db } from "../db/client";
import { specialPrices } from "../db/schema";
import { z } from "zod";
import { eq, gt } from "drizzle-orm";
import settings from "../settings.json";
const fs = require("fs").promises;


const router = Router();


const spPrice = z.object({
    price : z.number().min(0).nonnegative().nonoptional(),
    date : z.string().nonempty()
});

router.delete("/special/", async (req, res) => {
    const parsed = z.object({date: z.string().nonempty()}).safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "Invalid date format"});
    }
  const resp = await db.delete(specialPrices).where(eq(specialPrices.date, req.body.date)).run();
  return res.status(200).json({msg : "deleted"})
});




router.post("/special", async (req,res) => {
    const prasedData = spPrice.safeParse(req.body)
    if (!prasedData.success){
        return res.status(400).json({
            error: "Wrong payload"
        })
    }
    const data = prasedData.data
    try{
        const resp = await db.select().from(specialPrices).where(eq(specialPrices.date,data.date)).all()
        
        if (resp.length > 0){
            await db.update(specialPrices).set({price: data.price}).where(eq(specialPrices.date,data.date)).run()
        } else {
            await db.insert(specialPrices).values({date: data.date, price: data.price}).run()
        }
    }
    catch(error) { 
        return res.status(500).json({
            error: "Problem with database"
        })
    }
    return res.status(200).json({msg: "Special price updated"})
});


const settingsSchema = z.object({
    basePrice: z.number().min(0).nonnegative(),
    weekendIncrease: z.number().min(0).nonnegative().optional(),
    holidayIncrease: z.number().min(0).nonnegative().optional(),
    pricePerPerson: z.number().min(0).nonnegative().optional(),
    weekendPrice: z.number().min(0).nonnegative().optional(),
    holidayPrice: z.number().min(0).nonnegative().optional(),
    extraPersonPrice: z.number().min(0).nonnegative().optional(),
    minimumDuration: z.number().min(1).optional(),
});

router.put("/", async (req,res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({
            error: "Invalid settings format",
        });
    }
        const weekendIncrease = parsed.data.weekendIncrease ?? parsed.data.weekendPrice;
        const holidayIncrease = parsed.data.holidayIncrease ?? parsed.data.holidayPrice;
        const pricePerPerson = parsed.data.pricePerPerson ?? parsed.data.extraPersonPrice;
        const minimumDuration = parsed.data.minimumDuration ?? parsed.data.minimumDuration ;
        if (weekendIncrease === undefined || holidayIncrease === undefined || pricePerPerson === undefined || minimumDuration === undefined) {
                return res.status(400).json({
                        error: "Missing required settings fields",
                });
        }
    settings.basePrice = parsed.data.basePrice;
    settings.weekendIncrease = weekendIncrease;
    settings.holidayIncrease = holidayIncrease;
    settings.pricePerPerson = pricePerPerson;
    settings.minimumDuration = minimumDuration;

    try {
        await fs.writeFile(
            "./src/settings.json",
            JSON.stringify(settings, null, 2)
        );
        console.log("Updated settings:", settings);
    } catch (error) {
        return res.status(500).json({ error: "Failed to save settings" });
    }
        return res.status(200).json({success: true, msg: "Settings updated"});
    });
router.get("/", async (req, res) => {
    try {
        const now = new Date().toISOString();
        const resp = db
            .select()
            .from(specialPrices)
            .where(gt(specialPrices.date, now))
            .all();

        return res.status(200).json({
            basePrice: settings.basePrice,
            weekendPriceIncrease: settings.weekendIncrease,
            holidayPriceIncrease: settings.holidayIncrease,
            extraPersonPrice: settings.pricePerPerson,
            specialDays: resp.map((r) => ({ date: r.date, price: r.price })),
            fixedHolidays: settings.fixedHolidays,
            minimumDuration: settings.minimumDuration,
        });
    } catch (error) {
        console.error("GET /settings failed", error);
        return res.status(500).json({
            success: false,
            error: "Failed to load settings",
        });
    }
});



export default router;