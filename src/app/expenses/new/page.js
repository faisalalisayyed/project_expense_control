
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function NewExpensePage() {
    const router = useRouter();
    const { isArabic, t, changeLanguage } = useLanguage();
    const e = t.NewExpense;

function toggleLanguage() {
        changeLanguage(isArabic ? "en" : "ar");
    }


    const [form, setForm] = useState({
        projectCode: "",
        merchant: "",
        description: "",
        amount: "",
        currency: "SAR",
        expenseDate: new Date().toISOString().slice(0, 10),
        receiptReference: "",
        receiptCurrency: "",
        evidenceTotal: "",
        evidenceLineTotal: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const payload = {
                ...form,
                evidenceTotal:
                    form.evidenceTotal === ""
                        ? null
                        : form.evidenceTotal,
                evidenceLineTotal:
                    form.evidenceLineTotal === ""
                        ? null
                        : form.evidenceLineTotal,
            };

            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || e.submitError);
                return;
            }

            const flags = result.expense?.exceptionFlags ?? [];
            const requestNumber = result.expense.requestNumber;

            setSuccess(
                flags.length > 0
                    ? e.submittedWithWarnings
                        .replace("{requestNumber}", requestNumber)
                        .replace("{count}", String(flags.length))
                    : e.submitted.replace("{requestNumber}", requestNumber)
            );

            router.push("/dashboard");
            router.refresh();
        } catch {
            setError(e.connectionError);
        } finally {
            setLoading(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

    const labelClass = "text-sm font-medium text-slate-700";

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"
        >
            <div className="mx-auto max-w-3xl">
                
                <div className="flex justify-between gap-3">
 

                        <Link
                    href="/dashboard"
                    className="text-sm text-emerald-700 hover:underline"
                >
                    {e.back}
                </Link>

                <button
                            type="button"
                            onClick={toggleLanguage}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            {isArabic ? "English" : "العربية"}
                        </button>
                    </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <p className="text-sm font-medium text-emerald-700">
                        {e.eyebrow}
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                        {e.title}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {e.description}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label htmlFor="projectCode" className={labelClass}>
                                {e.projectCode}
                            </label>

                            <select
                                id="projectCode"
                                name="projectCode"
                                value={form.projectCode}
                                onChange={updateField}
                                className={inputClass}
                            >
                                <option value="">{e.selectProject}</option>
                                <option value="P-101">
                                    P-101 — North Site
                                </option>
                                <option value="P-102">
                                    P-102 — Warehouse Fit-out
                                </option>
                                <option value="P-103">
                                    P-103 — Road Works
                                </option>
                                <option value="UNKNOWN">
                                    Other / unknown project
                                </option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="merchant" className={labelClass}>
                                {e.merchant}
                            </label>

                            <input
                                id="merchant"
                                name="merchant"
                                required
                                maxLength={150}
                                value={form.merchant}
                                onChange={updateField}
                                placeholder={e.merchantPlaceholder}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className={labelClass}>
                                {e.purpose}
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                maxLength={1000}
                                rows={3}
                                value={form.description}
                                onChange={updateField}
                                placeholder={e.purposePlaceholder}
                                className={inputClass}
                            />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="amount" className={labelClass}>
                                    {e.amount}
                                </label>

                                <input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    min="0.01"
                                    max="100000000"
                                    step="0.01"
                                    required
                                    value={form.amount}
                                    onChange={updateField}
                                    placeholder="0.00"
                                    dir="ltr"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label htmlFor="currency" className={labelClass}>
                                    {e.claimCurrency}
                                </label>

                                <select
                                    id="currency"
                                    name="currency"
                                    required
                                    value={form.currency}
                                    onChange={updateField}
                                    className={inputClass}
                                >
                                    {Object.entries(e.currencies).map(
                                        ([code, name]) => (
                                            <option key={code} value={code}>
                                                {code} — {name}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="expenseDate" className={labelClass}>
                                {e.expenseDate}
                            </label>

                            <input
                                id="expenseDate"
                                name="expenseDate"
                                type="date"
                                value={form.expenseDate}
                                onChange={updateField}
                                className={inputClass}
                            />
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {e.evidenceTitle}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {e.evidenceDescription}
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="receiptReference"
                                className={labelClass}
                            >
                                {e.receiptReference}
                            </label>

                            <input
                                id="receiptReference"
                                name="receiptReference"
                                maxLength={250}
                                value={form.receiptReference}
                                onChange={updateField}
                                placeholder={e.receiptPlaceholder}
                                className={inputClass}
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                {e.referenceNote}
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="receiptCurrency"
                                className={labelClass}
                            >
                                {e.evidenceCurrency}
                            </label>

                            <select
                                id="receiptCurrency"
                                name="receiptCurrency"
                                value={form.receiptCurrency}
                                onChange={updateField}
                                className={inputClass}
                            >
                                <option value="">{e.unknownCurrency}</option>

                                {Object.entries(e.currencies).map(
                                    ([code, name]) => (
                                        <option key={code} value={code}>
                                            {code} — {name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="evidenceTotal"
                                    className={labelClass}
                                >
                                    {e.evidenceTotal}
                                </label>

                                <input
                                    id="evidenceTotal"
                                    name="evidenceTotal"
                                    type="number"
                                    min="0"
                                    max="100000000"
                                    step="0.01"
                                    value={form.evidenceTotal}
                                    onChange={updateField}
                                    placeholder={e.totalPlaceholder}
                                    dir="ltr"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="evidenceLineTotal"
                                    className={labelClass}
                                >
                                    {e.evidenceLineTotal}
                                </label>

                                <input
                                    id="evidenceLineTotal"
                                    name="evidenceLineTotal"
                                    type="number"
                                    min="0"
                                    max="100000000"
                                    step="0.01"
                                    value={form.evidenceLineTotal}
                                    onChange={updateField}
                                    placeholder={e.lineTotalPlaceholder}
                                    dir="ltr"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                            {e.warning}
                        </p>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        {success && (
                            <p
                                role="status"
                                className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
                            >
                                {success}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                            >
                                {loading ? e.submitting : e.submit}
                            </button>

                            <Link
                                href="/dashboard"
                                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {e.cancel}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
