
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");

mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "expense.db");

const globalForDatabase = globalThis;

export const db =
    globalForDatabase.sqliteDb ??
    new Database(databasePath, { create: true });

if (process.env.NODE_ENV !== "production") {
    globalForDatabase.sqliteDb = db;
}

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
      role IN (
        'REQUESTER',
        'PROJECT_MANAGER',
        'OPERATIONS_MANAGER',
        'FINANCE_REVIEWER'
      )
    ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
