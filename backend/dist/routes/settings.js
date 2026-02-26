"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("../db/client");
const schema_1 = require("../db/schema");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const settings_json_1 = __importDefault(require("../settings.json"));
const fs = require("fs").promises;
const router = (0, express_1.default)();
const spPrice = zod_1.z.object({
    price: zod_1.z.number().min(0).nonnegative().nonoptional(),
    date: zod_1.z.string().nonempty()
});
router.delete("/special/", async (req, res) => {
    const parsed = zod_1.z.object({ date: zod_1.z.string().nonempty() }).safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid date format" });
    }
    const resp = await client_1.db.delete(schema_1.specialPrices).where((0, drizzle_orm_1.eq)(schema_1.specialPrices.date, req.body.date)).run();
    return res.status(200).json({ msg: "deleted" });
});
router.post("/special", async (req, res) => {
    const prasedData = spPrice.safeParse(req.body);
    if (!prasedData.success) {
        return res.status(400).json({
            error: "Wrong payload"
        });
    }
    const data = prasedData.data;
    try {
        const resp = await client_1.db.select().from(schema_1.specialPrices).where((0, drizzle_orm_1.eq)(schema_1.specialPrices.date, data.date)).all();
        if (resp.length > 0) {
            await client_1.db.update(schema_1.specialPrices).set({ price: data.price }).where((0, drizzle_orm_1.eq)(schema_1.specialPrices.date, data.date)).run();
        }
        else {
            await client_1.db.insert(schema_1.specialPrices).values({ date: data.date, price: data.price }).run();
        }
    }
    catch (error) {
        return res.status(500).json({
            error: "Problem with database"
        });
    }
    return res.status(200).json({ msg: "Special price updated" });
});
const settingsSchema = zod_1.z.object({
    basePrice: zod_1.z.number().min(0).nonnegative(),
    weekendIncrease: zod_1.z.number().min(0).nonnegative().optional(),
    holidayIncrease: zod_1.z.number().min(0).nonnegative().optional(),
    pricePerPerson: zod_1.z.number().min(0).nonnegative().optional(),
    weekendPrice: zod_1.z.number().min(0).nonnegative().optional(),
    holidayPrice: zod_1.z.number().min(0).nonnegative().optional(),
    extraPersonPrice: zod_1.z.number().min(0).nonnegative().optional(),
    minimumDuration: zod_1.z.number().min(1).optional(),
});
router.put("/", async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: "Invalid settings format",
        });
    }
    const weekendIncrease = parsed.data.weekendIncrease ?? parsed.data.weekendPrice;
    const holidayIncrease = parsed.data.holidayIncrease ?? parsed.data.holidayPrice;
    const pricePerPerson = parsed.data.pricePerPerson ?? parsed.data.extraPersonPrice;
    const minimumDuration = parsed.data.minimumDuration ?? parsed.data.minimumDuration;
    if (weekendIncrease === undefined || holidayIncrease === undefined || pricePerPerson === undefined || minimumDuration === undefined) {
        return res.status(400).json({
            error: "Missing required settings fields",
        });
    }
    settings_json_1.default.basePrice = parsed.data.basePrice;
    settings_json_1.default.weekendIncrease = weekendIncrease;
    settings_json_1.default.holidayIncrease = holidayIncrease;
    settings_json_1.default.pricePerPerson = pricePerPerson;
    settings_json_1.default.minimumDuration = minimumDuration;
    try {
        await fs.writeFile("./src/settings.json", JSON.stringify(settings_json_1.default, null, 2));
        console.log("Updated settings:", settings_json_1.default);
    }
    catch (error) {
        return res.status(500).json({ error: "Failed to save settings" });
    }
    return res.status(200).json({ success: true, msg: "Settings updated" });
});
router.get("/", async (req, res) => {
    try {
        const now = new Date().toISOString();
        const resp = client_1.db
            .select()
            .from(schema_1.specialPrices)
            .where((0, drizzle_orm_1.gt)(schema_1.specialPrices.date, now))
            .all();
        return res.status(200).json({
            basePrice: settings_json_1.default.basePrice,
            weekendPriceIncrease: settings_json_1.default.weekendIncrease,
            holidayPriceIncrease: settings_json_1.default.holidayIncrease,
            extraPersonPrice: settings_json_1.default.pricePerPerson,
            specialDays: resp.map((r) => ({ date: r.date, price: r.price })),
            fixedHolidays: settings_json_1.default.fixedHolidays,
            minimumDuration: settings_json_1.default.minimumDuration,
        });
    }
    catch (error) {
        console.error("GET /settings failed", error);
        return res.status(500).json({
            success: false,
            error: "Failed to load settings",
        });
    }
});
exports.default = router;
