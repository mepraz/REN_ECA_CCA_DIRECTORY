import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logout successful" });
    const cookieOpts = getCookieOptions();

    // Expire the cookie immediately
    response.cookies.set(cookieOpts.name, "", {
      ...cookieOpts,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
