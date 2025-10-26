import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { email, string } from "zod";

export const reservations = sqliteTable("reservations",
    {
        id: int().primaryKey({autoIncrement:true}),
        start: text().notNull(), // start of reservation
        end: text().notNull(), // end of resrevation
        arrivalTime: text(),
    }
)

export const users = sqliteTable("users",{
    id: int().primaryKey({autoIncrement:true}),
    email: text().notNull(),
    phone: text().notNull(),
})

export const payments = sqliteTable("payments",{
    id: int().primaryKey({autoIncrement:true}),
    token: int().notNull(),
    status: text().notNull(),
    reservations_id: int().notNull(),
    user_id: int().notNull()
})