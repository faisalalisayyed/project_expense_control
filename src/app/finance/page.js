
"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";

const API_URL = "/api/expenses/finance-queue";
const DECISION_URL = (id) => `/api/expenses/${id}/finance-review`;

function formatAmount(amount, currency, isArabic, f) {
    if (amount === null || amount === undefined || amount === "") {
        return f.notRecorded;
    }

    try {
        return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
            style: "currency",
            currency: currency || "SAR",
        }).format(Number(amount));
    } catch {
        return `${currency || "SAR"} ${Number(amount).toLocaleString(
            isArabic ? "ar-SA" : "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}`;
    }
}

function ExceptionList({ flags, f }) {
    if (!flags?.length) {
        return (
            <p className="text-sm text-emerald-400">
                {f.noWarningsDescription}
            </p>
        );
    }

    return (
        <ul className="mt-2 space-y-2">
            {flags.map((flag, index) => {
                const code =
                    typeof flag === "string"
                        ? flag
                        : flag.code ||
                          flag.type ||
                          `EXCEPTION_${index + 1}`;

                const message =
                    typeof flag === "string"
                        ? null
                        : flag.message || flag.description || null;

                const label =
                    f.flags[code] || code.replaceAll("_", " ");

                return (
                    <li
                        key={`${code}-${index}`}
                        className="rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-100"
                    >
                        <strong>{label}</strong>
                        <p className="mt-1">
                            {message || label}
                        </p>
                    </li>
                );
            })}
        </ul>
    );
}

function Detail({ label, value, dir = "auto" }) {
    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
            <p className="text-xs text-neutral-500">{label}</p>
            <p dir={dir} className="mt-1 break-words text-sm font-medium">
                {value || label}
            </p>
        </div>
    );
}

function DecisionButton({ label, disabled, onClick, className }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
        >
            {label}
        </button>
    );
}

