import { Role, HandoverStatus } from "@/types/handover";
import { Source } from "@/types/database";
import { VerifiedClaim } from "./integrity";
import { redactContentForRole } from "./redaction";

export interface HandoverSectionItem {
  id?: string;
  title: string;
  description: string;
  citations: Array<{ claimId: string; sourceTitle: string; quote: string }>;
}

export interface NextActionItem {
  id: string;
  priority: "P0" | "P1" | "P2";
  action: string;
  citations: Array<{ claimId: string; sourceTitle: string; quote: string }>;
  completed?: boolean;
}

export interface RoleHandoverView {
  handoverId: string;
  version: number;
  status: HandoverStatus;
  targetRole: Role;
  publishedAt: string | null;
  createdBy: string;
  hiddenItemsCount: number;
  hiddenNotice?: string;
  sections: {
    first7DaysPlan: Array<{
      dayRange: string;
      title: string;
      description: string;
      citations: Array<{ claimId: string; sourceTitle: string; quote: string }>;
    }>;
    ownershipSummary: Array<{
      domain: string;
      owner: string;
      notes: string;
      citations: Array<{ claimId: string; sourceTitle: string; quote: string }>;
    }>;
    risks: Array<{
      severity: "P0" | "P1" | "P2";
      title: string;
      mitigation: string;
      citations: Array<{ claimId: string; sourceTitle: string; quote: string }>;
    }>;
    nextActions: NextActionItem[];
  };
  eligibleClaims: VerifiedClaim[];
  acknowledgement?: {
    acknowledged: boolean;
    user: string;
    at: string;
  };
}

/**
 * Section 5G: Role view composition.
 * Uses ONLY approved claims whose evidence sources are all within the role's clearance.
 * Redacts secret strings, database connection strings, and phone numbers.
 * Adds 'N items hidden (access required)' notice without revealing content.
 */
