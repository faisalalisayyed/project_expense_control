
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

        if (user.role !== "PROJECT_MANAGER") {
            return NextResponse.json(
                { error: "Only Project Managers can review expenses." },
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
                { error: "Invalid review decision." },
                { status: 400 }
            );
        }

        if (
            (decision === "REJECTED" ||
                decision === "NEEDS_CLARIFICATION") &&
            !comments
        ) {
            return NextResponse.json(
                { error: "Please provide a comment for this decision." },
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

        if (expense.status !== "PENDING_PROJECT_REVIEW") {
            return NextResponse.json(
                { error: "This expense has already been reviewed or is no longer awaiting review." },
                { status: 409 }
            );
        }

        let nextStatus;

        if (decision === "APPROVED") {
            const requiresOperations =
                expense.currency === "SAR" && expense.amount > 1000;

            nextStatus = requiresOperations
                ? "PENDING_OPERATIONS_REVIEW"
                : "PENDING_FINANCE_REVIEW";
        } else if (decision === "REJECTED") {
            nextStatus = "REJECTED";
        } else {
            nextStatus = "NEEDS_CLARIFICATION";
        }

        const saveDecision = db.transaction(() => {
            const result = db.query(`
        UPDATE expenses
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'PENDING_PROJECT_REVIEW'
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
                `PROJECT_MANAGER_${decision}`,
                JSON.stringify({ comments, previousStatus: expense.status, nextStatus })
            );
        });

        try {
            saveDecision();
        } catch (error) {
            if (error.message === "REVIEW_CONFLICT") {
                return NextResponse.json(
                    { error: "This expense was updated by another reviewer. Refresh the queue." },
                    { status: 409 }
                );
            }

            throw error;
        }

        return NextResponse.json({
            success: true,
            message: `Expense ${decision.toLowerCase().replaceAll("_", " ")} successfully.`,
            status: nextStatus,
        });
    } catch (error) {
        console.error("Expense review error:", error);

        return NextResponse.json(
            { error: "Unable to process this review." },
            { status: 500 }
        );
    }
}
