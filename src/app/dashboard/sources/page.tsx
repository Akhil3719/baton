import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { FileText, Lock, Plus } from "lucide-react";

export default async function SourcesPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Project Sources
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filtered view according to role clearance: <strong className="text-slate-800">{currentUser.role}</strong>
          </p>
        </div>

        {currentUser.role === "owner_reviewer" && (
          <button className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors">
            <Plus className="w-4 h-4 mr-1.5" />
            Connect / Upload Source
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team Source Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              Team Access
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">GitHub Issues & PRs Export</h2>
          <p className="text-xs text-slate-500">
            Public organization issue tracker and release history.
          </p>
          <div className="pt-2 text-[11px] text-emerald-700 font-medium">
            Visible to: Contributor, Lead, Owner
          </div>
        </div>

        {/* Leads Only Source Card */}
        <div className={`rounded-xl border p-5 shadow-sm space-y-3 ${
          currentUser.role === "contributor"
            ? "bg-slate-50 border-slate-200 opacity-60"
            : "bg-white border-blue-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              Leads Only
            </span>
            {currentUser.role === "contributor" ? (
              <Lock className="w-4 h-4 text-slate-400" />
            ) : (
              <FileText className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {currentUser.role === "contributor" ? "[Restricted Source]" : "Sprint 14 Retrospective & Notes"}
          </h2>
          <p className="text-xs text-slate-500">
            {currentUser.role === "contributor" 
              ? "Access restricted by Row-Level Security policy." 
              : "Lead architectural retrospectives and deployment decisions."}
          </p>
          <div className="pt-2 text-[11px] text-slate-400 font-medium">
            Visible to: Lead, Owner
          </div>
        </div>

        {/* Confidential Source Card */}
        <div className={`rounded-xl border p-5 shadow-sm space-y-3 ${
          currentUser.role === "owner_reviewer"
            ? "bg-white border-purple-200"
            : "bg-slate-50 border-slate-200 opacity-60"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
              Confidential
            </span>
            {currentUser.role === "owner_reviewer" ? (
              <FileText className="w-4 h-4 text-purple-500" />
            ) : (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {currentUser.role === "owner_reviewer" ? "Executive Chat & Credentials" : "[Restricted Source]"}
          </h2>
          <p className="text-xs text-slate-500">
            {currentUser.role === "owner_reviewer"
              ? "Confidential leaver notes, credentials, and sponsor contacts."
              : "Access restricted by Row-Level Security policy."}
          </p>
          <div className="pt-2 text-[11px] text-slate-400 font-medium">
            Visible to: Owner/Reviewer only
          </div>
        </div>
      </div>
    </div>
  );
}
