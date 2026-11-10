"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { Shield, UserCheck, Users, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleSelectRole = async (roleKey: string) => {
    setLoadingRole(roleKey);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-2xl shadow-md mb-2">
          B
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Sign In to Baton
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Welcome, Hackathon Judge! Baton enforces strict Row-Level Security and pre-generation permission boundaries. Choose a demo persona below to explore:
        </p>
      </div>

      {/* Demo Persona Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* 1. Owner / Reviewer */}
        <div className="rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Tier 3: All Access
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {DEMO_USERS.reviewer.name}
              </h2>
              <p className="text-xs text-purple-700 font-medium">
                {DEMO_USERS.reviewer.title}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full administrator & departing engineer. Can view confidential data, run extraction, review claims, resolve contradictions, and publish.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 flex-shrink-0" />
                Sees confidential credentials & notes
              </div>
              <div className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 flex-shrink-0" />
                Can approve & publish handovers
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSelectRole("reviewer")}
            disabled={loadingRole !== null}
            className="mt-6 w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow transition-colors disabled:opacity-50"
          >
            {loadingRole === "reviewer" ? "Switching..." : "Enter as Owner / Reviewer"}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>

        {/* 2. Incoming Lead */}
        <div className="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Tier 2: Leads Only
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {DEMO_USERS.incoming_lead.name}
              </h2>
              <p className="text-xs text-blue-700 font-medium">
                {DEMO_USERS.incoming_lead.title}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The incoming engineering leader. Can see team and lead-tier handover documents, architectural decisions, and sign off with acknowledgement.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 flex-shrink-0" />
                Accesses architectural discussions
              </div>
              <div className="flex items-center text-rose-600 font-medium">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-rose-500 flex-shrink-0" />
                Confidential items strictly redacted
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSelectRole("incoming_lead")}
            disabled={loadingRole !== null}
            className="mt-6 w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow transition-colors disabled:opacity-50"
          >
            {loadingRole === "incoming_lead" ? "Switching..." : "Enter as Incoming Lead"}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>

        {/* 3. Contributor */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tier 1: Team Only
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {DEMO_USERS.contributor.name}
              </h2>
              <p className="text-xs text-emerald-700 font-medium">
                {DEMO_USERS.contributor.title}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard team member. Only approved team-level claims and public team documents are accessible. All restricted content is completely blocked by RLS.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 flex-shrink-0" />
                Reads team approved items
              </div>
              <div className="flex items-center text-rose-600 font-medium">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-rose-500 flex-shrink-0" />
                Cannot view leads/confidential sources
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSelectRole("contributor")}
            disabled={loadingRole !== null}
            className="mt-6 w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow transition-colors disabled:opacity-50"
          >
            {loadingRole === "contributor" ? "Switching..." : "Enter as Contributor"}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Trust Notice */}
      <div className="rounded-xl bg-slate-100/80 border border-slate-200 p-4 text-center">
        <p className="text-xs text-slate-600">
          <strong>Trust Rule #4 in Action:</strong> Permission filtering happens <em>before</em> generation. Restricted sources never enter prompts for lower roles, and RLS enforces cryptographic database barriers on all queries.
        </p>
      </div>
    </div>
  );
}
