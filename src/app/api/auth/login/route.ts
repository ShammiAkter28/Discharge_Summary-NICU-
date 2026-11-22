import { NextRequest, NextResponse } from "next/server";
import { executeOracleQuery } from "@/lib/oracle";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    let authenticated = false;
    let userInfo = {
      username: trimmedUsername,
      role: "Administrator",
      fullName: "System Administrator",
    };

    // 1. First try querying Oracle USERS table with parameterized bind variables
    try {
      const sql = `
        SELECT USER_ID, USER_NAME, PASSWORD 
        FROM USERS 
        WHERE LOWER(USER_NAME) = :uname
      `;
      const binds = { uname: trimmedUsername };
      const result = await executeOracleQuery<{
        USER_ID: number;
        USER_NAME: string;
        PASSWORD: string;
      }>(sql, binds);

      if (result.rows && result.rows.length > 0) {
        const dbUser = result.rows[0];
        if (dbUser.PASSWORD === trimmedPassword) {
          authenticated = true;
          userInfo = {
            username: dbUser.USER_NAME,
            role: "Administrator",
            fullName: dbUser.USER_NAME === "admin" ? "System Administrator" : dbUser.USER_NAME,
          };
        }
      }
    } catch (dbErr) {
      console.warn("Oracle DB user lookup skipped or failed, checking fallback credentials:", dbErr);
    }

    // 2. Direct Admin Fallback check (admin / admin)
    if (!authenticated && trimmedUsername === "admin" && trimmedPassword === "admin") {
      authenticated = true;
      userInfo = {
        username: "admin",
        role: "Administrator",
        fullName: "System Administrator",
      };
    }

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username or password. Default credentials are admin / admin.",
        },
        { status: 401 }
      );
    }

    // Create session token payload
    const sessionData = {
      user: userInfo,
      loggedInAt: new Date().toISOString(),
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: userInfo,
    });

    const isLocalhost = request.headers.get("host")?.includes("localhost") || request.nextUrl.hostname === "localhost";

    // Set HTTP-only cookie (only require secure if not on localhost)
    response.cookies.set({
      name: "emr_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && !isLocalhost,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
