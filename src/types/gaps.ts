import { ClaimKind, ClaimStatus, AccessLevel, ReviewState } from "./handover";
import { VerifiedEvidence } from "@/lib/pipeline/integrity";

export interface ConflictGroup {
  id: string;
  topic: string;
  description: string;
  claim_a: {
    id: string;
    text: string;
    source_title: string;
    locator: string;
    quote: string;
  };
  claim_b: {
    id: string;
    text: string;
    source_title: string;
    locator: string;
    quote: string;
  };
}

export interface GapItem {
  id: string;
  kind: ClaimKind;
  title: string;
  description: string;
  source_id?: string;
  locator?: string;
  question_for_leaver: string;
  suggested_context?: string;
  answer?: string | null;
  answered_by?: string | null;
  answered_at?: string | null;
  associated_claim_id?: string;
}

export interface ReviewClaimItem {
  id: string;
  kind: ClaimKind;
  text: string;
  status: ClaimStatus;
  tier: AccessLevel;
  review_state: ReviewState;
  version: number;
  evidence: VerifiedEvidence[];
  conflict_details?: string;
  gap_details?: string;
  is_leaver_statement?: boolean;
}
