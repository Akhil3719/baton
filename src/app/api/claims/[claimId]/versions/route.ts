import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  const currentUser = await getCurrentUser();
  const { claimId } = params;

  // Check if claim exists and user has clearance
  const claim = batonStore.getClaimsForRole(currentUser.role).find((c) => c.id === claimId);
  if (!claim) {
    return NextResponse.json(
      { error: "Claim not found or access restricted" },
      { status: 404 }
    );
  }

  const versions = batonStore.getClaimVersions(claimId);

  return NextResponse.json({
    claimId,
    currentVersion: claim.version || 1,
    versions,
  });
}
