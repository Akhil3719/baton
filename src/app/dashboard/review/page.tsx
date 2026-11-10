import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CheckSquare, ShieldCheck } from "lucide-react";

export default async function ReviewPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "owner_reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Review Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify evidence citations, resolve contradictions, and answer gap questions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mx-auto">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Human-in-the-Loop Review Space
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Nothing is shared without your explicit approval. Review claims with side-panel citation overlays, resolve planted contradictions, and answer questions.
        </p>
        <div className="pt-2 flex items-center justify-center text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
          Trust Rule #6: Human approval required before publishing
        </div>
      </div>
    </div>
  );
}
