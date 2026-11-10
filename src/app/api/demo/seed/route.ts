import { NextResponse } from "next/server";
import { batonStore } from "@/lib/store/baton-store";

export async function POST() {
  try {
    const result = batonStore.seedSampleProject();
    return NextResponse.json({
      message: "Successfully seeded Nexus Tech Club sample project with 6 sources and 9 planted test traps.",
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to seed demo project";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
