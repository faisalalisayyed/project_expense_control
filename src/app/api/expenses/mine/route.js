
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
    const user = await getSession();

    if (!user) {
        return NextResponse.json(
            { error: "Please sign in." },
            { status: 401 }
        );
    }

    if (user.role !== "REQUESTER") {
        return NextResponse.json(
            { error: "This endpoint is for Requesters only." },
            { status: 403 }
        );
    }

    const expenses = db.query(`
    SELECT
      id,
      request_number AS requestNumber,
      project_code AS projectCode,
      merchant,
      description,
      amount,
      currency,
      expense_date AS expenseDate,
      status,
      created_at AS createdAt
    FROM expenses
    WHERE requester_id = ?
    ORDER BY created_at DESC
  `).all(user.id);

    return NextResponse.json({ expenses });
}
