
"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DashboardContent({ user }) {
    const { isArabic, t, changeLanguage } = useLanguage();
    const d = t.Dashboard;
    const details = d.roles[user.role];

    function toggleLanguage() {
        changeLanguage(isArabic ? "en" : "ar");
    }

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"
        >
            <div className="mx-auto max-w-5xl">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            {d.brand}
                        </p>

                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                            {details.title}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            {d.welcome}, {user.name}
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

                        <LogoutButton />
                    </div>
                </header>

                <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm text-slate-500">
                        {d.signedInAs}
                    </p>

                    <p
                        dir="ltr"
                        className="mt-1 text-left font-medium text-slate-900"
                    >
                        {user.email}
                    </p>

                    <p className="mt-1 text-sm text-emerald-700">
                        {d.role}: {details.name}
                    </p>

                    <p className="mt-4 text-slate-600">
                        {details.description}
                    </p>
                </section>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {d.yourWork}
                    </h2>

                    {user.role === "REQUESTER" && (
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href="/expenses/new"
                                className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
                            >
                                {d.newExpense}
                            </Link>

                            <Link
                                href="/expenses/mine"
                                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                            >
                                {d.viewMyExpenses}
                            </Link>
                        </div>
                    )}

                    {user.role === "PROJECT_MANAGER" && (
                        <Link
                            href="/reviews"
                            className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-white"
                        >
                            {d.openReviewQueue}
                        </Link>
                    )}

                    {user.role === "OPERATIONS_MANAGER" && (
                        <Link
                            href="/operations"
                            className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-white"
                        >
                            {d.openOperationsQueue}
                        </Link>
                    )}

                    {user.role === "FINANCE_REVIEWER" && (
                        <Link
                            href="/finance"
                            className="mt-5 inline-flex rounded-lg bg-black px-4 py-2 text-white"
                        >
                            {d.financeReview}
                        </Link>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {details.tasks.map((task) => (
                            <article
                                key={task}
                                className="rounded-xl border border-slate-200 bg-white p-5"
                            >
                                <p className="font-medium text-slate-800">
                                    {task}
                                </p>

                                <p className="mt-3 text-sm text-slate-500">
                                    {d.workflowFeature}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <footer className="mt-8">
                    <Link
                        href="/login"
                        className="text-sm text-slate-500 underline"
                    >
                        {d.returnToLogin}
                    </Link>
                </footer>
            </div>
        </main>
    );
}
