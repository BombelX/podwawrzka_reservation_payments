import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts", // tu później zrobisz plik z definicją tabel
  out: "./drizzle",             // tu drizzle będzie zapisywać migracje
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/app.db",       // plik bazy danych SQLite
  },
});
