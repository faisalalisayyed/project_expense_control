
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

        if (user.role !== "FINANCE_REVIEWER") {
            return NextResponse.json(
                { error: "Only Finance Reviewers can make Finance decisions." },
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
                { error: "Invalid Finance decision." },
                { status: 400 }
            );
        }

        if (
            (decision === "REJECTED" ||
                decision === "NEEDS_CLARIFICATION") &&
            !comments
        ) {
            return NextResponse.json(
                { error: "Comments are required for rejection or clarification." },
                { status: 400 }
            );
        }

        const expense = db.query(`
            SELECT
                id,
                request_number,
                requester_id,
                status,
                amount,
                currency,
                exception_flags,
                exception_review_status
            FROM expenses
            WHERE id = ?
        `).get(id);

        if (!expense) {
            return NextResponse.json(
                { error: "Expense not found." },
                { status: 404 }
            );
        }

        if (expense.status !== "PENDING_FINANCE_REVIEW") {
            return NextResponse.json(
                { error: "This claim is not awaiting Finance review." },
                { status: 409 }
            );
        }

        // A requester must not approve their own claim.
        if (expense.requester_id === user.id && decision === "APPROVED") {
            return NextResponse.json(
                { error: "You cannot approve your own expense claim." },
                { status: 403 }
            );
        }

        let exceptionFlags = [];

        try {
            const parsed = JSON.parse(expense.exception_flags || "[]");

            if (Array.isArray(parsed)) {
                exceptionFlags = parsed;
            }
        } catch {
            return NextResponse.json(
                { error: "Exception data is invalid. The claim requires investigation." },
                { status: 409 }
            );
        }

        const hasUnresolvedExceptions =
            exceptionFlags.length > 0 &&
            expense.exception_review_status !== "RESOLVED";

        if (decision === "APPROVED" && hasUnresolvedExceptions) {
            return NextResponse.json(
                {
                    error: "This claim has unresolved exception warnings. Complete and record the human investigation before approving.",
                    exceptionFlags,
                    exceptionReviewStatus: expense.exception_review_status,
                },
                { status: 409 }
            );
        }

        const nextStatus = {
            APPROVED: "APPROVED",
            REJECTED: "REJECTED",
            NEEDS_CLARIFICATION: "NEEDS_CLARIFICATION",
        }[decision];

        const saveDecision = db.transaction(() => {
            const result = db.query(`
                UPDATE expenses
                SET status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND status = 'PENDING_FINANCE_REVIEW'
            `).run(nextStatus, id);

            if (result.changes !== 1) {
                throw new Error("REVIEW_CONFLICT");
            }

            db.query(`
                INSERT INTO approvals (
                    id,
                    expense_id,
                    reviewer_id,
                    reviewer_role,
                    decision,
                    comments
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
                    id,
                    expense_id,
                    actor_id,
                    action,
                    details
                )
                VALUES (?, ?, ?, ?, ?)
            `).run(
                randomUUID(),
                id,
                user.id,
                `FINANCE_${decision}`,
                JSON.stringify({
                    requestNumber: expense.request_number,
                    comments,
                    previousStatus: expense.status,
                    nextStatus,
                    exceptionReviewStatus: expense.exception_review_status,
                    exceptionFlags,
                })
            );
        });

        try {
            saveDecision();
        } catch (error) {
            if (error.message === "REVIEW_CONFLICT") {
                return NextResponse.json(
                    {
                        error: "This claim was updated by another reviewer. Refresh the Finance queue.",
                    },
                    { status: 409 }
                );
            }

            throw error;
        }

        return NextResponse.json({
            success: true,
            message: `Finance decision recorded: ${decision.toLowerCase().replaceAll("_", " ")}.`,
            status: nextStatus,
        });
    } catch (error) {
        console.error("Finance review error:", error);

        return NextResponse.json(
            { error: "Unable to process the Finance decision." },
            { status: 500 }
        );
    }
}
