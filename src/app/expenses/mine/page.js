
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuditLog from "@/components/AuditLog";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function MyExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const { isArabic, language, t, changeLanguage } = useLanguage();
    const e = t.MyExpenses;

 function toggleLanguage() {
        changeLanguage(isArabic ? "en" : "ar");
    }

    useEffect(() => {
        let active = true;

        async function loadExpenses() {
            try {
                const response = await fetch("/api/expenses/mine");
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Could not load expenses."
                    );
                }

                if (active) {
                    setExpenses(result.expenses);
                }
            } catch {
                if (active) {
                    setError(e.loadError);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadExpenses();

        return () => {
            active = false;
        };
    }, [e.loadError]);

    function formatAmount(amount, currency) {
        try {
            return new Intl.NumberFormat(
                isArabic ? "ar-SA" : "en",
                {
                    style: "currency",
                    currency,
                }
            ).format(amount);
        } catch {
            return `${amount} ${currency}`;
        }
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat(
            isArabic ? "ar-SA" : "en",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
            }
        ).format(date);
    }

    function formatStatus(status) {
        const label = e.statuses[status];

        if (label) {
            return label;
        }

        return status.replaceAll("_", " ");
    }

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"
        >
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/dashboard"
                    className="text-sm text-emerald-700 hover:underline"
                >
                    {e.back}
                </Link>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {e.title}
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            {e.description}
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
                    <Link
                        href="/expenses/new"
                        className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        {e.newExpense}
                    </Link>
                    </div>
                </div>

                {loading && (
                    <p className="mt-8 text-sm text-slate-500">
                        {e.loading}
                    </p>
                )}

                {error && (
                    <p
                        role="alert"
                        className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </p>
                )}

                {!loading && !error && expenses.length === 0 && (
                    <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <h2 className="font-semibold text-slate-900">
                            {e.emptyTitle}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            {e.emptyDescription}
                        </p>
                    </div>
                )}

                <div className="mt-6 space-y-4">
                    {expenses.map((expense) => (
                        <article
                            key={expense.id}
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p
                                        dir="ltr"
                                        className="text-left text-sm font-medium text-emerald-700"
                                    >
                                        {expense.requestNumber}
                                    </p>

                                    <h2 className="mt-1 font-semibold text-slate-900">
                                        {expense.merchant}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {e.projectCode}:{" "}
                                        <bdi>{expense.projectCode}</bdi>
                                        {" · "}
                                        <bdi>
                                            {formatDate(expense.expenseDate)}
                                        </bdi>
                                    </p>
                                </div>

                                <div className="text-start sm:text-end">
                                    <p
                                        dir="ltr"
                                        className="text-lg font-semibold text-slate-900"
                                    >
                                        {formatAmount(
                                            expense.amount,
                                            expense.currency
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatStatus(expense.status)}
                                    </p>
                                </div>

                                <AuditLog expenseId={expense.id} />
                            </div>

                            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
                                {expense.description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </main>
    );
}
