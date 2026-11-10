"use client";

import React, { useState, useEffect } from "react";
import { VerifiedClaim, VerifiedEvidence } from "@/lib/pipeline/integrity";
import { ConflictGroup, GapItem } from "@/types/gaps";
import { SourceViewerModal } from "@/components/sources/SourceViewerModal";
import { VersionHistoryModal } from "@/components/review/VersionHistoryModal";
import { 
  CheckSquare, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Edit3, 
  X, 
  ExternalLink, 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  Pin, 
  UserCheck, 
  Check, 
  XCircle,
  Clock,
  History,
  RotateCcw
} from "lucide-react";

export default function ReviewWorkspacePage() {
  const [activeTab, setActiveTab] = useState<"claims" | "conflicts" | "gaps">("claims");
  const [claims, setClaims] = useState<VerifiedClaim[]>([]);
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected claim for side-panel citation inspection
  const [selectedClaim, setSelectedClaim] = useState<VerifiedClaim | null>(null);

  // Version history modal state
  const [historyClaimId, setHistoryClaimId] = useState<string | null>(null);
  const [historyClaimText, setHistoryClaimText] = useState("");

  // Editing state
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Leaver question answering state
  const [answeringGapId, setAnsweringGapId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState<{ [gapId: string]: string }>({});
  const [submittingGap, setSubmittingGap] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Source viewer modal
  const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
  const [viewerQuote, setViewerQuote] = useState<string | undefined>(undefined);
  const [viewerIdx, setViewerIdx] = useState<number | undefined>(undefined);

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsRes, gapsRes] = await Promise.all([
        fetch("/api/claims"),
        fetch("/api/gaps"),
      ]);

      const claimsData = await claimsRes.json();
      const gapsData = await gapsRes.json();

      const loadedClaims: VerifiedClaim[] = claimsData.claims || [];
      setClaims(loadedClaims);
      if (loadedClaims.length > 0 && !selectedClaim) {
        setSelectedClaim(loadedClaims[0]);
      }

      setGaps(gapsData.gaps || []);
      setConflicts(gapsData.conflictGroups || []);
    } catch (err) {
      console.error("Failed to load review data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewAction = async (claimId: string, action: "approve" | "reject" | "edit") => {
    try {
      const res = await fetch(`/api/claims/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editedText: action === "edit" ? editingText : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.claim) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? data.claim : c))
        );
        if (selectedClaim?.id === claimId) {
          setSelectedClaim(data.claim);
        }
        setEditingClaimId(null);
        setFeedbackMsg(
          action === "reject"
            ? `Claim rejected and excluded from all handovers. Version v${data.claim.version} logged in audit trail.`
            : `Claim successfully ${action}d (Version: v${data.claim.version}). Logged in audit trail.`
        );
      }
    } catch {
      setFeedbackMsg("Failed to update claim review state.");
    }
  };

  const handleAnswerSubmit = async (gapId: string) => {
    const text = answerInput[gapId];
    if (!text || !text.trim()) return;

    setSubmittingGap(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/gaps/${gapId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: text.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(data.message);
        setAnsweringGapId(null);
        await loadData();
      } else {
        setFeedbackMsg(`Error: ${data.error}`);
      }
    } catch {
      setFeedbackMsg("Failed to submit leaver answer.");
    } finally {
      setSubmittingGap(false);
    }
  };

  const openSourceCitation = (ev: VerifiedEvidence) => {
    setViewerSourceId(ev.resolved_source_id);
    setViewerQuote(ev.exact_quote);
    setViewerIdx(ev.passage_idx);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-300",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />,
          label: "Verified",
        };
      case "inferred":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-300",
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600 mr-1" />,
          label: "Inferred",
        };
      case "conflicting":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-300",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mr-1" />,
          label: "Conflicting",
        };
      case "missing":
      default:
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-300",
          icon: <AlertCircle className="w-3.5 h-3.5 text-purple-600 mr-1" />,
          label: "Missing",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Review Workspace
            </h1>
            <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200 font-semibold">
              Owner Clearance (Trust Rule #6)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Human-in-the-loop review: approve claims, inspect side-by-side contradictions, and answer leaver questions.
          </p>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "claims"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Claims &amp; Review ({claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("conflicts")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "conflicts"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Contradictions ({conflicts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("gaps")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === "gaps"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Questions for Leaver ({gaps.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs text-indigo-600 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CLAIMS & CITATIONS REVIEW WORKSPACE */}
      {/* ========================================================================= */}
      {activeTab === "claims" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Claims List with Approval Buttons */}
          <div className="lg:col-span-7 space-y-4">
            {claims.map((claim) => {
              const statusBadge = getStatusBadge(claim.status);
              const isSelected = selectedClaim?.id === claim.id;
              const isEditing = editingClaimId === claim.id;
              const isPending = !claim.review_state || claim.review_state === "pending";

              return (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`rounded-2xl border p-5 bg-white cursor-pointer transition-all shadow-sm ${
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-200/60 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2.5">
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

                    <div className="flex items-center space-x-2">
                      {/* Version history button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryClaimId(claim.id!);
                          setHistoryClaimText(claim.text);
                        }}
                        className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                        title="View immutable version history and diff"
                      >
                        <History className="w-3 h-3 mr-1 text-slate-500" />
                        v{claim.version || 1}
                      </button>

                      {/* Review State Badge: "Unreviewed" on AI-only claims */}
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          claim.review_state === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : claim.review_state === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : claim.review_state === "edited"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-amber-50 text-amber-800 border-amber-200 font-bold"
                        }`}
                      >
                        {isPending ? "Unreviewed (AI-Generated)" : claim.review_state}
                      </span>
                    </div>
                  </div>

                  {/* Claim Text or Inline Editor */}
                  {isEditing ? (
                    <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full text-xs font-medium p-2.5 rounded-lg border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingClaimId(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReviewAction(claim.id!, "edit")}
                          className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                          Save New Version
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {claim.text}
                    </p>
                  )}

                  {/* Citations Preview & Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] text-slate-400">
                      {claim.evidence.length} Cited Passages
                    </span>

                    {/* Review Action Buttons */}
                    <div
                      className="flex items-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingClaimId(claim.id!);
                          setEditingText(claim.text);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 flex items-center text-xs font-medium"
                        title="Edit claim text (creates new version)"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleReviewAction(claim.id!, "reject")}
                        className={`p-1.5 rounded-lg flex items-center text-xs font-medium transition-colors ${
                          claim.review_state === "rejected"
                            ? "bg-rose-100 text-rose-800 font-bold"
                            : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        }`}
                        title="Reject claim (excluded from handover publication)"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        {claim.review_state === "rejected" ? "Rejected" : "Reject"}
                      </button>

                      <button
                        onClick={() => handleReviewAction(claim.id!, "approve")}
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          claim.review_state === "approved"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {claim.review_state === "approved" ? "Approved" : "Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Split Panel with Verbatim Citation Overlay */}
          <div className="lg:col-span-5 sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Supporting Passage Inspection
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Code Verifier Active
              </span>
            </div>

            {selectedClaim ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Selected Claim
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {selectedClaim.text}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Verbatim Passages in Source Documents ({selectedClaim.evidence.length})
                  </span>

                  {selectedClaim.evidence.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      No direct citation passage linked. Status downgraded to Inferred per Trust Rule #1.
                    </div>
                  ) : (
                    selectedClaim.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center">
                            <Pin className="w-3 h-3 mr-1 text-indigo-500" />
                            {ev.source_title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {ev.locator}
                          </span>
                        </div>

                        {/* Stated by leaver badge */}
                        {(ev as any).is_leaver_statement && (
                          <div className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-3 h-3 mr-1 text-emerald-600" />
                            Stated by leaver
                          </div>
                        )}

                        {/* Quoted Text */}
                        <div className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                          &quot;{ev.exact_quote}&quot;
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span
                            className={`font-semibold flex items-center ${
                              ev.verified ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {ev.verified ? (
                              <>
                                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                                Substring Check: Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                                Substring Check: Not Found
                              </>
                            )}
                          </span>

                          <button
                            onClick={() => openSourceCitation(ev)}
                            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Open Source <ExternalLink className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">
                Select a claim on the left to inspect verbatim citations.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONFLICTS & CONTRADICTIONS (SIDE-BY-SIDE PRESENTATION) */}
      {/* ========================================================================= */}
      {activeTab === "conflicts" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 flex items-start space-x-3 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-sm">Contradictions Detected Across Authorised Sources</h2>
              <p className="mt-0.5 text-rose-800 leading-relaxed">
                Section 5D: Both claims are marked <strong>Conflicting</strong>. Below, both statements and their verbatim evidence passages are displayed side-by-side for human resolution.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {conflicts.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                      Conflict Group
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{group.topic}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{group.description}</p>
                </div>

                {/* Side-by-Side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Claim A */}
                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Statement A: {group.claim_a.source_title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {group.claim_a.locator}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {group.claim_a.text}
                    </p>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 font-mono text-xs text-slate-800 leading-relaxed">
                      &quot;{group.claim_a.quote}&quot;
                    </div>
                  </div>

                  {/* Claim B */}
                  <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Statement B: {group.claim_b.source_title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {group.claim_b.locator}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {group.claim_b.text}
                    </p>
                    <div className="bg-white p-2.5 rounded-lg border border-rose-200 font-mono text-xs text-slate-800 leading-relaxed">
                      &quot;{group.claim_b.quote}&quot;
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUESTIONS FOR THE LEAVER (DIRECT ANSWERING INTERFACE) */}
      {/* ========================================================================= */}
      {activeTab === "gaps" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-purple-50 border border-purple-200 p-5 flex items-start space-x-3 text-xs text-purple-900">
            <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-sm">Leaver Q&amp;A &amp; Missing Information Resolution</h2>
              <p className="mt-0.5 text-purple-800 leading-relaxed">
                Section 5F: Answering a question creates a new <code>leaver_response</code> source with clearance <code>leads_only</code>. It is attached as evidence with a <strong>&quot;Stated by leaver&quot;</strong> badge, and the claim moves to <strong>Inferred</strong> until approved.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {gaps.map((gap) => {
              const isAnswering = answeringGapId === gap.id;
              const hasAnswer = Boolean(gap.answer);

              return (
                <div
                  key={gap.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {gap.kind}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{gap.title}</h3>
                    </div>

                    {hasAnswer ? (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Answered by Leaver
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Awaiting Response
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {gap.description}
                  </p>

                  {/* Question Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Question for Alex Leaver (Departing Lead):</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900">
                      &quot;{gap.question_for_leaver}&quot;
                    </p>
                  </div>

                  {/* Existing Answer Display or Answering Form */}
                  {hasAnswer ? (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <UserCheck className="w-3 h-3 mr-1 text-emerald-600" />
                          Stated by leaver
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Clearance: Leads Only • Status: Inferred
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {gap.answer}
                      </p>
                    </div>
                  ) : isAnswering ? (
                    <div className="space-y-3 pt-2">
                      <textarea
                        rows={3}
                        placeholder="Type your response as the departing lead..."
                        value={answerInput[gap.id] || ""}
                        onChange={(e) =>
                          setAnswerInput((prev) => ({
                            ...prev,
                            [gap.id]: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-3 rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setAnsweringGapId(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAnswerSubmit(gap.id)}
                          disabled={submittingGap}
                          className="inline-flex items-center px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                        >
                          <Send className="w-3 h-3 mr-1.5" />
                          {submittingGap ? "Recording..." : "Submit Leaver Response"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setAnsweringGapId(gap.id);
                          if (!answerInput[gap.id]) {
                            let defaultAns = "";
                            if (gap.id === "gap-db-switch") {
                              defaultAns = "We migrated to PostgreSQL on Supabase because of required ACID transactional consistency for billing records and native foreign key relations with Row Level Security.";
                            } else if (gap.id === "gap-unowned-issue") {
                              defaultAns = "Morgan Stone (Incoming Lead) is designated to own and patch Issue #89 before the release.";
                            } else if (gap.id === "gap-branch-conflict") {
                              defaultAns = "The active production deployment branch is main. Release-v2.1 was decommissioned after cherry-pick drift.";
                            } else if (gap.id === "gap-auth-provider") {
                              defaultAns = "I recommend native Supabase Auth over Clerk to leverage PostgreSQL Row Level Security policies directly.";
                            }
                            setAnswerInput((prev) => ({ ...prev, [gap.id]: defaultAns }));
                          }
                        }}
                        className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Answer as Alex Leaver
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <SourceViewerModal
        sourceId={viewerSourceId}
        highlightQuote={viewerQuote}
        targetIdx={viewerIdx}
        onClose={() => {
          setViewerSourceId(null);
          setViewerQuote(undefined);
          setViewerIdx(undefined);
        }}
      />

      <VersionHistoryModal
        claimId={historyClaimId}
        currentText={historyClaimText}
        onClose={() => {
          setHistoryClaimId(null);
          setHistoryClaimText("");
        }}
      />
    </div>
  );
}
