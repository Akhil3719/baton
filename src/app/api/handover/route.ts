import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { Role } from "@/types/handover";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const searchParams = request.nextUrl.searchParams;

  // Reviewer can preview as another role
  let targetRole: Role = currentUser.role;
  const previewRole = searchParams.get("previewRole") as Role | null;
  if (previewRole && currentUser.role === "owner_reviewer") {
    targetRole = previewRole;
  }

  const handoverView = batonStore.getHandoverForRole(targetRole);

  return NextResponse.json({
    activeUser: currentUser,
    targetRole,
    handover: handoverView,
  });
}
