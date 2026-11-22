import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("emr_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie, "base64").toString("utf8"));
    return NextResponse.json({
      authenticated: true,
      user: decoded.user || null,
      loggedInAt: decoded.loggedInAt,
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
