import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_URL || "http://localhost:5000";
const BACKEND = BACKEND_BASE.endsWith("/api") ? BACKEND_BASE : `${BACKEND_BASE}/api`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(`Calling: ${BACKEND}/auth/signup`);

    const res = await fetch(
      `${BACKEND}/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}