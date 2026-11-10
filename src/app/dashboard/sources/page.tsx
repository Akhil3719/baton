"use client";

import React, { useState, useEffect } from "react";
import { Source } from "@/types/database";
import { DemoUser } from "@/types/handover";
import { SourceViewerModal } from "@/components/sources/SourceViewerModal";
import { SourceUploadModal } from "@/components/sources/SourceUploadModal";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Eye, 
  RefreshCw, 
  Database, 
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function SourcesPage() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Modals state
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [highlightQuote, setHighlightQuote] = useState<string | undefined>(undefined);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadSources = async () => {
    try {
      setLoading(true);
      const [userRes, sourcesRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/sources"),
      ]);

      const userData = await userRes.json();
      const sourcesData = await sourcesRes.json();

      setCurrentUser(userData.user);
      setSources(sourcesData.sources || []);
    } catch (err) {
      console.error("Failed to load sources", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSeedProject = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage("Successfully loaded 'Nexus Tech Club' sample project with all 6 sources and 9 planted test traps!");
        await loadSources();
      } else {
        setSeedMessage(`Error: ${data.error}`);
      }
    } catch {
      setSeedMessage("Failed to seed sample project.");
    } finally {
      setSeeding(false);
    }
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case "confidential":
        return {
          label: "Confidential",
          style: "bg-purple-100 text-purple-800 border-purple-200",
          desc: "Owner Only",
        };
      case "leads_only":
        return {
          label: "Leads Only",
          style: "bg-blue-100 text-blue-800 border-blue-200",
          desc: "Lead & Owner",
        };
      case "team":
      default:
        return {
          label: "Team Access",
          style: "bg-emerald-100 text-emerald-800 border-emerald-200",
          desc: "All Roles",
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "github":
        return <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">GitHub</span>;
      case "notes":
        return <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Notes</span>;
      case "chat":
        return <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Chat</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Project Sources & Passages
            </h1>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
              {sources.length} Authorized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active clearance: <strong className="text-slate-800 uppercase">{currentUser?.role || "..."}</strong>. Row-Level Security filters out unauthorized sources before display.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Load Sample Project Button */}
          <button
            onClick={handleSeedProject}
            disabled={seeding}
            className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {seeding ? "Seeding Project..." : "Load Sample Project"}
          </button>

          {/* Upload Button (Owner / Reviewer Only) */}
          {currentUser?.role === "owner_reviewer" && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Source
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {seedMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>{seedMessage}</span>
          </div>
          <button
            onClick={() => setSeedMessage(null)}
            className="text-xs text-indigo-600 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Clearance Explanation Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900">
              Clearance: {currentUser?.role === "owner_reviewer" ? "Tier 3 (Confidential, Leads & Team)" : currentUser?.role === "incoming_lead" ? "Tier 2 (Leads & Team)" : "Tier 1 (Team Only)"}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentUser?.role === "owner_reviewer"
                ? "You can view all 6 sources including confidential executive credentials."
                : currentUser?.role === "incoming_lead"
                ? "Confidential chat source is blocked. You can view 5 team & lead-tier sources."
                : "Restricted sources are completely blocked by RLS. You can view public team sources only."}
            </p>
          </div>
        </div>

        {currentUser?.role !== "owner_reviewer" && (
          <div className="inline-flex items-center text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            <Lock className="w-3 h-3 mr-1 text-rose-500" />
            {currentUser?.role === "contributor"
              ? "3 Restricted Sources Hidden"
              : "1 Confidential Source Hidden"}
          </div>
        )}
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading authorized project sources...
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Sources Loaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Load Sample Project&quot; above to seed the Nexus Tech Club demo repository and all 9 planted traps.
          </p>
          <button
            onClick={handleSeedProject}
            className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Load Sample Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sources.map((source) => {
            const badge = getAccessBadge(source.access_level);
            return (
              <div
                key={source.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getTypeIcon(source.type)}
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.style}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {source.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded by: {source.uploaded_by || "System"}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {source.raw_text.slice(0, 140)}...
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {source.id.slice(0, 8)}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedSourceId(source.id);
                      setHighlightQuote(undefined);
                    }}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Inspect Passages
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SourceViewerModal
        sourceId={selectedSourceId}
        highlightQuote={highlightQuote}
        onClose={() => {
          setSelectedSourceId(null);
          setHighlightQuote(undefined);
        }}
      />

      <SourceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadSources}
      />
    </div>
  );
}
