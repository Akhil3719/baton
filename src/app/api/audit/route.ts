import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function GET() {
  const currentUser = await getCurrentUser();

  // Audit logs are readable by owner_reviewer (or filtered summary for lead)
  if (currentUser.role !== "owner_reviewer") {
    return NextResponse.json(
      { error: "403 Forbidden: Only Owner / Reviewer can inspect audit logs." },
      { status: 403 }
    );
  }

  const logs = batonStore.getAuditLogs("nexus-tech-club");

  return NextResponse.json({
    role: currentUser.role,
    total: logs.length,
    logs,
  });
}
