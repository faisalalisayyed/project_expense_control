
"use client";

import { useEffect, useState } from "react";
import { translations } from "@/i18n/translations";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("123");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const {
    language,
    isArabic,
    t,
    changeLanguage,
} = useLanguage();

    
    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = isArabic ? "rtl" : "ltr";
    }, [language, isArabic]);

   function toggleLanguage() {
    changeLanguage(isArabic ? "en" : "ar");
    setError("");
}

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        console.log("Submitting login form with email:", email, "and password:", password);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || t.loginError);
                return;
            }

            window.location.href = "/dashboard";
        } catch {
            setError(t.connectionError);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            dir={isArabic ? "rtl" : "ltr"}
            className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10"
        >
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-xl text-white">
                        ◈
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {t.appName}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {t.company}
                    </p>
                </div>

                <h2 className="text-xl font-semibold text-slate-900">
                    {t.welcome}
                </h2>

                <p className="mb-6 mt-2 text-sm text-slate-500">
                    {t.description}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            {t.email}
                        </label>

                        <select
    id="email"
    autoComplete="username"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    dir="ltr"
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-left text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
>
    <option value="">Select an email</option>
    <option value="ali@demo.local">ali@demo.local (Requester)</option>
    <option value="saleh@demo.local">saleh@demo.local (Requester)</option>
    <option value="mona@demo.local">mona@demo.local (Requester)</option>
<option value="projectmanager@demo.local">projectmanager@demo.local (Project Manager)</option>
<option value="operations@demo.local">operations@demo.local (Operations Reviewer)</option>
    <option value="finance@demo.local">finance@demo.local (Finance Reviewer)</option>
</select>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            {t.password}
                        </label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            defaultValue={"gjbdbjhbjhsd"}
                            // onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.passwordPlaceholder}
                            dir="ltr"
                            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-left text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                        {loading ? t.signingIn : t.signIn}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={toggleLanguage}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        aria-label="Switch language"
                    >
                        {t.switchLanguage}
                    </button>
                </div>
            </section>
        </main>
    );
}
