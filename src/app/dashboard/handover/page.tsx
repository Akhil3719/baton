"use client";

import React, { useState, useEffect } from "react";
import { RoleHandoverView } from "@/lib/pipeline/handover-composer";
import { DemoUser } from "@/types/handover";
import { SourceViewerModal } from "@/components/sources/SourceViewerModal";
import { 
  CheckSquare, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Pin, 
  ExternalLink, 
  CheckCircle2, 
  Send, 
  Clock, 
  User, 
  FolderGit2, 
  FileText,
  RefreshCw,
  Sparkles
} from "lucide-react";

export default function HandoverPage() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [handover, setHandover] = useState<RoleHandoverView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackSuccess, setAckSuccess] = useState<string | null>(null);
  const [checklistCompleted, setChecklistCompleted] = useState<{ [id: string]: boolean }>({});

  // Citation modal state
  const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
  const [viewerQuote, setViewerQuote] = useState<string | undefined>(undefined);

  const fetchHandoverData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/handover");
      const data = await res.json();
      setCurrentUser(data.activeUser);
      setHandover(data.handover);
    } catch (err) {
      console.error("Failed to load handover view", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoverData();
  }, []);

  const handleAcknowledge = async () => {
    if (!handover) return;
    setAcknowledging(true);
    setAckSuccess(null);

    try {
      const res = await fetch("/api/handover/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handoverId: handover.handoverId,
          notes: "Formally accepted and verified handover package.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAckSuccess(data.message);
        await fetchHandoverData();
      }
    } catch {
      setAckSuccess("Failed to acknowledge receipt.");
    } finally {
      setAcknowledging(false);
    }
  };

  const openCitation = (sourceTitle: string, quote: string) => {
    // Look up matching source ID from eligible claims
    const claimMatch = handover?.eligibleClaims.find((c) =>
      c.evidence.some((e) => e.source_title === sourceTitle)
    );
    const ev = claimMatch?.evidence.find((e) => e.source_title === sourceTitle);

    setViewerSourceId(ev?.resolved_source_id || "src-github");
    setViewerQuote(quote);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              v{handover?.version || 1}.0 Published Handover
            </span>
            <span className="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Clearance: {currentUser?.role}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Nexus Tech Club: Official Handover Package
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Published by <strong>{handover?.createdBy}</strong> on{" "}
            {handover?.publishedAt ? new Date(handover.publishedAt).toLocaleDateString() : "Active Sprint"}
          </p>
        </div>

        {/* Quick Refresh */}
        <button
          onClick={fetchHandoverData}
          className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh Handover
        </button>
      </div>

      {/* Hidden Items Notice (Section 5G: "N items hidden (access required)" without revealing content) */}
      {handover?.hiddenItemsCount && handover.hiddenItemsCount > 0 ? (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300">
                {handover.hiddenNotice}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Content is partitioned by Row-Level Security and pre-generation prompt boundaries. Only claims authorized for your role clearance are presented.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 border border-slate-700 px-2 py-1 rounded">
            RLS Enforcement Active
          </span>
        </div>
      ) : null}

      {/* Acknowledgement Status Banner */}
      {handover?.acknowledgement?.acknowledged ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold">
                Handover Receipt Formally Acknowledged
              </span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Signed by <strong>{handover.acknowledgement.user}</strong> on{" "}
                {new Date(handover.acknowledgement.at).toLocaleString()}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
            Immutable Receipt Logged
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold">
                Formal Receipt Sign-off Pending
              </span>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Please review the onboarding plan and prioritized next actions below, then acknowledge receipt.
              </p>
            </div>
          </div>

          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {acknowledging ? "Signing..." : "Acknowledge Receipt"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading role-tailored handover package...
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: FIRST-7-DAYS ONBOARDING PLAN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  First-7-Days Onboarding Roadmap
                </h2>
                <p className="text-[11px] text-slate-400">
                  Role-tailored milestone schedule derived from approved project claims.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {handover?.sections.first7DaysPlan.map((plan, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {plan.dayRange}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{plan.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {plan.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                      {plan.citations.map((c, j) => (
                        <button
                          key={j}
                          onClick={() => openCitation(c.sourceTitle, c.quote)}
                          className="inline-flex items-center text-[10px] text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono truncate max-w-full"
                          title={`Citation from ${c.sourceTitle}`}
                        >
                          <Pin className="w-2.5 h-2.5 mr-1 text-indigo-400" />
                          <span className="truncate">{c.sourceTitle}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: PRIORITIZED NEXT ACTIONS CHECKLIST */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Prioritized Next Actions Checklist
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Action items with evidence citations ready for incoming execution.
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {Object.values(checklistCompleted).filter(Boolean).length}/
                {handover?.sections.nextActions.length || 0} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {handover?.sections.nextActions.map((action) => {
                const isChecked = checklistCompleted[action.id] || false;
                return (
                  <div
                    key={action.id}
                    onClick={() => toggleChecklistItem(action.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      isChecked
                        ? "bg-slate-50 border-slate-200 opacity-70"
                        : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecklistItem(action.id)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            action.priority === "P0"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : action.priority === "P1"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {action.priority}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isChecked ? "line-through text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {action.action}
                        </span>
                      </div>

                      {action.citations.length > 0 && (
                        <div
                          className="flex flex-wrap gap-1.5 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {action.citations.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => openCitation(c.sourceTitle, c.quote)}
                              className="inline-flex items-center text-[10px] text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                            >
                              <Pin className="w-2.5 h-2.5 mr-1 text-slate-400" />
                              {c.sourceTitle}
                              <ExternalLink className="w-2.5 h-2.5 ml-1 text-slate-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: OWNERSHIP SUMMARY & RISKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ownership Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Domain Ownership Summary
                </h3>
              </div>

              <div className="space-y-3">
                {handover?.sections.ownershipSummary.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {item.domain}
                      </span>
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {item.owner}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Identified Risks & Mitigations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Active Risks &amp; Mitigations
                </h3>
              </div>

              <div className="space-y-3">
                {handover?.sections.risks.map((risk, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {risk.title}
                    </p>
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Source Viewer Modal */}
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
