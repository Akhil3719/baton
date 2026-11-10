import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { 
  Shield, 
  UserCheck, 
  Users, 
  FileText, 
  Cpu, 
  CheckSquare, 
  Clock, 
  History, 
  ArrowRight, 
  Lock, 
  FolderGit2, 
  AlertTriangle 
} from "lucide-react";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  const getRoleHeader = () => {
    switch (currentUser.role) {
      case "owner_reviewer":
        return {
          title: "Owner / Reviewer Control Center",
          badge: "Full Clearance (Tier 3: Confidential, Leads & Team)",
          badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <Shield className="w-5 h-5 text-purple-600" />,
          desc: "You have complete authority to manage project sources, run the reconstruction AI pipeline, resolve contradictions, and publish verified handovers.",
          accentColor: "border-purple-200 bg-purple-50/30",
        };
      case "incoming_lead":
        return {
          title: "Incoming Lead Handover Portal",
          badge: "Lead Clearance (Tier 2: Leads & Team)",
          badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <UserCheck className="w-5 h-5 text-blue-600" />,
          desc: "You can view published lead-tier handovers, inspect decisions, review architectural gaps, and sign off with your formal acknowledgement.",
          accentColor: "border-blue-200 bg-blue-50/30",
        };
      case "contributor":
      default:
        return {
          title: "Contributor Handover Portal",
          badge: "Team Clearance (Tier 1: Team Only)",
          badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <Users className="w-5 h-5 text-emerald-600" />,
          desc: "You have access to published team knowledge items, public setup instructions, and unblocked next steps. Restricted items are safeguarded.",
          accentColor: "border-emerald-200 bg-emerald-50/30",
        };
    }
  };

  const roleMeta = getRoleHeader();

  return (
    <div className="space-y-8">
      {/* Role Banner */}
      <div className={`rounded-2xl border p-6 ${roleMeta.accentColor} transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/80">
              {roleMeta.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {roleMeta.title}
                </h1>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleMeta.badgeBg}`}>
                  {roleMeta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Logged in as <strong>{currentUser.name}</strong> ({currentUser.email}). {roleMeta.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              Switch Role
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Project Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Nexus Tech Club
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Demo Project
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Primary engineering repository & organization handover workspace
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
              Handover in Progress
            </span>
          </div>
        </div>

        {/* Role-Specific Actions Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
          {/* Action 1: Sources */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  Step 1
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Authorized Sources</h3>
              <p className="text-xs text-slate-500 mt-1">
                {currentUser.role === "owner_reviewer"
                  ? "Manage GitHub issues, meeting notes, and confidential chat channels."
                  : currentUser.role === "incoming_lead"
                  ? "View team and leads-only technical notes and issues."
                  : "View public team issues and instructions."}
              </p>
            </div>
            <Link
              href="/dashboard/sources"
              className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Explore Sources <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {/* Action 2: Review or Timeline */}
          {currentUser.role === "owner_reviewer" ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-purple-600 uppercase">
                    Step 2: Review
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Review Workspace</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verify evidence citations, resolve branch contradictions, and answer leaver questions.
                </p>
              </div>
              <Link
                href="/dashboard/review"
                className="mt-4 inline-flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700"
              >
                Open Workspace <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase">
                    Timeline
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Decision Chronology</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect the chronological sequence of architectural choices, PRs, and resolved blockers.
                </p>
              </div>
              <Link
                href="/dashboard/timeline"
                className="mt-4 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Timeline <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          )}

          {/* Action 3: Handover & Actions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase">
                  Final: Handover
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {currentUser.role === "owner_reviewer"
                  ? "Publish & Share"
                  : "Handover & Next Actions"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {currentUser.role === "owner_reviewer"
                  ? "Lock verified claims and publish role-filtered snapshots."
                  : "Review your prioritized next actions and sign off with your formal acknowledgement."}
              </p>
            </div>
            <Link
              href="/dashboard/handover"
              className="mt-4 inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Go to Handover <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Security / RLS Clearance Breakdown */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Security & Row-Level Security (RLS) Clearance Table
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 pr-4">Access Tier</th>
                  <th className="py-2 pr-4">Target Content Examples</th>
                  <th className="py-2 pr-4">Your Role Access ({currentUser.role})</th>
                  <th className="py-2">Enforcement Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-600">
                <tr>
                  <td className="py-2.5 font-semibold text-slate-800">Team</td>
                  <td className="py-2.5">Public issues, meeting notes, setup guide</td>
                  <td className="py-2.5 font-medium text-emerald-600">✓ Granted</td>
                  <td className="py-2.5 text-slate-400">Postgres RLS (`access_level = &apos;team&apos;`)</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-slate-800">Leads Only</td>
                  <td className="py-2.5">Architecture shifts, sprint retros, unassigned items</td>
                  <td className="py-2.5 font-medium">
                    {currentUser.role === "contributor" ? (
                      <span className="text-rose-600 font-semibold inline-flex items-center">
                        <Lock className="w-3 h-3 mr-1" /> Blocked by RLS
                      </span>
                    ) : (
                      <span className="text-emerald-600">✓ Granted</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-400">Pre-generation prompt filter + RLS</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-slate-800">Confidential</td>
                  <td className="py-2.5">Credentials, sponsor contracts, leaver leave notes</td>
                  <td className="py-2.5 font-medium">
                    {currentUser.role === "owner_reviewer" ? (
                      <span className="text-emerald-600">✓ Granted</span>
                    ) : (
                      <span className="text-rose-600 font-semibold inline-flex items-center">
                        <Lock className="w-3 h-3 mr-1" /> Blocked ([Restricted])
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-400">Zero-leak pre-filter + RLS check</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
