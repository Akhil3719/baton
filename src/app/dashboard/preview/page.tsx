import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Eye, ShieldAlert } from "lucide-react";

export default async function PreviewPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "owner_reviewer") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Handover Role Preview
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect how the published handover will appear to different recipient roles before release.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <Eye className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Multi-Role Projection Sandbox
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Toggle between Owner, Lead, and Contributor perspectives to verify confidential redactions (`[Restricted]`) and role visibility tags.
        </p>
        <div className="pt-2 flex items-center justify-center text-xs text-purple-700 font-medium">
          <ShieldAlert className="w-4 h-4 mr-1 text-purple-600" />
          Zero-leak preview validation
        </div>
      </div>
    </div>
  );
}