export default function FinancePage() {
    const { isArabic, t, changeLanguage } = useLanguage();
    const f = t.Finance;

    const [expenses, setExpenses] = useState([]);
    const [comments, setComments] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [investigationComments, setInvestigationComments] = useState({});
    const [investigationBusyId, setInvestigationBusyId] = useState(null);

  function toggleLanguage() {
        changeLanguage(isArabic ? "en" : "ar");
    }

    const loadExpenses = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(API_URL, {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || f.loadError);
            }

            setExpenses(data.expenses || []);
        } catch (err) {
            setError(err.message || f.loadError);
        } finally {
            setLoading(false);
        }
    }, [f.loadError]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    function translateTemplate(template, values) {
        return Object.entries(values).reduce(
            (result, [key, value]) =>
                result.replaceAll(`{${key}}`, String(value)),
            template
        );
    }

    function statusLabel(status) {
        return f.statuses[status] || status || f.notRecorded;
    }

    async function submitDecision(expense, decision) {
        const comment = (comments[expense.id] || "").trim();

        if (decision !== "APPROVED" && !comment) {
            setError(f.addCommentBeforeDecision);
            return;
        }

        const unresolvedFlags =
            (expense.exceptionFlags || []).length > 0 &&
            expense.exception_review_status !== "RESOLVED";

        if (decision === "APPROVED" && unresolvedFlags) {
            setError(f.unresolvedWarning);
            return;
        }

        const confirmed = window.confirm(
            translateTemplate(f.confirmDecision, {
                decision: f.decisions[decision] || decision.replaceAll("_", " "),
                requestNumber: expense.request_number,
            })
        );

        if (!confirmed) return;

        setBusyId(expense.id);
        setError("");
        setNotice("");

        try {
            const response = await fetch(DECISION_URL(expense.id), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    decision,
                    comments: comment,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || f.reviewError);
            }

            setNotice(
                f.decisions[decision]
                    ? `${expense.request_number}: ${f.decisions[decision]}`
                    : data.message || f.decisionRecorded
            );

            setComments((current) => ({
                ...current,
                [expense.id]: "",
            }));

            await loadExpenses();
        } catch (err) {
            setError(err.message || f.reviewError);
        } finally {
            setBusyId(null);
        }
    }

    async function submitInvestigation(expense, outcome) {
        const investigationComment = (
            investigationComments[expense.id] || ""
        ).trim();

        if (investigationComment.length < 10) {
            setError(f.investigationMinLength);
            return;
        }

        const confirmed = window.confirm(
            translateTemplate(f.confirmInvestigation, {
                outcome: f.investigationOutcomes[outcome] || outcome,
                requestNumber: expense.request_number,
            })
        );

        if (!confirmed) return;

        setInvestigationBusyId(expense.id);
        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `/api/expenses/${expense.id}/exception-review`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        outcome,
                        comments: investigationComment,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || f.investigationError);
            }

            setNotice(data.message || f.investigationRecorded);

            setInvestigationComments((current) => ({
                ...current,
                [expense.id]: "",
            }));

            await loadExpenses();
        } catch (err) {
            setError(err.message || f.investigationError);
        } finally {
            setInvestigationBusyId(null);
        }
    }

    const inputClass =
        "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500";

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-8"
        >
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
                            {f.eyebrow}
                        </p>

                        <h1 className="mt-2 text-3xl font-semibold">
                            {f.title}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
                            {f.description}
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
                        disabled={loading}
                        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {loading ? f.refreshing : f.refresh}
                    </button>
                    </div>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200"
                    >
                        {error}
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200"
                    >
                        {notice}
                    </div>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                        <p className="text-sm text-neutral-400">
                            {f.awaitingFinance}
                        </p>
                        <p className="mt-2 text-3xl font-semibold">
                            {expenses.length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                        <p className="text-sm text-neutral-400">
                            {f.withWarnings}
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-amber-400">
                            {expenses.filter(
                                (item) => (item.exceptionFlags || []).length > 0
                            ).length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                        <p className="text-sm text-neutral-400">
                            {f.noExceptions}
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-emerald-400">
                            {expenses.filter(
                                (item) => !(item.exceptionFlags || []).length
                            ).length}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
                        {f.loading}
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-10 text-center">
                        <h2 className="text-xl font-medium">
                            {f.emptyTitle}
                        </h2>
                        <p className="mt-2 text-sm text-neutral-400">
                            {f.emptyDescription}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {expenses.map((expense) => {
                            const flags = expense.exceptionFlags || [];
                            const unresolvedFlags =
                                flags.length > 0 &&
                                expense.exception_review_status !== "RESOLVED";

                            return (
                                <article
                                    key={expense.id}
                                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p
                                                dir="ltr"
                                                className="text-start text-xs uppercase tracking-wider text-neutral-500"
                                            >
                                                {expense.request_number}
                                            </p>

                                            <h2 className="mt-1 text-xl font-semibold">
                                                {expense.merchant}
                                            </h2>

                                            <p className="mt-1 text-sm text-neutral-400">
                                                {expense.description || f.noPurpose}
                                            </p>
                                        </div>

                                        <div className="text-start">
                                            <p
                                                dir="ltr"
                                                className="text-start text-2xl font-semibold"
                                            >
                                                {formatAmount(
                                                    expense.amount,
                                                    expense.currency,
                                                    isArabic,
                                                    f
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-neutral-400">
                                                {expense.status
                                                    .split("_")
                                                    .map((part) => part.toLowerCase())
                                                    .join(" ")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <Detail
                                            label={f.requester}
                                            value={expense.requester_name}
                                        />
                                        <Detail
                                            label={f.project}
                                            value={expense.project_code || f.missing}
                                            dir="auto"
                                        />
                                        <Detail
                                            label={f.expenseDate}
                                            value={expense.expense_date || f.missing}
                                        />
                                        <Detail
                                            label={f.receiptReference}
                                            value={expense.receipt_reference || f.missing}
                                        />
                                        <Detail
                                            label={f.evidenceCurrency}
                                            value={expense.receipt_currency || f.notRecorded}
                                            dir="ltr"
                                        />
                                        <Detail
                                            label={f.receiptTotal}
                                            value={
                                                expense.evidence_total == null
                                                    ? f.notRecorded
                                                    : formatAmount(
                                                          expense.evidence_total,
                                                          expense.receipt_currency || expense.currency,
                                                          isArabic,
                                                          f
                                                      )
                                            }
                                            dir="ltr"
                                        />
                                        <Detail
                                            label={f.receiptLineTotal}
                                            value={
                                                expense.evidence_line_total == null
                                                    ? f.notRecorded
                                                    : formatAmount(
                                                          expense.evidence_line_total,
                                                          expense.receipt_currency || expense.currency,
                                                          isArabic,
                                                          f
                                                      )
                                            }
                                            dir="ltr"
                                        />
                                        <Detail
                                            label={f.exceptionReview}
                                            value={statusLabel(expense.exception_review_status)}
                                        />
                                    </div>

                                    <section className="mt-6 border-t border-neutral-800 pt-5">
                                        <h3 className="font-semibold">
                                            {f.exceptionWarnings}
                                        </h3>

                                        <ExceptionList flags={flags} f={f} />

                                        {unresolvedFlags && (
                                            <p className="mt-3 text-sm text-amber-300">
                                                {f.humanInvestigationRequired}
                                            </p>
                                        )}

                                        {expense.exception_reason && (
                                            <p className="mt-3 text-sm text-neutral-400">
                                                <strong>{f.reviewNote}: </strong>
                                                {expense.exception_reason}
                                            </p>
                                        )}
                                    </section>

                                    {flags.length > 0 && (
                                        <section className="mt-5 rounded-xl border border-amber-800 bg-amber-950/20 p-4">
                                            <h3 className="font-semibold">
                                                {f.investigation}
                                            </h3>

                                            <p className="mt-2 text-sm text-neutral-300">
                                                {f.currentStatus}:{" "}
                                                {statusLabel(
                                                    expense.exception_review_status || "OPEN"
                                                )}
                                            </p>

                                            <label
                                                htmlFor={`investigation-${expense.id}`}
                                                className="mb-2 mt-4 block text-sm font-medium"
                                            >
                                                {f.investigationFindings}
                                            </label>

                                            <textarea
                                                id={`investigation-${expense.id}`}
                                                value={investigationComments[expense.id] || ""}
                                                onChange={(event) =>
                                                    setInvestigationComments((current) => ({
                                                        ...current,
                                                        [expense.id]: event.target.value,
                                                    }))
                                                }
                                                rows={3}
                                                placeholder={f.investigationPlaceholder}
                                                className={inputClass}
                                            />

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <DecisionButton
                                                    label={f.resolve}
                                                    disabled={
                                                        investigationBusyId === expense.id ||
                                                        expense.exception_review_status === "RESOLVED"
                                                    }
                                                    onClick={() =>
                                                        submitInvestigation(expense, "RESOLVED")
                                                    }
                                                    className="border-emerald-700 bg-emerald-950 text-emerald-200 hover:bg-emerald-900"
                                                />

                                                <DecisionButton
                                                    label={f.continueInvestigation}
                                                    disabled={investigationBusyId === expense.id}
                                                    onClick={() =>
                                                        submitInvestigation(expense, "INVESTIGATING")
                                                    }
                                                    className="border-amber-700 bg-amber-950 text-amber-200 hover:bg-amber-900"
                                                />

                                                <DecisionButton
                                                    label={f.escalate}
                                                    disabled={investigationBusyId === expense.id}
                                                    onClick={() =>
                                                        submitInvestigation(expense, "ESCALATED")
                                                    }
                                                    className="border-red-800 bg-red-950 text-red-200 hover:bg-red-900"
                                                />
                                            </div>

                                            <p className="mt-3 text-xs text-neutral-400">
                                                {f.investigationGuidance}
                                            </p>
                                        </section>
                                    )}

                                    <section className="mt-6 border-t border-neutral-800 pt-5">
                                        <label
                                            htmlFor={`comments-${expense.id}`}
                                            className="mb-2 block text-sm font-medium"
                                        >
                                            {f.financeComments}
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
                                            rows={3}
                                            placeholder={f.financeCommentsPlaceholder}
                                            className={inputClass}
                                        />

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <DecisionButton
                                                label={
                                                    busyId === expense.id
                                                        ? f.refreshing
                                                        : f.approve
                                                }
                                                disabled={
                                                    busyId === expense.id ||
                                                    unresolvedFlags
                                                }
                                                onClick={() =>
                                                    submitDecision(expense, "APPROVED")
                                                }
                                                className="border-emerald-700 bg-emerald-950 text-emerald-200 hover:bg-emerald-900"
                                            />

                                            <DecisionButton
                                                label={f.clarification}
                                                disabled={busyId === expense.id}
                                                onClick={() =>
                                                    submitDecision(
                                                        expense,
                                                        "NEEDS_CLARIFICATION"
                                                    )
                                                }
                                                className="border-amber-700 bg-amber-950 text-amber-200 hover:bg-amber-900"
                                            />

                                            <DecisionButton
                                                label={f.reject}
                                                disabled={busyId === expense.id}
                                                onClick={() =>
                                                    submitDecision(expense, "REJECTED")
                                                }
                                                className="border-red-800 bg-red-950 text-red-200 hover:bg-red-900"
                                            />
                                        </div>

                                        {unresolvedFlags && (
                                            <p className="mt-3 text-xs text-neutral-400">
                                                {f.approvalBlocked}
                                            </p>
                                        )}
                                    </section>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
