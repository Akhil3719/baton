"use client";

import React, { useState, useEffect } from "react";
import { Role } from "@/types/handover";
import { RoleHandoverView } from "@/lib/pipeline/handover-composer";
import { 
  Eye, 
  Send, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Shield, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  CheckSquare,
  AlertTriangle
} from "lucide-react";

export default function PreviewPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("incoming_lead");
  const [handoverView, setHandoverView] = useState<RoleHandoverView | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const fetchProjection = async (role: Role) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/handover?previewRole=${role}`);
      const data = await res.json();
      setHandoverView(data.handover);
    } catch (err) {
      console.error("Failed to fetch preview projection", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjection(selectedRole);
  }, [selectedRole]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMessage(null);
    try {
      const res = await fetch("/api/handover/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: selectedRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setPublishMessage(`Successfully published ${data.handover.id} snapshot for role: ${selectedRole}.`);
        await fetchProjection(selectedRole);
      }
    } catch {
      setPublishMessage("Failed to publish handover snapshot.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Handover Role Projection Sandbox
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Owner Clearance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 5G: Verify multi-role perspectives and redaction barriers before publishing official releases.
          </p>
        </div>

        {/* Publish Action */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {publishing ? "Publishing..." : `Publish Handover v${(handoverView?.version || 1) + 1}.0`}
        </button>
      </div>

      {/* Feedback Banner */}
      {publishMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{publishMessage}</span>
          </div>
          <button
            onClick={() => setPublishMessage(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Projection Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900">
            Preview Projection Mode:
          </span>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setSelectedRole("owner_reviewer")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              selectedRole === "owner_reviewer"
                ? "bg-white text-purple-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Owner / Reviewer (Full)</span>
          </button>

          <button
            onClick={() => setSelectedRole("incoming_lead")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              selectedRole === "incoming_lead"
                ? "bg-white text-blue-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Incoming Lead</span>
          </button>

          <button
            onClick={() => setSelectedRole("contributor")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              selectedRole === "contributor"
                ? "bg-white text-emerald-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Contributor (Team Only)</span>
          </button>
        </div>
      </div>

      {/* Redaction & Clearance Projection Audit */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-100">
              Projected Recipient: {selectedRole}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedRole === "contributor"
                ? "Confidential credentials, leaver personal leave notes, and leads-only architectural debates are excluded and hidden."
                : selectedRole === "incoming_lead"
                ? "Confidential master DB passwords and personal medical notes are excluded. Lead architecture and terms are accessible."
                : "Full unredacted administrator view across all tiers."}
            </p>
          </div>
        </div>

        {handoverView?.hiddenItemsCount && handoverView.hiddenItemsCount > 0 ? (
          <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-full whitespace-nowrap">
            <Lock className="w-3 h-3 inline mr-1" />
            {handoverView.hiddenNotice}
          </span>
        ) : null}
      </div>

      {/* Projection Preview Card */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Generating role projection...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                Projected Recipient View
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Handover Package v{handoverView?.version}.0
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {handoverView?.eligibleClaims.length} Approved Claims Eligible
            </span>
          </div>

          {/* First 7 Days */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              First-7-Days Plan for {selectedRole}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {handoverView?.sections.first7DaysPlan.map((p, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-700">{p.dayRange}</span>
                  <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                  <p className="text-xs text-slate-600">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              Prioritized Actions for {selectedRole}
            </h3>
            <div className="space-y-2">
              {handoverView?.sections.nextActions.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">{a.priority}</span>
                    <span className="font-medium text-slate-800">{a.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
