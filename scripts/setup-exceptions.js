
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const db = new Database(
    path.join(dataDirectory, "expense.db"),
    { create: true }
);

const columns = [
    ["exception_flags", "TEXT NOT NULL DEFAULT '[]'"],
    ["exception_review_status", "TEXT NOT NULL DEFAULT 'OPEN'"],
    ["receipt_currency", "TEXT"],
    ["evidence_total", "REAL"],
    ["evidence_line_total", "REAL"],
];

const existingColumns = db
    .query("PRAGMA table_info(expenses)")
    .all()
    .map((column) => column.name);

for (const [name, definition] of columns) {
    if (!existingColumns.includes(name)) {
        db.exec(`ALTER TABLE expenses ADD COLUMN ${name} ${definition}`);
        console.log(`Added column: ${name}`);
    } else {
        console.log(`Already exists: ${name}`);
    }
}

db.close();

console.log("Expense exception fields are ready.");
