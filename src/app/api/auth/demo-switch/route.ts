import { NextRequest, NextResponse } from "next/server";
import { DEMO_USERS, getDemoUserByRole } from "@/lib/auth/demo-users";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleKey, role } = body;

    let targetUser = roleKey ? DEMO_USERS[roleKey] : undefined;
    if (!targetUser && role) {
      targetUser = getDemoUserByRole(role);
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Invalid demo role specified" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: targetUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: targetUser.id,
      path: "/",
      httpOnly: false, // Accessible to client for instant UI sync
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to switch role" },
      { status: 500 }
    );
  }
}
