
import { db } from "../src/lib/db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    request_number TEXT NOT NULL UNIQUE,
    requester_id TEXT NOT NULL,
    project_code TEXT NOT NULL,
    merchant TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'SAR',
    expense_date TEXT NOT NULL,
    receipt_reference TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED'
      CHECK (status IN (
        'SUBMITTED',
        'PENDING_PROJECT_REVIEW',
        'PENDING_OPERATIONS_REVIEW',
        'PENDING_FINANCE_REVIEW',
        'NEEDS_CLARIFICATION',
        'REJECTED',
        'APPROVED',
        'PAID_SIMULATED'
      )),
    exception_reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewer_role TEXT NOT NULL,
    decision TEXT NOT NULL
      CHECK (decision IN (
        'APPROVED',
        'REJECTED',
        'NEEDS_CLARIFICATION',
        'FLAGGED'
      )),
    comments TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    expense_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_requester
    ON expenses(requester_id);

  CREATE INDEX IF NOT EXISTS idx_expenses_status
    ON expenses(status);

  CREATE INDEX IF NOT EXISTS idx_approvals_expense
    ON approvals(expense_id);

  CREATE INDEX IF NOT EXISTS idx_audit_logs_expense
    ON audit_logs(expense_id);
`);

console.log("Expense, approval, and audit tables are ready.");
db.close();
