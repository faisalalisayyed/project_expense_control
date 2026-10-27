
"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function OperationsPage() {
    const { isArabic, t, changeLanguage } = useLanguage();
    const o = t.Operations;

    const [expenses, setExpenses] = useState([]);
    const [comments, setComments] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

 function toggleLanguage() {
        changeLanguage(isArabic ? "en" : "ar");
    }

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/expenses/operations-queue", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || o.loadError);
            }

            setExpenses(data.expenses || []);
        } catch (err) {
            setError(err.message || o.loadError);
        } finally {
            setLoading(false);
        }
    }, [o.loadError]);

    useEffect(() => {
        loadQueue();
    }, [loadQueue]);

    function formatAmount(amount, currency = "SAR") {
        try {
            return new Intl.NumberFormat(
                isArabic ? "ar-SA" : "en-SA",
                {
                    style: "currency",
                    currency: currency || "SAR",
                }
            ).format(Number(amount || 0));
        } catch {
            return `${currency || "SAR"} ${Number(amount || 0).toLocaleString(
                isArabic ? "ar-SA" : "en-SA",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )}`;
        }
    }

    function formatDate(value) {
        if (!value) return o.notProvided;

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

    async function decide(expense, decision) {
        setBusyId(expense.id);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `/api/expenses/${expense.id}/operations-review`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        decision,
                        comments: comments[expense.id] || "",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || o.decisionError);
            }

            setMessage(
                `${expense.request_number}: ${
                    o.decisions[decision] || o.decisionError
                }`
            );

            setComments((current) => ({
                ...current,
                [expense.id]: "",
            }));

            await loadQueue();
        } catch (err) {
            setError(err.message || o.decisionError);
        } finally {
            setBusyId("");
        }
    }

    if (loading) {
        return (
            <main
                dir={isArabic ? "rtl" : "ltr"}
                className="p-8 text-slate-700"
            >
                {o.loading}
            </main>
        );
    }

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="mx-auto max-w-6xl space-y-6 p-6 md:p-10"
        >
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">
                        {o.eyebrow}
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900">
                        {o.title}
                    </h1>

                    <p className="mt-2 text-gray-600">
                        {o.description}
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
                    onClick={loadQueue}
                    disabled={loading}
                    className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
                >
                    {loading ? o.refreshing : o.refresh}
                </button>
                </div>
            </header>

            {error && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700"
                >
                    {error}
                </p>
            )}

            {message && (
                <p
                    role="status"
                    className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800"
                >
                    {message}
                </p>
            )}

            {expenses.length === 0 ? (
                <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {o.emptyTitle}
                    </h2>

                    <p className="mt-2 text-gray-500">
                        {o.emptyDescription}
                    </p>
                </section>
            ) : (
                <section className="space-y-5">
                    {expenses.map((expense) => (
                        <article
                            key={expense.id}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap justify-between gap-3">
                                <div className="min-w-0">
                                    <p
                                        dir="ltr"
                                        className="text-start text-sm text-gray-500"
                                    >
                                        {expense.request_number}
                                    </p>

                                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                                        {expense.merchant}
                                    </h2>

                                    <p className="text-gray-600">
                                        {o.requestedBy}: {expense.requester_name}
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
                                        {o.secondAuthorizationRequired}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {o.project}
                                    </p>
                                    <p dir="auto">
                                        {expense.project_code || o.notProvided}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        {o.expenseDate}
                                    </p>
                                    <p dir="auto">
                                        {formatDate(expense.expense_date)}
                                    </p>
                                </div>

                                <div className="sm:col-span-2">
                                    <p className="text-sm text-gray-500">
                                        {o.purpose}
                                    </p>
                                    <p dir="auto">
                                        {expense.description || o.notProvided}
                                    </p>
                                </div>

                                <div className="sm:col-span-2">
                                    <p className="text-sm text-gray-500">
                                        {o.evidenceReference}
                                    </p>
                                    <p dir="auto">
                                        {expense.receipt_reference || o.notProvided}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5">
                                <label
                                    htmlFor={`ops-comments-${expense.id}`}
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    {o.comments}
                                </label>

                                <textarea
                                    id={`ops-comments-${expense.id}`}
                                    rows={2}
                                    value={comments[expense.id] || ""}
                                    onChange={(event) =>
                                        setComments((current) => ({
                                            ...current,
                                            [expense.id]: event.target.value,
                                        }))
                                    }
                                    placeholder={o.commentsPlaceholder}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-start text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    disabled={busyId === expense.id}
                                    onClick={() =>
                                        decide(expense, "APPROVED")
                                    }
                                    className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                                >
                                    {busyId === expense.id
                                        ? o.refreshing
                                        : o.authorize}
                                </button>

                                <button
                                    type="button"
                                    disabled={busyId === expense.id}
                                    onClick={() =>
                                        decide(
                                            expense,
                                            "NEEDS_CLARIFICATION"
                                        )
                                    }
                                    className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50"
                                >
                                    {o.clarification}
                                </button>

                                <button
                                    type="button"
                                    disabled={busyId === expense.id}
                                    onClick={() =>
                                        decide(expense, "REJECTED")
                                    }
                                    className="rounded-lg border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50"
                                >
                                    {o.reject}
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}
