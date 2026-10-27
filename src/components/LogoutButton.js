
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogout() {
        setLoading(true);

        try {
            const response = await fetch("/api/logout", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            router.replace("/login");
            router.refresh();
        } catch {
            setLoading(false);
            window.alert("Unable to log out. Please try again.");
        }
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
            {loading ? "Signing out..." : "Sign out"}
        </button>
    );
}
