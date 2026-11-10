import { ExtractedClaim, ExtractedEvidence } from "@/lib/gemini/schemas";
import { ClaimStatus } from "@/types/handover";
import { Source, Passage } from "@/types/database";

export interface VerifiedEvidence extends ExtractedEvidence {
  verified: boolean;
  resolved_source_id: string;
  source_title: string;
  passage_idx?: number;
  match_location?: string;
  error?: string;
}

export interface VerifiedClaim extends Omit<ExtractedClaim, "evidence"> {
  evidence: VerifiedEvidence[];
  original_status: ClaimStatus;
  status: ClaimStatus;
  audit_note?: string;
}

/**
 * Normalises whitespace: replaces consecutive whitespace, tabs, and newlines with a single space, and trims.
 */
export function normalizeWhitespace(str: string): string {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Deterministic substring verification:
 * Checks if exact_quote exists verbatim in the source text (after whitespace normalisation).
 */
export function verifyQuoteAgainstText(
  exactQuote: string,
  sourceRawText: string
): { verified: boolean; matchIndex: number; normalizedQuote: string } {
  if (!exactQuote || !sourceRawText) {
    return { verified: false, matchIndex: -1, normalizedQuote: "" };
  }

  const normQuote = normalizeWhitespace(exactQuote).toLowerCase();
  const normSource = normalizeWhitespace(sourceRawText).toLowerCase();

  const matchIndex = normSource.indexOf(normQuote);
  const verified = matchIndex !== -1 && normQuote.length > 0;

  return {
    verified,
    matchIndex,
    normalizedQuote: normQuote,
  };
}

/**
 * Verifies all evidence citations for a claim against stored sources and passages.
 * Automatically resolves source_id by exact ID or matching title substring.
 */
export function verifyClaimEvidence(
  claim: ExtractedClaim,
  sources: Source[],
  passagesMap: Map<string, Passage[]> // source_id -> passages
): VerifiedClaim {
  const verifiedEvidenceList: VerifiedEvidence[] = [];

  for (const ev of claim.evidence) {
    // 1. Resolve source by ID or title
    const matchedSource = sources.find(
      (s) =>
        s.id === ev.source_id ||
        s.title.toLowerCase().includes(ev.source_id.toLowerCase()) ||
        ev.source_id.toLowerCase().includes(s.title.toLowerCase())
    );

    if (!matchedSource) {
      verifiedEvidenceList.push({
        ...ev,
        verified: false,
        resolved_source_id: ev.source_id,
        source_title: "Unknown Source",
        error: `Source reference '${ev.source_id}' could not be resolved.`,
      });
      continue;
    }

    // 2. Check full source raw text
    const sourceVerification = verifyQuoteAgainstText(ev.exact_quote, matchedSource.raw_text);

    // 3. Search matching passage segment
    let passageIdx: number | undefined = undefined;
    const sourcePassages = passagesMap.get(matchedSource.id) || [];

    for (const p of sourcePassages) {
      const pCheck = verifyQuoteAgainstText(ev.exact_quote, p.text);
      if (pCheck.verified) {
        passageIdx = p.idx;
        break;
      }
    }

    verifiedEvidenceList.push({
      ...ev,
      verified: sourceVerification.verified,
      resolved_source_id: matchedSource.id,
      source_title: matchedSource.title,
      passage_idx: passageIdx,
      match_location: sourceVerification.verified
        ? `Found in '${matchedSource.title}' (char offset: ${sourceVerification.matchIndex})`
        : undefined,
      error: sourceVerification.verified
        ? undefined
        : "Quote was not found verbatim in the cited source text.",
    });
  }

  // 4. Deterministic Status Assignment Rules:
  // Rule A: Contradicting claims stay 'conflicting'
  // Rule B: Missing rationale/owner stays 'missing'
  // Rule C: Claim can ONLY be 'verified' if at least one evidence quote passes code verification
  // Rule D: If no quote passes verification or evidence is empty, status MUST be downgraded to 'inferred'
  const hasPassingQuote = verifiedEvidenceList.some((e) => e.verified);

  let finalStatus: ClaimStatus = claim.status;
  let auditNote: string | undefined = undefined;

  if (claim.status === "conflicting") {
    finalStatus = "conflicting";
    auditNote = "Contradiction flagged between source passages.";
  } else if (claim.status === "missing") {
    finalStatus = "missing";
    auditNote = "Missing information or unassigned critical item.";
  } else if (hasPassingQuote) {
    finalStatus = "verified";
    auditNote = "Citation verified: verbatim quote match confirmed in source.";
  } else {
    finalStatus = "inferred";
    auditNote =
      claim.status === "verified"
        ? "DOWNGRADED to Inferred: quoted evidence did not match cited source text verbatim."
        : "Inferred claim: no direct verbatim quote match.";
  }

  return {
    ...claim,
    id: claim.id || `claim-${Math.random().toString(36).substring(2, 9)}`,
    status: finalStatus,
    original_status: claim.status,
    evidence: verifiedEvidenceList,
    audit_note: auditNote,
  };
}
