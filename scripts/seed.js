
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, "expense.db"), {
    create: true,
});

db.exec(`
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

const demoUsers = [
    {
        name: "Ali",
        email: "ali@demo.local",
        password: "123",
        role: "REQUESTER",
    },
{
        name: "huda",
        email: "huda@demo.local",
        password: "123",
        role: "REQUESTER",
    },
    {
        name: "saleh",
        email: "saleh@demo.local",
        password: "123",
        role: "REQUESTER",
    },
    {
        name: "mona",
        email: "mona@demo.local",
        password: "123",
        role: "REQUESTER",
    },
    {
        name: "nabil",
        email: "nabil@demo.local",
        password: "123",
        role: "REQUESTER",
    },
    {
        name: "Demo Project Manager",
        email: "projectmanager@demo.local",
        password: "123",
        role: "PROJECT_MANAGER",
    },
    {
        name: "Demo Operations Manager",
        email: "operations@demo.local",
        password: "123",
        role: "OPERATIONS_MANAGER",
    },
    {
        name: "Demo Finance Reviewer",
        email: "finance@demo.local",
        password: "123",
        role: "FINANCE_REVIEWER",
    },
];

const findUser = db.query(
    "SELECT id FROM users WHERE email = ?"
);

const insertUser = db.query(`
  INSERT INTO users (id, name, email, password_hash, role)
  VALUES (?, ?, ?, ?, ?)
`);

const updateUser = db.query(`
  UPDATE users
  SET name = ?, password_hash = ?, role = ?
  WHERE email = ?
`);

for (const user of demoUsers) {
    const existing = findUser.get(user.email);
    const passwordHash = await bcrypt.hash(user.password, 12);

    if (existing) {
        updateUser.run(
            user.name,
            passwordHash,
            user.role,
            user.email
        );
    } else {
        insertUser.run(
            crypto.randomUUID(),
            user.name,
            user.email,
            passwordHash,
            user.role
        );
    }

    console.log(`Seeded ${user.email} (${user.role})`);
}

console.log("All demo users are ready.");

db.close();
