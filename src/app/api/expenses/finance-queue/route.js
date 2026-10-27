
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (user.role !== "FINANCE_REVIEWER") {
            return NextResponse.json(
                { error: "Only Finance Reviewers can access this queue." },
                { status: 403 }
            );
        }

        const expenses = db.query(`
            SELECT
                e.id,
                e.request_number,
                e.requester_id,
                u.name AS requester_name,
                u.email AS requester_email,
                e.project_code,
                e.merchant,
                e.description,
                e.amount,
                e.currency,
                e.expense_date,
                e.receipt_reference,
                e.receipt_currency,
                e.evidence_total,
                e.evidence_line_total,
                e.exception_flags,
                e.exception_review_status,
                e.exception_reason,
                e.status,
                e.created_at,
                e.updated_at
            FROM expenses e
            JOIN users u ON u.id = e.requester_id
            WHERE e.status = 'PENDING_FINANCE_REVIEW'
            ORDER BY e.created_at ASC
        `).all();

        const results = expenses.map((expense) => {
            let exceptionFlags = [];

            try {
                const parsed = JSON.parse(expense.exception_flags || "[]");

                if (Array.isArray(parsed)) {
                    exceptionFlags = parsed;
                }
            } catch {
                exceptionFlags = [];
            }

            return {
                ...expense,
                exceptionFlags,
            };
        });

        return NextResponse.json({
            success: true,
            count: results.length,
            expenses: results,
        });
    } catch (error) {
        console.error("Finance queue error:", error);

        return NextResponse.json(
            { error: "Unable to load the Finance review queue." },
            { status: 500 }
        );
    }
}
