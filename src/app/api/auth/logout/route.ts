import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear cookie
  response.cookies.set({
    name: "emr_session",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
