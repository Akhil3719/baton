import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const searchParams = request.nextUrl.searchParams;

  const kind = searchParams.get("kind") || "all";
  const status = searchParams.get("status") || "all";

  const claims = batonStore.getClaimsForRole(currentUser.role, kind, status);

  return NextResponse.json({
    role: currentUser.role,
    total: claims.length,
    claims,
  });
}
