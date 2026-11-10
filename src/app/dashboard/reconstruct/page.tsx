import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Cpu, ShieldCheck } from "lucide-react";

export default async function ReconstructPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "owner_reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Knowledge Reconstruction Pipeline
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Permission-delimited Gemini extraction & pure-code citation verification.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <Cpu className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Ready for Pipeline Execution
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          In Phase 2 & 3, clicking Reconstruct will process authorized passages through Gemini structured output and verify citations directly in code.
        </p>
        <div className="pt-2 flex items-center justify-center text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
          Pre-generation permission barrier active
        </div>
      </div>
    </div>
  );
}
