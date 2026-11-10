import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { runGeminiExtraction } from "@/lib/gemini/client";
import { verifyClaimEvidence } from "@/lib/pipeline/integrity";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  // Only owner_reviewer can execute reconstruction pipeline
  if (currentUser.role !== "owner_reviewer") {
    return NextResponse.json(
      { error: "403 Forbidden: Only Owner / Reviewer can run the knowledge reconstruction pipeline." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { useCache = false } = body;

    // Fast-path: "Use cached run" option
    if (useCache) {
      const verifiedClaims = batonStore.loadCachedExtraction("nexus-tech-club");
      return NextResponse.json({
        success: true,
        isCached: true,
        claimsCount: verifiedClaims.length,
        claims: verifiedClaims,
        message: "Successfully loaded cached extraction run with code-verified citations.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured in environment. Please set GEMINI_API_KEY in .env.local or select 'Use cached run' to test the pre-extracted sample run.",
          canFallbackToCache: true,
        },
        { status: 400 }
      );
    }

    // Pre-generation permission filtering: Only sources accessible to reviewer
    const sources = batonStore.getSourcesForRole(currentUser.role);
    const passagesMap = batonStore.getPassagesMap();

    // 1. Run Gemini extraction with structured JSON
    const rawAiOutput = await runGeminiExtraction(apiKey, sources, passagesMap);

    // 2. Deterministic code verification (Trust Rules #1 & #3)
    const verifiedClaims = rawAiOutput.claims.map((claim) =>
      verifyClaimEvidence(claim, sources, passagesMap)
    );

    // 3. Save into store
    batonStore.saveClaims(verifiedClaims);

    batonStore.addAuditLog(
      "nexus-tech-club",
      currentUser.email,
      "RECONSTRUCTION_PIPELINE_EXECUTED",
      "Gemini Extraction",
      {
        extractedCount: rawAiOutput.claims.length,
        verifiedCount: verifiedClaims.filter((c) => c.status === "verified").length,
        conflictingCount: verifiedClaims.filter((c) => c.status === "conflicting").length,
        missingCount: verifiedClaims.filter((c) => c.status === "missing").length,
      }
    );

    return NextResponse.json({
      success: true,
      isCached: false,
      claimsCount: verifiedClaims.length,
      claims: verifiedClaims,
      summary: rawAiOutput.run_summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reconstruction pipeline failure";
    return NextResponse.json(
      {
        error: message,
        canFallbackToCache: true,
      },
      { status: 500 }
    );
  }
}
