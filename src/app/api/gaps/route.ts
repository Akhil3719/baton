import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function GET() {
  const currentUser = await getCurrentUser();

  const gaps = batonStore.getGaps();
  const conflictGroups = batonStore.getConflictGroups();

  return NextResponse.json({
    role: currentUser.role,
    gapsCount: gaps.length,
    conflictsCount: conflictGroups.length,
    gaps,
    conflictGroups,
  });
}
