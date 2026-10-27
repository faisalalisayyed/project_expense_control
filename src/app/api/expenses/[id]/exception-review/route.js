
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const ALLOWED_OUTCOMES = [
    "RESOLVED",
    "INVESTIGATING",
    "ESCALATED",
];

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
                { error: "Only Finance Reviewers can investigate exceptions." },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        const outcome = String(body.outcome || "").toUpperCase();
        const comments = String(body.comments || "").trim();

        if (!ALLOWED_OUTCOMES.includes(outcome)) {
            return NextResponse.json(
                { error: "Invalid investigation outcome." },
                { status: 400 }
            );
        }

        if (comments.length < 10) {
            return NextResponse.json(
                { error: "Please provide at least 10 characters explaining the investigation." },
                { status: 400 }
            );
        }

        const expense = db.query(`
            SELECT
                id,
                request_number,
                status,
                exception_flags,
                exception_review_status,
                exception_reason
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
                { error: "Only claims awaiting Finance review can have their exceptions investigated." },
                { status: 409 }
            );
        }

        let flags;

        try {
            flags = JSON.parse(expense.exception_flags || "[]");

            if (!Array.isArray(flags)) {
                throw new Error("Invalid exception data");
            }
        } catch {
            return NextResponse.json(
                { error: "Exception data is invalid and requires technical review." },
                { status: 409 }
            );
        }

        if (flags.length === 0) {
            return NextResponse.json(
                { error: "This claim has no detected exceptions to investigate." },
                { status: 409 }
            );
        }

        const previousStatus = expense.exception_review_status || "OPEN";

        const saveInvestigation = db.transaction(() => {
            const result = db.query(`
                UPDATE expenses
                SET exception_review_status = ?,
                    exception_reason = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND status = 'PENDING_FINANCE_REVIEW'
            `).run(outcome, comments, id);

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
                "FLAGGED",
                `[Exception outcome: ${outcome}] ${comments}`
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
                `EXCEPTION_${outcome}`,
                JSON.stringify({
                    requestNumber: expense.request_number,
                    previousStatus,
                    outcome,
                    comments,
                    exceptionFlags: flags,
                })
            );
        });

        try {
            saveInvestigation();
        } catch (error) {
            if (error.message === "REVIEW_CONFLICT") {
                return NextResponse.json(
                    { error: "This claim changed while you were investigating it. Refresh and try again." },
                    { status: 409 }
                );
            }

            throw error;
        }

        return NextResponse.json({
            success: true,
            message: `Exception investigation recorded: ${outcome.toLowerCase()}.`,
            exceptionReviewStatus: outcome,
        });
    } catch (error) {
        console.error("Exception investigation error:", error);

        return NextResponse.json(
            { error: "Unable to record the exception investigation." },
            { status: 500 }
        );
    }
}
