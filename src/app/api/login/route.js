
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const COOKIE_NAME = "expense_session";
const SESSION_DURATION = 60 * 60 * 8;

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("SESSION_SECRET must be configured.");
    }

    return new TextEncoder().encode(secret);
}

export async function POST(request) {
    try {
        const body = await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required." },
                { status: 400 }
            );
        }

        const user = db
            .query(`
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = ?
      `)
            .get(email);

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 }
            );
        }

        const token = await new SignJWT({
            name: user.name,
            email: user.email,
            role: user.role,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(user.id)
            .setIssuedAt()
            .setExpirationTime("8h")
            .sign(getSecretKey());

        const response = NextResponse.json({
            message: "Login successful.",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_DURATION,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { error: "Unable to sign in. Please try again." },
            { status: 500 }
        );
    }
}
