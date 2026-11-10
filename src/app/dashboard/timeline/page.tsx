"use client";

import React, { useState, useEffect } from "react";
import { DemoUser } from "@/types/handover";
import { SourceViewerModal } from "@/components/sources/SourceViewerModal";
import { 
  Clock, 
  Calendar, 
  GitCommit, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Pin, 
  ShieldCheck, 
  Lock,
  ExternalLink
} from "lucide-react";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  kind: "decision" | "discussion" | "blocker" | "risk" | "confidential";
  sourceTitle: string;
  sourceId: string;
  quote: string;
  description: string;
  tier: "team" | "leads_only" | "confidential";
}

export default function TimelinePage() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
  const [viewerQuote, setViewerQuote] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));
  }, []);

  const allEvents: TimelineEvent[] = [
    {
      id: "ev-1",
      date: "2026-10-04",
      title: "Production Release Branch Configured (release-v2.1)",
      kind: "decision",
      sourceTitle: "GitHub Issues & Release PRs",
      sourceId: "src-github",
      quote: "The production environment is configured to deploy exclusively from the release-v2.1 branch upon tag push.",
      description: "GitHub Actions workflow configured to trigger production deploys on release-v2.1 push.",
      tier: "team",
    },
    {
      id: "ev-2",
      date: "2026-10-12",
      title: "Database Persistence Swapped to PostgreSQL (Supabase)",
      kind: "decision",
      sourceTitle: "GitHub Issues & Release PRs",
      sourceId: "src-github",
      quote: "We decided to migrate the entire database from MongoDB Atlas to PostgreSQL on Supabase.",
      description: "Core database migrated from MongoDB to PostgreSQL without documented benchmark rationale.",
      tier: "team",
    },
    {
      id: "ev-3",
      date: "2026-10-18",
      title: "Sprint 14 Retro: Deploy Pipeline Reverted to main",
      kind: "blocker",
      sourceTitle: "Sprint 14 Retrospective & Release Debrief",
      sourceId: "src-notes-1",
      quote: "Production deployment was reverted back to track the `main` branch directly on AWS ECS.",
      description: "Cherry-pick drift forced rollback to main branch triggers, directly conflicting with Issue #42.",
      tier: "leads_only",
    },
    {
      id: "ev-4",
      date: "2026-10-20",
      title: "CloudSponsor $10,000 AWS Compute Grant Approved",
      kind: "decision",
      sourceTitle: "CloudSponsor Grant Terms & Agreements",
      sourceId: "src-sponsor",
      quote: "Sarah Chen from CloudSponsor (sarah.chen@cloudsponsor.io). She approved our $10,000 AWS & GPU compute grant",
      description: "Partnership contact arranged with Sarah Chen requiring logo display and Nov 30 burn rate report.",
      tier: "leads_only",
    },
    {
      id: "ev-5",
      date: "2026-10-25",
      title: "Auth Architecture Debate: Clerk vs Supabase Auth",
      kind: "discussion",
      sourceTitle: "Architecture Alignment: Auth & Sessions",
      sourceId: "src-notes-2",
      quote: "We will leave the final architectural choice between Clerk and Supabase Auth undecided for the incoming lead Morgan Stone to finalize.",
      description: "Extensive debate between Jamie Dev and Alex Leaver left open for Morgan Stone to decide.",
      tier: "leads_only",
    },
    {
      id: "ev-6",
      date: "2026-10-28",
      title: "P0 Webhook Token Security Vulnerability Flagged",
      kind: "risk",
      sourceTitle: "GitHub Issues & Release PRs",
      sourceId: "src-github",
      quote: "Security audit flagged that incoming external webhook signatures are not verified against the secret hash when header X-Webhook-Legacy is present.",
      description: "Critical authentication check vulnerability opened with assignee set to null.",
      tier: "team",
    },
    {
      id: "ev-7",
      date: "2026-11-01",
      title: "Handover Transition & Leadership Transfer Announced",
      kind: "decision",
      sourceTitle: "All-Hands Weekly Team Sync",
      sourceId: "src-notes-3",
      quote: "Alex will be concluding leadership tenure by mid-November. Morgan Stone will officially take over as Tech Lead.",
      description: "Alex Leaver announced handover objectives and transition schedule to team.",
      tier: "team",
    },
    {
      id: "ev-8",
      date: "2026-11-02",
      title: "Recurring Stripe Webhook Timeout Failures",
      kind: "blocker",
      sourceTitle: "GitHub Issues & Release PRs",
      sourceId: "src-github",
      quote: "Recurring issue: Webhooks from Stripe for subscription renewals time out after 10000ms because there is no automated retry queue",
      description: "Intermittent timeouts on renewals due to invoice table locking without worker queues.",
      tier: "team",
    },
    {
      id: "ev-9",
      date: "2026-11-03",
      title: "Confidential Master Passwords & Leaver Medical Notice",
      kind: "confidential",
      sourceTitle: "Executive Chat & Credentials Channel",
      sourceId: "src-chat",
      quote: "CONFIDENTIAL / LEAVER ONLY: Production DB Master credentials",
      description: "Confidential database passwords and personal recovery notice for Alex Leaver (Nov 18).",
      tier: "confidential",
    },
  ];

  // Filter events by role clearance
  const visibleEvents = allEvents.filter((ev) => {
    if (currentUser?.role === "owner_reviewer") return true;
    if (currentUser?.role === "incoming_lead" && ev.tier !== "confidential") return true;
    if (currentUser?.role === "contributor" && ev.tier === "team") return true;
    return false;
  });

  const hiddenCount = allEvents.length - visibleEvents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Decision &amp; Discussion Timeline
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-semibold font-mono">
              {visibleEvents.length} Events Visible
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological progression of architectural decisions, debates, and resolved milestones filtered for{" "}
            <strong>{currentUser?.name}</strong> ({currentUser?.role}).
          </p>
        </div>

        {hiddenCount > 0 && (
          <div className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            {hiddenCount} restricted timeline events hidden by RLS
          </div>
        )}
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6 ml-4">
        {visibleEvents.map((ev) => {
          return (
            <div key={ev.id} className="relative group">
              {/* Timeline Pin */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm" />

              {/* Event Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {ev.date}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ev.kind === "decision"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : ev.kind === "blocker"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : ev.kind === "discussion"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : ev.kind === "confidential"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}
                    >
                      {ev.kind}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    Tier: {ev.tier.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>

                {/* Evidence Citation */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setViewerSourceId(ev.sourceId);
                      setViewerQuote(ev.quote);
                    }}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Pin className="w-3 h-3 mr-1 text-indigo-500" />
                    Citation: {ev.sourceTitle}
                    <ExternalLink className="w-2.5 h-2.5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source Viewer Modal */}
      <SourceViewerModal
        sourceId={viewerSourceId}
        highlightQuote={viewerQuote}
        onClose={() => {
          setViewerSourceId(null);
          setViewerQuote(undefined);
        }}
      />
    </div>
  );
}
