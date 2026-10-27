
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

        if (user.role !== "PROJECT_MANAGER") {
            return NextResponse.json(
                { error: "You are not allowed to review expenses." },
                { status: 403 }
            );
        }

        const rows = db.query(`
            SELECT
                e.id,
                e.request_number,
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
                e.status,
                e.exception_reason,
                e.created_at,
                u.name AS requester_name,
                u.email AS requester_email
            FROM expenses e
            JOIN users u ON u.id = e.requester_id
            WHERE e.status = 'PENDING_PROJECT_REVIEW'
            ORDER BY e.created_at ASC
        `).all();

        const expenses = rows.map((expense) => {
            let exceptionFlags = [];

            try {
                const parsed = JSON.parse(expense.exception_flags || "[]");
                exceptionFlags = Array.isArray(parsed) ? parsed : [];
            } catch {
                exceptionFlags = [];
            }

            return {
                ...expense,
                exceptionFlags,
            };
        });

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error("Review queue error:", error);

        return NextResponse.json(
            { error: "Unable to load the review queue." },
            { status: 500 }
        );
    }
}
