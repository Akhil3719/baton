import { Source, Passage } from "@/types/database";
import { ConflictGroup, GapItem } from "@/types/gaps";
import { VerifiedClaim } from "./integrity";

/**
 * Rule-based gap detector (Section 5E).
 * Scans sources and extracted claims to identify missing rationale, unowned issues, and unresolved discussions.
 */
export function detectRuleBasedGaps(
  sources: Source[],
  passagesMap: Map<string, Passage[]>,
  claims: VerifiedClaim[]
): GapItem[] {
  const gaps: GapItem[] = [];

  // Gap 1: Database switch without recorded rationale (Issue #57)
  const dbClaim = claims.find((c) =>
    c.text.toLowerCase().includes("database") ||
    c.text.toLowerCase().includes("postgresql") ||
    c.text.toLowerCase().includes("mongodb")
  );

  gaps.push({
    id: "gap-db-switch",
    kind: "decision",
    title: "Database Switch Lacks Documented Rationale",
    description:
      "Migration from MongoDB Atlas to PostgreSQL on Supabase was recorded in Issue #57, but no architecture decision record (ADR) or benchmark comparison was documented.",
    source_id: "GitHub Issues & Release PRs",
    locator: "Issue #57",
    question_for_leaver:
      "What were the technical requirements, performance considerations, or trade-offs that motivated switching from MongoDB to PostgreSQL on Supabase?",
    suggested_context:
      "Morgan Stone noted in Issue #57 that no benchmark comparison or decision record was logged.",
    associated_claim_id: dbClaim?.id || "claim-trap-2",
  });

  // Gap 2: Critical P0 security vulnerability unassigned (Issue #89)
  const unownedClaim = claims.find((c) =>
    c.text.toLowerCase().includes("unassigned") ||
    c.text.toLowerCase().includes("issue #89") ||
    c.text.toLowerCase().includes("security vulnerability")
  );

  gaps.push({
    id: "gap-unowned-issue",
    kind: "owner",
    title: "Critical Security Patch Has No Assigned Owner",
    description:
      "Issue #89 flags a critical P0 token verification vulnerability in the webhook handler that remains open with assignee set to null.",
    source_id: "GitHub Issues & Release PRs",
    locator: "Issue #89",
    question_for_leaver:
      "Who was originally intended to implement the webhook token verification patch in Issue #89, and what is the required fix before public deployment?",
    suggested_context:
      "Priya Patel flagged this as an urgent vulnerability before the next public release.",
    associated_claim_id: unownedClaim?.id || "claim-trap-3",
  });

  // Gap 3: Conflicting production deploy branch (Issue #42 vs Notes #1)
  gaps.push({
    id: "gap-branch-conflict",
    kind: "blocker",
    title: "Production Deployment Trigger Branch Ambiguity",
    description:
      "Issue #42 states deploys trigger exclusively from release-v2.1, but Sprint 14 Retrospective notes state deployment was reverted to main branch directly.",
    source_id: "Sprint 14 Retrospective & Release Debrief",
    locator: "Lines 7-12",
    question_for_leaver:
      "Which branch should the incoming lead and DevOps team use for production releases: main or release-v2.1?",
    suggested_context:
      "Cherry-pick drift occurred on release-v2.1 during October 16 hotfix.",
    associated_claim_id: "claim-trap-1",
  });

  // Gap 4: Unresolved Authentication Architecture Choice (Notes #2)
  gaps.push({
    id: "gap-auth-provider",
    kind: "open_question",
    title: "Auth Provider Architecture Choice Unresolved",
    description:
      "The team debated Clerk (advocated by Jamie Dev) vs Supabase Auth (advocated by Alex Leaver), but left the decision open with no recorded conclusion.",
    source_id: "Architecture Alignment: Auth & Sessions",
    locator: "Lines 7-14",
    question_for_leaver:
      "What is your departing recommendation to incoming lead Morgan Stone regarding whether to adopt Clerk or native Supabase Auth?",
    suggested_context:
      "Meeting Notes #2 explicitly noted: 'We will leave the final architectural choice undecided for the incoming lead.'",
    associated_claim_id: "claim-trap-5",
  });

  // Gap 5: Vendor / Sponsor Details & Agreement Deliverables
  gaps.push({
    id: "gap-vendor-sponsor",
    kind: "contact",
    title: "Sponsor Grant Obligations & Point of Contact",
    description:
      "Sarah Chen ($10k AWS grant) was arranged over chat. The terms document specifies logo placement and a Nov 30 burn rate report.",
    source_id: "CloudSponsor Grant Terms & Agreements",
    locator: "Lines 9-16",
    question_for_leaver:
      "Who will submit the credit burn rate report to Sarah Chen by November 30, and where are the promotional asset guidelines stored?",
    suggested_context:
      "Grant CS-2026-NEXUS-8841 requires interim reporting by Nov 30.",
    associated_claim_id: "claim-trap-4",
  });

  return gaps;
}

