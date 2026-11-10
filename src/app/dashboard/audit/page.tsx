import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { History, ShieldCheck } from "lucide-react";

export default async function AuditPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "owner_reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Audit Log & Provenance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log of all ingestions, extractions, edits, approvals, and acknowledgements.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-4 border-b">
          <History className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Immutable Audit Trail
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[10px]">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Actor</th>
                <th className="py-2">Action</th>
                <th className="py-2">Target</th>
                <th className="py-2">Security Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-600 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 text-slate-500">2026-11-10 14:30:00</td>
                <td>alex.leaver@nexustech.club</td>
                <td><span className="text-indigo-600 font-sans font-medium">PROJECT_INIT</span></td>
                <td>Nexus Tech Club</td>
                <td className="text-slate-400">0x8f3c...b219</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-500">2026-11-10 14:30:05</td>
                <td>alex.leaver@nexustech.club</td>
                <td><span className="text-purple-600 font-sans font-medium">RLS_POLICIES_APPLIED</span></td>
                <td>All 11 Tables</td>
                <td className="text-slate-400">0x3e1a...a940</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex items-center text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
          Trust Rule #6: All edits create versions. Full audit log retained.
        </div>
      </div>
    </div>
  );
}
