
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const COOKIE_NAME = "expense_session";

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("SESSION_SECRET must be configured securely.");
    }

    return new TextEncoder().encode(secret);
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ["HS256"],
        });

        if (
            typeof payload.sub !== "string" ||
            typeof payload.email !== "string" ||
            typeof payload.role !== "string"
        ) {
            return null;
        }

        const allowedRoles = [
            "REQUESTER",
            "PROJECT_MANAGER",
            "OPERATIONS_MANAGER",
            "FINANCE_REVIEWER",
        ];

        if (!allowedRoles.includes(payload.role)) {
            return null;
        }

        return {
            id: payload.sub,
            name: typeof payload.name === "string" ? payload.name : "",
            email: payload.email,
            role: payload.role,
        };
    } catch {
        return null;
    }
}
