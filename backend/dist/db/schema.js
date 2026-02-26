"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specialPrices = exports.mockP24Tokens = exports.payments = exports.users = exports.reservations = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.reservations = (0, sqlite_core_1.sqliteTable)("reservations", {
    id: (0, sqlite_core_1.int)().primaryKey({ autoIncrement: true }),
    start: (0, sqlite_core_1.text)().notNull(),
    end: (0, sqlite_core_1.text)().notNull(),
    arrivalTime: (0, sqlite_core_1.text)(),
    user_id: (0, sqlite_core_1.int)().notNull(),
    how_many_people: (0, sqlite_core_1.int)().default(2).notNull(),
    nights: (0, sqlite_core_1.int)().notNull(),
    price: (0, sqlite_core_1.int)().notNull(),
});
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.int)().primaryKey({ autoIncrement: true }),
    email: (0, sqlite_core_1.text)().notNull(),
    phone: (0, sqlite_core_1.text)().notNull(),
    name: (0, sqlite_core_1.text)().notNull(),
    surname: (0, sqlite_core_1.text)().notNull()
});
exports.payments = (0, sqlite_core_1.sqliteTable)("payments", {
    id: (0, sqlite_core_1.int)().primaryKey({ autoIncrement: true }),
    token: (0, sqlite_core_1.text)().notNull(),
    status: (0, sqlite_core_1.text)().notNull(),
    reservations_id: (0, sqlite_core_1.int)().notNull(),
    user_id: (0, sqlite_core_1.int)().notNull(),
    p24_token: (0, sqlite_core_1.text)(),
    created_at: (0, sqlite_core_1.text)().notNull().default((0, drizzle_orm_1.sql) `(datetime('now'))`)
});
exports.mockP24Tokens = (0, sqlite_core_1.sqliteTable)("mock_p24_tokens", {
    id: (0, sqlite_core_1.int)().primaryKey({ autoIncrement: true }),
    token: (0, sqlite_core_1.text)().notNull(),
    status: (0, sqlite_core_1.int)().notNull()
});
exports.specialPrices = (0, sqlite_core_1.sqliteTable)("special_prices", {
    id: (0, sqlite_core_1.int)().primaryKey({ autoIncrement: true }),
    date: (0, sqlite_core_1.text)().notNull(),
    price: (0, sqlite_core_1.int)().notNull()
});