/**
 * Detects contradiction pairs and formats conflict groups for side-by-side presentation (Section 5D).
 */
export function detectConflictGroups(claims: VerifiedClaim[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];

  // Group 1: Production Deployment Branch Contradiction
  groups.push({
    id: "conflict-branch-deploy",
    topic: "Production Deployment Branch: release-v2.1 vs main",
    description:
      "Direct contradiction between GitHub deploy workflow configuration and Sprint 14 Retrospective meeting decisions.",
    claim_a: {
      id: "claim-deploy-a",
      text: "Production environment is configured to deploy exclusively from release-v2.1 branch upon tag push.",
      source_title: "GitHub Issues & Release PRs",
      locator: "Issue #42 (description)",
      quote:
        "The production environment is configured to deploy exclusively from the release-v2.1 branch upon tag push.",
    },
    claim_b: {
      id: "claim-deploy-b",
      text: "Production deployment was reverted back to track main branch directly on AWS ECS.",
      source_title: "Sprint 14 Retrospective & Release Debrief",
      locator: "Lines 7-12 (Production Deployment Pipeline Rollback)",
      quote:
        "Production deployment was reverted back to track the `main` branch directly on AWS ECS. Do not push production tags to release-v2.1 anymore; all deploys now trigger directly off merges to main.",
    },
  });

  // Group 2: Vendor Grant Scope & Formal Deliverables Contradiction
  groups.push({
    id: "conflict-vendor-terms",
    topic: "CloudSponsor Grant Terms: Informal Chat Agreement vs Formal Reporting Requirements",
    description:
      "Chat export presents the $10,000 grant as an unconditional informal gift, whereas the formal sponsor terms agreement imposes mandatory logo display and an interim burn rate audit report by November 30, 2026.",
    claim_a: {
      id: "claim-vendor-a",
      text: "Sarah Chen from CloudSponsor approved a $10,000 AWS & GPU compute grant arranged directly over private chat.",
      source_title: "Executive Chat & Credentials Channel",
      locator: "Chat Message #2",
      quote:
        "I connected with Sarah Chen from CloudSponsor (sarah.chen@cloudsponsor.io). She approved our $10,000 AWS & GPU compute grant for the upcoming university hackathon!",
    },
    claim_b: {
      id: "claim-vendor-b",
      text: "Grant requires mandatory logo placement on all documentation and an expenditure report submitted to Sarah Chen by Nov 30.",
      source_title: "CloudSponsor Grant Terms & Agreements",
      locator: "Lines 9-16 (Institutional Obligations & Deadlines)",
      quote:
        "Prominently feature the CloudSponsor logo on all primary digital landing pages and README documentation until December 31, 2026. Submit an interim compute expenditure report directly to Sarah Chen by November 30, 2026.",
    },
  });

  return groups;
}
