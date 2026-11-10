import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

export default async function TimelinePage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role === "contributor") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Decision & Discussion Timeline
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological progression of key architectural decisions, discussions, and unresolved topics.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Interactive Chronology
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Presents the timeline of events from source exports, highlighting decisions and open discussion points for {currentUser.name}.
        </p>
      </div>
    </div>
  );
}
