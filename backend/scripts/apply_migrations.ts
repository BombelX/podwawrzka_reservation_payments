import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const cwd = process.cwd();
const dbDir = path.join(cwd, 'data');
const dbFile = path.join(dbDir, 'app.db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbFile);

const migrationsDir = path.join(cwd, 'drizzle');
if (!fs.existsSync(migrationsDir)) {
  console.error('Migrations directory not found:', migrationsDir);
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const full = path.join(migrationsDir, file);
  console.log('Applying', file);
  const content = fs.readFileSync(full, 'utf8');
  // drizzle-kit uses '--> statement-breakpoint' to split statements
  const parts = content.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  try {
    db.exec('BEGIN');
    for (const stmt of parts) {
      const s = stmt.trim();
      if (!s) continue;
      db.exec(s);
    }
    db.exec('COMMIT');
  } catch (err) {
    console.error('Error applying', file, err);
    try { db.exec('ROLLBACK'); } catch {}
    process.exit(1);
  }
}

console.log('All migrations applied. DB file:', dbFile);
// 3a037007-5d7d-427f-883d-4a7a86aa41c5