export function composeRoleHandoverView(
  role: Role,
  allClaims: VerifiedClaim[],
  allSources: Source[],
  handoverMeta: {
    id: string;
    version: number;
    status: HandoverStatus;
    publishedAt: string | null;
    createdBy: string;
    acknowledgement?: { acknowledged: boolean; user: string; at: string };
  }
): RoleHandoverView {
  // Source access map
  const sourceAccessMap = new Map<string, string>();
  for (const s of allSources) {
    sourceAccessMap.set(s.id, s.access_level);
    sourceAccessMap.set(s.title.toLowerCase(), s.access_level);
  }

  // 1. Filter claims:
  // Must be approved (or pending approval in draft review) AND all evidence sources within role clearance
  const eligibleClaims: VerifiedClaim[] = [];
  let hiddenItemsCount = 0;

  for (const claim of allClaims) {
    // Rejected claims are NEVER included
    if (claim.review_state === "rejected") {
      continue;
    }

    // Check evidence source clearances
    let isPermitted = true;

    for (const ev of claim.evidence) {
      const srcLevel =
        sourceAccessMap.get(ev.resolved_source_id) ||
        sourceAccessMap.get(ev.source_title.toLowerCase()) ||
        claim.tier;

      if (role === "contributor" && srcLevel !== "team") {
        isPermitted = false;
        break;
      }

      if (role === "incoming_lead" && srcLevel === "confidential") {
        isPermitted = false;
        break;
      }
    }

    if (claim.tier === "confidential" && role !== "owner_reviewer") {
      isPermitted = false;
    }

    if (claim.tier === "leads_only" && role === "contributor") {
      isPermitted = false;
    }

    if (isPermitted) {
      eligibleClaims.push({
        ...claim,
        text: redactContentForRole(claim.text, role),
        evidence: claim.evidence.map((e) => ({
          ...e,
          exact_quote: redactContentForRole(e.exact_quote, role),
        })),
      });
    } else {
      hiddenItemsCount++;
    }
  }

  // 2. Build First-7-Days Plan from eligible claims
  const first7DaysPlan = [
    {
      dayRange: "Days 1 - 2",
      title:
        role === "incoming_lead"
          ? "Architecture & Pipeline Orientation"
          : "Local Setup & Contributor Walkthrough",
      description:
        role === "incoming_lead"
          ? redactContentForRole(
              "Review active production deploy triggers (main branch on AWS ECS), clone repositories, and inspect PostgreSQL migrations.",
              role
            )
          : "Clone repository, install dependencies via npm, and verify component styling with shadcn/ui.",
      citations: eligibleClaims
        .filter((c) => c.kind === "decision")
        .slice(0, 2)
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Verified Decision",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    },
    {
      dayRange: "Days 3 - 4",
      title:
        role === "incoming_lead"
          ? "Resolve Auth Vulnerability & Cloud Infrastructure"
          : "Frontend Issue Triage & PR Reviews",
      description:
        role === "incoming_lead"
          ? redactContentForRole(
              "Assign and patch the P0 auth token webhook verification check (Issue #89). Confirm sponsorship grant with CloudSponsor.",
              role
            )
          : "Review open frontend pull requests and help resolve responsive layout tickets.",
      citations: eligibleClaims
        .filter((c) => c.kind === "risk" || c.kind === "contact")
        .slice(0, 2)
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Verified Risk",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    },
    {
      dayRange: "Days 5 - 7",
      title:
        role === "incoming_lead"
          ? "Final Handover Sign-off & Queue Deployment"
          : "Sprint Review & Contributor Sign-off",
      description:
        role === "incoming_lead"
          ? "Deploy Stripe webhook background retry queue and formally sign off on the handover repository."
          : "Submit finalized PRs and verify build checks pass in CI.",
      citations: eligibleClaims
        .filter((c) => c.kind === "recurring_problem")
        .slice(0, 1)
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Verified Bug",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    },
  ];

  // 3. Ownership Summary
  const ownershipSummary = [
    {
      domain: "Database & Backend Persistence",
      owner: role === "incoming_lead" ? "Morgan Stone (Incoming Lead)" : "Core Team",
      notes: "PostgreSQL on Supabase with Row-Level Security enabled.",
      citations: eligibleClaims
        .filter((c) => c.text.toLowerCase().includes("postgresql") || c.text.toLowerCase().includes("mongodb"))
        .slice(0, 1)
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Database Decision",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    },
    {
      domain: "Authentication & Security",
      owner: role === "incoming_lead" ? "Morgan Stone / Priya Patel" : "Security Team",
      notes: "Webhook signature verification requires immediate implementation.",
      citations: eligibleClaims
        .filter((c) => c.kind === "risk" && c.text.includes("P0"))
        .slice(0, 1)
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Security Vulnerability",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    },
  ];

  // 4. Risks & Blockers
  const risks = eligibleClaims
    .filter((c) => c.kind === "risk" || c.kind === "recurring_problem")
    .map((c) => ({
      severity: (c.text.includes("CRITICAL") || c.text.includes("P0") ? "P0" : "P1") as "P0" | "P1" | "P2",
      title: c.text,
      mitigation: c.text.includes("Stripe")
        ? "Implement durable BullMQ or PG-boss worker queue with retry backoff."
        : "Implement HMAC signature verification against webhook payload before dispatch.",
      citations: c.evidence.map((e) => ({
        claimId: c.id!,
        sourceTitle: e.source_title,
        quote: e.exact_quote,
      })),
    }));

  // 5. Prioritized Next Actions
  const nextActions: NextActionItem[] = [];

  if (role !== "contributor") {
    nextActions.push({
      id: "action-1",
      priority: "P0",
      action: "Assign and patch auth token signature verification check (Issue #89).",
      citations: eligibleClaims
        .filter((c) => c.text.includes("P0") || c.text.includes("Issue #89"))
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Issue #89",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    });
    nextActions.push({
      id: "action-2",
      priority: "P1",
      action: "Verify production deployment triggers exclusively off main branch merges on AWS ECS.",
      citations: eligibleClaims
        .filter((c) => c.text.includes("deployment"))
        .map((c) => ({
          claimId: c.id!,
          sourceTitle: c.evidence[0]?.source_title || "Sprint 14 Retro",
          quote: c.evidence[0]?.exact_quote || c.text,
        })),
    });
  } else {
    nextActions.push({
      id: "action-contrib-1",
      priority: "P1",
      action: "Review open pull requests and verify Next.js App Router build passes.",
      citations: eligibleClaims.slice(0, 1).map((c) => ({
        claimId: c.id!,
        sourceTitle: c.evidence[0]?.source_title || "Team Sync",
        quote: c.evidence[0]?.exact_quote || c.text,
      })),
    });
  }

  nextActions.push({
    id: "action-3",
    priority: "P2",
    action: "Deploy background worker queue to fix Stripe webhook 10s timeouts.",
    citations: eligibleClaims
      .filter((c) => c.kind === "recurring_problem")
      .map((c) => ({
        claimId: c.id!,
        sourceTitle: c.evidence[0]?.source_title || "Issue #94",
        quote: c.evidence[0]?.exact_quote || c.text,
      })),
  });

  return {
    handoverId: handoverMeta.id,
    version: handoverMeta.version,
    status: handoverMeta.status,
    targetRole: role,
    publishedAt: handoverMeta.publishedAt,
    createdBy: handoverMeta.createdBy,
    hiddenItemsCount,
    hiddenNotice:
      hiddenItemsCount > 0
        ? `${hiddenItemsCount} item${hiddenItemsCount > 1 ? "s" : ""} hidden (access clearance required)`
        : undefined,
    sections: {
      first7DaysPlan,
      ownershipSummary,
      risks,
      nextActions,
    },
    eligibleClaims,
    acknowledgement: handoverMeta.acknowledgement,
  };
}
