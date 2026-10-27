
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request, { params }) {
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
                { error: "Only Operations Managers can authorize these claims." },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        const decision = String(body.decision || "").toUpperCase();
        const comments = String(body.comments || "").trim();

        const allowedDecisions = [
            "APPROVED",
            "REJECTED",
            "NEEDS_CLARIFICATION",
        ];

        if (!allowedDecisions.includes(decision)) {
            return NextResponse.json(
                { error: "Invalid Operations decision." },
                { status: 400 }
            );
        }

        if (decision !== "APPROVED" && !comments) {
            return NextResponse.json(
                { error: "A comment is required for this decision." },
                { status: 400 }
            );
        }

        const expense = db.query(`
      SELECT id, request_number, status, amount, currency
      FROM expenses
      WHERE id = ?
    `).get(id);

        if (!expense) {
            return NextResponse.json(
                { error: "Expense not found." },
                { status: 404 }
            );
        }

        if (expense.status !== "PENDING_OPERATIONS_REVIEW") {
            return NextResponse.json(
                { error: "This claim is not awaiting Operations authorization." },
                { status: 409 }
            );
        }

        // Operations authorization is only for claims above SAR 1,000.
        if (expense.currency !== "SAR" || expense.amount <= 1000) {
            return NextResponse.json(
                { error: "This claim does not meet the Operations authorization threshold." },
                { status: 409 }
            );
        }

        const nextStatus = {
            APPROVED: "PENDING_FINANCE_REVIEW",
            REJECTED: "REJECTED",
            NEEDS_CLARIFICATION: "NEEDS_CLARIFICATION",
        }[decision];

        const saveDecision = db.transaction(() => {
            const result = db.query(`
        UPDATE expenses
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND status = 'PENDING_OPERATIONS_REVIEW'
      `).run(nextStatus, id);

            if (result.changes !== 1) {
                throw new Error("REVIEW_CONFLICT");
            }

            db.query(`
        INSERT INTO approvals (
          id, expense_id, reviewer_id, reviewer_role,
          decision, comments
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
                randomUUID(),
                id,
                user.id,
                user.role,
                decision,
                comments || null
            );

            db.query(`
        INSERT INTO audit_logs (
          id, expense_id, actor_id, action, details
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
                randomUUID(),
                id,
                user.id,
                `OPERATIONS_${decision}`,
                JSON.stringify({
                    comments,
                    previousStatus: expense.status,
                    nextStatus,
                })
            );
        });

        try {
            saveDecision();
        } catch (error) {
            if (error.message === "REVIEW_CONFLICT") {
                return NextResponse.json(
                    { error: "This claim was updated by another reviewer. Refresh the queue." },
                    { status: 409 }
                );
            }

            throw error;
        }

        return NextResponse.json({
            success: true,
            message: `Operations decision recorded: ${decision.toLowerCase().replaceAll("_", " ")}.`,
            status: nextStatus,
        });
    } catch (error) {
        console.error("Operations review error:", error);

        return NextResponse.json(
            { error: "Unable to process Operations decision." },
            { status: 500 }
        );
    }
}
