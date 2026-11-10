"use client";

import React, { useState } from "react";
import { VerifiedClaim, VerifiedEvidence } from "@/lib/pipeline/integrity";
import { SourceViewerModal } from "@/components/sources/SourceViewerModal";
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  Pin, 
  ExternalLink, 
  ShieldCheck, 
  Filter,
  Check,
  XCircle
} from "lucide-react";

interface ClaimsBoardProps {
  claims: VerifiedClaim[];
  onRefresh?: () => void;
}

export function ClaimsBoard({ claims, onRefresh }: ClaimsBoardProps) {
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Source viewer modal state
  const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
  const [viewerHighlightQuote, setViewerHighlightQuote] = useState<string | undefined>(undefined);
  const [viewerTargetIdx, setViewerTargetIdx] = useState<number | undefined>(undefined);

  const openSourceCitation = (evidence: VerifiedEvidence) => {
    setViewerSourceId(evidence.resolved_source_id);
    setViewerHighlightQuote(evidence.exact_quote);
    setViewerTargetIdx(evidence.passage_idx);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1 flex-shrink-0" />,
          label: "Verified",
          desc: "Passes code substring check",
        };
      case "inferred":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-300",
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600 mr-1 flex-shrink-0" />,
          label: "Inferred",
          desc: "No verbatim quote match",
        };
      case "conflicting":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-300",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mr-1 flex-shrink-0" />,
          label: "Conflicting",
          desc: "Contradiction flagged",
        };
      case "missing":
      default:
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-300",
          icon: <AlertCircle className="w-3.5 h-3.5 text-purple-600 mr-1 flex-shrink-0" />,
          label: "Missing",
          desc: "Missing owner or rationale",
        };
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "confidential":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "leads_only":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "team":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Filter claims
  const filteredClaims = claims.filter((claim) => {
    if (kindFilter !== "all" && claim.kind !== kindFilter) return false;
    if (statusFilter !== "all" && claim.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = claim.text.toLowerCase().includes(q);
      const matchDetails =
        claim.conflict_details?.toLowerCase().includes(q) ||
        claim.gap_details?.toLowerCase().includes(q);
      const matchEvidence = claim.evidence.some(
        (e) =>
          e.exact_quote.toLowerCase().includes(q) ||
          e.source_title.toLowerCase().includes(q)
      );
      return matchText || matchDetails || matchEvidence;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses ({claims.length})</option>
              <option value="verified">Verified</option>
              <option value="inferred">Inferred</option>
              <option value="conflicting">Conflicting</option>
              <option value="missing">Missing</option>
            </select>
          </div>

          {/* Kind Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Kind:</span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              <option value="all">All Kinds</option>
              <option value="decision">Decision</option>
              <option value="owner">Owner</option>
              <option value="risk">Risk</option>
              <option value="open_question">Open Question</option>
              <option value="dependency">Dependency</option>
              <option value="blocker">Blocker</option>
              <option value="recurring_problem">Recurring Problem</option>
              <option value="next_action">Next Action</option>
              <option value="contact">Contact</option>
            </select>
          </div>
        </div>

        {/* Live Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search claims & citations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-2">
          <p className="text-xs font-bold text-slate-700">No claims match the selected filters</p>
          <p className="text-xs text-slate-400">
            Try adjusting your kind/status filters or clearing your search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            const statusBadge = getStatusBadge(claim.status);
            return (
              <div
                key={claim.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all space-y-3.5"
              >
                {/* Header: Kind, Status, Tier */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {claim.kind.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
                    >
                      {statusBadge.icon}
                      {statusBadge.label}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTierBadge(
                      claim.tier
                    )}`}
                  >
                    Tier: {claim.tier.replace("_", " ")}
                  </span>
                </div>

                {/* Claim Statement */}
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {claim.text}
                </p>

                {/* Conflict Details Callout */}
                {claim.status === "conflicting" && claim.conflict_details && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Contradiction Detected:</span>
                      <p className="mt-0.5 text-rose-800 leading-relaxed">
                        {claim.conflict_details}
                      </p>
                    </div>
                  </div>
                )}

                {/* Missing Information / Gap Callout */}
                {claim.status === "missing" && claim.gap_details && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Information Gap:</span>
                      <p className="mt-0.5 text-purple-800 leading-relaxed">
                        {claim.gap_details}
                      </p>
                    </div>
                  </div>
                )}

                {/* Citations & Source Chips */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Supporting Citations ({claim.evidence.length})
                  </span>

                  {claim.evidence.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No direct citation passage linked. (Marked Inferred)
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {claim.evidence.map((ev, i) => (
                        <button
                          key={i}
                          onClick={() => openSourceCitation(ev)}
                          className={`inline-flex items-center text-xs px-2.5 py-1.5 rounded-xl border transition-all text-left shadow-sm ${
                            ev.verified
                              ? "bg-slate-50 hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-300 text-slate-800"
                              : "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/70"
                          }`}
                          title={
                            ev.verified
                              ? "Click to open source viewer and highlight verbatim passage"
                              : "Quote failed code-level substring check"
                          }
                        >
                          <Pin className="w-3 h-3 mr-1.5 text-indigo-500 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-[11px] truncate max-w-[220px]">
                              {ev.source_title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {ev.locator}
                            </span>
                          </div>

                          <span className="ml-2 pl-2 border-l border-slate-200/80 flex items-center">
                            {ev.verified ? (
                              <span className="inline-flex items-center text-[10px] font-medium text-emerald-700">
                                <Check className="w-3 h-3 mr-0.5 text-emerald-600" />
                                Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-medium text-rose-700">
                                <XCircle className="w-3 h-3 mr-0.5 text-rose-600" />
                                Failed
                              </span>
                            )}
                            <ExternalLink className="w-2.5 h-2.5 ml-1 text-slate-400" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Citation Source Viewer Modal */}
      <SourceViewerModal
        sourceId={viewerSourceId}
        highlightQuote={viewerHighlightQuote}
        targetIdx={viewerTargetIdx}
        onClose={() => {
          setViewerSourceId(null);
          setViewerHighlightQuote(undefined);
          setViewerTargetIdx(undefined);
        }}
      />
    </div>
  );
}
