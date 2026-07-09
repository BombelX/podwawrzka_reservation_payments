import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbFile = path.join(process.cwd(), "data", "app.db");

if (!fs.existsSync(dbFile)) {
  console.error("Database file not found:", dbFile);
  process.exit(1);
}

const db = new Database(dbFile);

const tablesToClear = ["payments", "reservations", "users", "mock_p24_tokens"] as const;

try {
  const reset = db.transaction(() => {
    for (const table of tablesToClear) {
      db.prepare(`DELETE FROM ${table}`).run();
    }

    const placeholders = tablesToClear.map(() => "?").join(", ");
    db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${placeholders})`).run(...tablesToClear);
  });

  reset();
  db.exec("VACUUM");

  console.log("Local booking data cleared from:", dbFile);
  console.log("Cleared tables:", tablesToClear.join(", "));
} finally {
  db.close();
}