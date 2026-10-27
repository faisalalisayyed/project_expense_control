
"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ReviewsPage() {
    const { isArabic, t, changeLanguage } = useLanguage();
    const r = t.Reviews;

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");
    const [comments, setComments] = useState({});
    const [message, setMessage] = useState("");

        function toggleLanguage() {
        changeLanguage(isArabic ? "en" : "ar");
    }

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/expenses/review-queue");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || r.loadError);
            }

            setExpenses(data.expenses || []);
        } catch (err) {
            setError(err.message || r.loadError);
        } finally {
            setLoading(false);
        }
    }, [r.loadError]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    async function reviewExpense(id, decision) {
        setBusyId(id);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`/api/expenses/${id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    decision,
                    comments: comments[id] || "",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || r.reviewError);
            }

            const decisionMessage =
                r.decisions[decision] || data.message || r.reviewError;

            setMessage(`${id}: ${decisionMessage}`);
            await loadExpenses();
        } catch (err) {
            setError(err.message || r.reviewError);
        } finally {
            setBusyId("");
        }
    }

    function formatAmount(value, currency = "SAR") {
        if (value === null || value === undefined || value === "") {
            return r.notProvided;
        }

        try {
            return new Intl.NumberFormat(
                isArabic ? "ar-SA" : "en-SA",
                {
                    style: "currency",
                    currency,
                }
            ).format(Number(value));
        } catch {
            return `${currency} ${Number(value).toLocaleString(
                isArabic ? "ar-SA" : "en-SA",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )}`;
        }
    }

    function formatDate(value) {
        if (!value) return r.notProvided;

        // Keep date-only values from shifting to another day.
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
        const date = new Date(
            dateOnly ? `${value}T12:00:00Z` : value
        );

        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat(
            isArabic ? "ar-SA" : "en-SA",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
            }
        ).format(date);
    }

    function formatFlag(flag) {
        return r.flags[flag] || flag.replaceAll("_", " ");
    }

    function formatSeverity(severity) {
        return r.severities[severity] || severity;
    }

    function formatWarningCount(count) {
        return r.warningCount.replace("{count}", String(count));
    }

    if (loading) {
        return (
            <main
                dir={isArabic ? "rtl" : "ltr"}
                className="p-8 text-slate-700"
            >
                {r.loading}
            </main>
        );
    }

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="mx-auto max-w-6xl space-y-6 p-6 md:p-10"
        >
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">
                        {r.eyebrow}
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900">
                        {r.title}
                    </h1>

                    <p className="mt-2 text-gray-600">
                        {r.description}
                    </p>
                </div>


<div className="flex items-center gap-3">
<button
                            type="button"
                            onClick={toggleLanguage}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            {isArabic ? "English" : "العربية"}
                        </button>
                <button
                    type="button"
                    onClick={loadExpenses}
                    className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
                >
                    {r.refresh}
                </button>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    role="status"
                    className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800"
                >
                    {message}
                </div>
            )}

            {!expenses.length ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {r.emptyTitle}
                    </h2>

                    <p className="mt-2 text-gray-500">
                        {r.emptyDescription}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {expenses.map((expense) => {
                        const flags = Array.isArray(expense.exceptionFlags)
                            ? expense.exceptionFlags
                            : [];

                        return (
                            <article
                                key={expense.id}
                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap justify-between gap-3">
                                    <div>
                                        <p
                                            dir="ltr"
                                            className="text-left text-sm text-gray-500"
                                        >
                                            {expense.request_number}
                                        </p>

                                        <h2 className="mt-1 text-xl font-semibold text-slate-900">
                                            {expense.merchant}
                                        </h2>

                                        <p className="text-gray-600">
                                            {r.requestedBy}:{" "}
                                            {expense.requester_name}
                                        </p>
                                    </div>

                                    <div className="text-start">
                                        <p
                                            dir="ltr"
                                            className="text-start text-2xl font-bold text-slate-900"
                                        >
                                            {formatAmount(
                                                expense.amount,
                                                expense.currency
                                            )}
                                        </p>

                                        <p className="text-sm text-amber-700">
                                            {r.pendingReview}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {r.project}
                                        </p>
                                        <p className="font-medium">
                                            {expense.project_code || r.notProvided}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {r.expenseDate}
                                        </p>
                                        <p className="font-medium" dir="auto">
                                            {formatDate(expense.expense_date)}
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <p className="text-sm text-gray-500">
                                            {r.businessPurpose}
                                        </p>
                                        <p dir="auto">
                                            {expense.description || r.notProvided}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {r.receiptReference}
                                        </p>
                                        <p dir="auto">
                                            {expense.receipt_reference || r.notProvided}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {r.evidenceCurrency}
                                        </p>
                                        <p dir="ltr">
                                            {expense.receipt_currency || r.notProvided}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {r.printedEvidenceTotal}
                                        </p>
                                        <p dir="ltr">
                                            {formatAmount(
                                                expense.evidence_total,
                                                expense.receipt_currency ||
                                                    expense.currency
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {r.visibleLineTotal}
                                        </p>
                                        <p dir="ltr">
                                            {formatAmount(
                                                expense.evidence_line_total,
                                                expense.receipt_currency ||
                                                    expense.currency
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <section className="mt-5 rounded-lg border border-slate-200 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="font-semibold text-slate-900">
                                            {r.exceptionWarnings}
                                        </h3>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                flags.length
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-green-100 text-green-800"
                                            }`}
                                        >
                                            {flags.length
                                                ? formatWarningCount(flags.length)
                                                : r.noExceptions}
                                        </span>
                                    </div>

                                    {flags.length > 0 ? (
                                        <ul className="mt-3 space-y-3">
                                            {flags.map((flag, index) => (
                                                <li
                                                    key={`${flag.code || "flag"}-${index}`}
                                                    className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-amber-900">
                                                            {formatFlag(
                                                                flag.code || "EXCEPTION"
                                                            )}
                                                        </span>

                                                        {flag.severity && (
                                                            <span className="text-xs uppercase text-amber-800">
                                                                {formatSeverity(
                                                                    flag.severity
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-1 text-sm text-amber-900">
                                                        {flag.message ||
                                                            r.furtherInvestigation}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-600">
                                            {r.noWarningsDescription}
                                        </p>
                                    )}

                                    <p className="mt-3 text-xs text-gray-500">
                                        {r.warningDisclaimer}
                                    </p>
                                </section>

                                <div className="mt-5">
                                    <label
                                        htmlFor={`comments-${expense.id}`}
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        {r.reviewComments}
                                    </label>

                                    <textarea
                                        id={`comments-${expense.id}`}
                                        value={comments[expense.id] || ""}
                                        onChange={(event) =>
                                            setComments((current) => ({
                                                ...current,
                                                [expense.id]: event.target.value,
                                            }))
                                        }
                                        placeholder={r.commentsPlaceholder}
                                        className="w-full rounded-lg border border-slate-300 p-3 text-start"
                                        rows={2}
                                    />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        disabled={busyId === expense.id}
                                        onClick={() =>
                                            reviewExpense(
                                                expense.id,
                                                "APPROVED"
                                            )
                                        }
                                        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                                    >
                                        {busyId === expense.id
                                            ? "..."
                                            : r.approve}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busyId === expense.id}
                                        onClick={() =>
                                            reviewExpense(
                                                expense.id,
                                                "NEEDS_CLARIFICATION"
                                            )
                                        }
                                        className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50"
                                    >
                                        {r.clarification}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={busyId === expense.id}
                                        onClick={() =>
                                            reviewExpense(
                                                expense.id,
                                                "REJECTED"
                                            )
                                        }
                                        className="rounded-lg border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50"
                                    >
                                        {r.reject}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
