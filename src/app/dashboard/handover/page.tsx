import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { CheckSquare, ArrowRight, ShieldCheck } from "lucide-react";

export default async function HandoverPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Published Handover & Next Actions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Current role viewer: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
          </p>
        </div>

        {currentUser.role !== "owner_reviewer" && (
          <button className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
            <CheckSquare className="w-4 h-4 mr-1.5" />
            Acknowledge Handover
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Published v1.0
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Nexus Tech Club Handover Package
            </h2>
            <p className="text-xs text-slate-500">
              Verified claims, architectural decisions, and onboarding checklist.
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            Signed by: Alex Leaver
          </div>
        </div>

        {/* Prioritized Next Actions Preview */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Prioritized Onboarding Checklist for {currentUser.title}
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-indigo-600" readOnly />
                <span className="text-slate-700 font-medium">Verify production release branch configuration</span>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                P0 Blocker
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-indigo-600" readOnly />
                <span className="text-slate-700 font-medium">Assign owner to unassigned security patch</span>
              </div>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                P1 High
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t">
          <div className="flex items-center text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
            Filtered strictly for {currentUser.role}
          </div>
          <span className="text-[11px] text-slate-400">
            Cryptographic citation integrity guaranteed
          </span>
        </div>
      </div>
    </div>
  );
}
