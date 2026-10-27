import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request) {
    const user = await getSession();
    const body = await request.json();

    if (!user) {
        return NextResponse.json(
            { error: "Please sign in." },
            { status: 401 }
        );
    }

    const auditLog = db.query(`
    SELECT
      *
    FROM audit_logs
    join users on users.id = audit_logs.actor_id
    WHERE expense_id = ?
    ORDER BY created_at DESC
  `).all(body.id);

    return NextResponse.json({ auditLog });
}
