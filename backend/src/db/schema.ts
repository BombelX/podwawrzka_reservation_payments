import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { email, string } from "zod";
import { Logger, LoggerConfig } from "log4ts";
export const reservations = sqliteTable("reservations",
    {
        id: int().primaryKey({autoIncrement:true}),
        start: text().notNull(), 
        end: text().notNull(),
        arrivalTime: text(),
        user_id: int().notNull(),
        how_many_people: int().default(2).notNull(),
        nights: int().notNull(),
        price: int().notNull(),
    }
)

export const users = sqliteTable("users",{
    id: int().primaryKey({autoIncrement:true}),
    email: text().notNull(),
    phone: text().notNull(),
    name: text().notNull(),
    surname: text().notNull()
})

export const payments = sqliteTable("payments",{
    id: int().primaryKey({autoIncrement:true}),
    token: text().notNull(),
    status: text().notNull(),
    reservations_id: int().notNull(),
    user_id: int().notNull()
})

export const mockP24Tokens = sqliteTable("mock_p24_tokens",{
    id: int().primaryKey({autoIncrement:true}),
    token: text().notNull(),
    status: int().notNull()
})