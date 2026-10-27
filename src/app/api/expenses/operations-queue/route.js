
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

        if (user.role !== "OPERATIONS_MANAGER") {
            return NextResponse.json(
                { error: "Only Operations Managers can access this queue." },
                { status: 403 }
            );
        }

        const expenses = db.query(`
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
        e.status,
        e.exception_reason,
        e.created_at,
        u.name AS requester_name,
        u.email AS requester_email
      FROM expenses e
      JOIN users u ON u.id = e.requester_id
      WHERE e.status = 'PENDING_OPERATIONS_REVIEW'
      ORDER BY e.created_at ASC
    `).all();

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error("Operations queue error:", error);

        return NextResponse.json(
            { error: "Unable to load Operations review queue." },
            { status: 500 }
        );
    }
}
