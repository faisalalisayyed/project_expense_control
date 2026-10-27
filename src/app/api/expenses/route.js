
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { saveExpenseExceptions } from "@/lib/expense-exceptions";

export const runtime = "nodejs";

const roundMoney = (value) => Math.round(value * 100) / 100;

export async function POST(request) {
    const user = await getSession();

    if (!user) {
        return NextResponse.json(
            { error: "Please sign in first." },
            { status: 401 }
        );
    }

    if (user.role !== "REQUESTER") {
        return NextResponse.json(
            { error: "Only Requesters can submit expenses." },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();

        const projectCode =
            typeof body.projectCode === "string"
                ? body.projectCode.trim()
                : "";

        const merchant =
            typeof body.merchant === "string"
                ? body.merchant.trim()
                : "";

        const description =
            typeof body.description === "string"
                ? body.description.trim()
                : "";

        const receiptReference =
            typeof body.receiptReference === "string"
                ? body.receiptReference.trim()
                : "";

        const expenseDate =
            typeof body.expenseDate === "string"
                ? body.expenseDate.trim()
                : "";

        const currency =
            typeof body.currency === "string"
                ? body.currency.trim().toUpperCase()
                : "SAR";

        const receiptCurrency =
            typeof body.receiptCurrency === "string"
                ? body.receiptCurrency.trim().toUpperCase()
                : "";

        const amount = Number(body.amount);

        const parseOptionalAmount = (value, fieldName) => {
            if (value === undefined || value === null || value === "") {
                return null;
            }

            const parsed = Number(value);

            if (
                !Number.isFinite(parsed) ||
                parsed < 0 ||
                parsed > 100000000
            ) {
                throw new Error(`${fieldName} must be a valid non-negative amount.`);
            }

            return roundMoney(parsed);
        };

        let evidenceTotal;
        let evidenceLineTotal;

        try {
            evidenceTotal = parseOptionalAmount(
                body.evidenceTotal,
                "Evidence total"
            );

            evidenceLineTotal = parseOptionalAmount(
                body.evidenceLineTotal,
                "Evidence line-item total"
            );
        } catch (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (
            !merchant ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 100000000
        ) {
            return NextResponse.json(
                {
                    error:
                        "Enter a merchant and a valid positive expense amount.",
                },
                { status: 400 }
            );
        }

        if (
            projectCode.length > 50 ||
            merchant.length > 150 ||
            description.length > 1000 ||
            receiptReference.length > 250 ||
            currency.length > 3 ||
            receiptCurrency.length > 3
        ) {
            return NextResponse.json(
                { error: "One or more fields are too long." },
                { status: 400 }
            );
        }

        // Allow incomplete details to be submitted for human review.
        // The exception detector will flag missing or invalid information.
        if (
            currency &&
            !/^[A-Z]{3}$/.test(currency)
        ) {
            return NextResponse.json(
                { error: "Enter a valid three-letter claim currency." },
                { status: 400 }
            );
        }

        if (
            receiptCurrency &&
            !/^[A-Z]{3}$/.test(receiptCurrency)
        ) {
            return NextResponse.json(
                { error: "Enter a valid three-letter evidence currency." },
                { status: 400 }
            );
        }

        if (expenseDate && !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
            return NextResponse.json(
                { error: "Enter a valid expense date." },
                { status: 400 }
            );
        }

        if (expenseDate) {
            const parsedDate = new Date(`${expenseDate}T00:00:00.000Z`);

            if (
                Number.isNaN(parsedDate.getTime()) ||
                parsedDate.toISOString().slice(0, 10) !== expenseDate
            ) {
                return NextResponse.json(
                    { error: "Enter a valid calendar date." },
                    { status: 400 }
                );
            }
        }

        const expenseId = randomUUID();
        const auditId = randomUUID();
        const requestNumber = `EXP-${Date.now()}-${randomUUID().slice(0, 6)}`;

        const createExpense = db.transaction(() => {
            db.query(`
                INSERT INTO expenses (
                    id,
                    request_number,
                    requester_id,
                    project_code,
                    merchant,
                    description,
                    amount,
                    currency,
                    expense_date,
                    receipt_reference,
                    receipt_currency,
                    evidence_total,
                    evidence_line_total,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                expenseId,
                requestNumber,
                user.id,
                projectCode,
                merchant,
                description,
                roundMoney(amount),
                currency || "",
                expenseDate,
                receiptReference || null,
                receiptCurrency || null,
                evidenceTotal,
                evidenceLineTotal,
                "PENDING_PROJECT_REVIEW"
            );

            // Detect exceptions after inserting the claim, so duplicate
            // detection can compare it against previously submitted claims.
            const expense = db.query(`
                SELECT *
                FROM expenses
                WHERE id = ?
            `).get(expenseId);

            const exceptionFlags = saveExpenseExceptions(expense);

            db.query(`
                INSERT INTO audit_logs (
                    id,
                    expense_id,
                    actor_id,
                    action,
                    details
                )
                VALUES (?, ?, ?, ?, ?)
            `).run(
                auditId,
                expenseId,
                user.id,
                "EXPENSE_SUBMITTED",
                JSON.stringify({
                    requestNumber,
                    status: "PENDING_PROJECT_REVIEW",
                    exceptionFlags,
                })
            );

            return exceptionFlags;
        });

        const exceptionFlags = createExpense();

        return NextResponse.json(
            {
                message: "Expense submitted successfully.",
                expense: {
                    id: expenseId,
                    requestNumber,
                    status: "PENDING_PROJECT_REVIEW",
                    exceptionFlags,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Expense creation error:", error);

        return NextResponse.json(
            { error: "Unable to submit the expense. Please try again." },
            { status: 500 }
        );
    }
}
