
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

const VALID_PROJECTS = new Set(["P-101", "P-102", "P-103"]);

export function detectExpenseExceptions(expense) {
    const flags = [];

    if (!VALID_PROJECTS.has(expense.project_code)) {
        flags.push({
            code: "INVALID_PROJECT",
            severity: "HIGH",
            message: "Missing or invalid project code.",
        });
    }

    if (!expense.amount || Number(expense.amount) <= 0) {
        flags.push({
            code: "INVALID_AMOUNT",
            severity: "HIGH",
            message: "A valid positive amount is required.",
        });
    }

    if (!expense.currency) {
        flags.push({
            code: "MISSING_CURRENCY",
            severity: "HIGH",
            message: "Currency is missing.",
        });
    }

    if (!expense.expense_date) {
        flags.push({
            code: "MISSING_EXPENSE_DATE",
            severity: "HIGH",
            message: "Expense date is missing.",
        });
    }

    if (!expense.description?.trim()) {
        flags.push({
            code: "MISSING_PURPOSE",
            severity: "HIGH",
            message: "Expense purpose is missing.",
        });
    }

    if (!expense.receipt_reference?.trim()) {
        flags.push({
            code: "MISSING_EVIDENCE",
            severity: "HIGH",
            message: "Receipt or evidence reference is missing.",
        });
    }

    // Compare against other claims using the same evidence reference.
    if (expense.receipt_reference?.trim()) {
        const duplicates = db.query(`
      SELECT id, request_number
      FROM expenses
      WHERE lower(trim(receipt_reference)) = lower(trim(?))
        AND id != ?
    `).all(expense.receipt_reference, expense.id);

        if (duplicates.length > 0) {
            flags.push({
                code: "POTENTIAL_DUPLICATE",
                severity: "HIGH",
                message: `Possible duplicate evidence: ${duplicates
                    .map((item) => item.request_number)
                    .join(", ")}. Human investigation required.`,
            });
        }
    }

    // Compare currency and total only when evidence values were supplied.
    if (
        expense.receipt_currency &&
        expense.currency &&
        expense.receipt_currency.toUpperCase() !==
        expense.currency.toUpperCase()
    ) {
        flags.push({
            code: "CURRENCY_MISMATCH",
            severity: "HIGH",
            message: `Request currency is ${expense.currency}, but evidence currency is ${expense.receipt_currency}.`,
        });
    }

    if (
        expense.evidence_total != null &&
        Number(expense.evidence_total) !== Number(expense.amount)
    ) {
        flags.push({
            code: "AMOUNT_MISMATCH",
            severity: "HIGH",
            message: `Request amount (${expense.amount}) differs from evidence total (${expense.evidence_total}).`,
        });
    }

    if (
        expense.evidence_line_total != null &&
        expense.evidence_total != null &&
        Number(expense.evidence_line_total) !== Number(expense.evidence_total)
    ) {
        flags.push({
            code: "ARITHMETIC_MISMATCH",
            severity: "HIGH",
            message: `Receipt line items total ${expense.evidence_line_total}, but the stated total is ${expense.evidence_total}.`,
        });
    }

    return flags;
}

export function saveExpenseExceptions(expense) {
    const flags = detectExpenseExceptions(expense);

    db.query(`
    UPDATE expenses
    SET exception_flags = ?,
        exception_review_status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
        JSON.stringify(flags),
        flags.length > 0 ? "OPEN" : "CLEAR",
        expense.id
    );

    return flags;
}
