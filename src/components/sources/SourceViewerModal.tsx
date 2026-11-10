"use client";

import React, { useEffect, useState, useRef } from "react";
import { Source, Passage } from "@/types/database";
import { 
  X, 
  FileText, 
  Clock, 
  User, 
  Search, 
  Lock, 
  CheckCircle2, 
  Hash, 
  Copy, 
  Check 
} from "lucide-react";

interface SourceViewerModalProps {
  sourceId: string | null;
  highlightQuote?: string;
  targetIdx?: number;
  onClose: () => void;
}

export function SourceViewerModal({
  sourceId,
  highlightQuote,
  targetIdx,
  onClose,
}: SourceViewerModalProps) {
  const [source, setSource] = useState<Source | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"segments" | "raw">("segments");
  const [searchQuery, setSearchQuery] = useState(highlightQuote || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const segmentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!sourceId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/sources/${sourceId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load source");
        }
        setSource(data.source);
        setPassages(data.passages || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sourceId]);

  // Auto-scroll to target passage or matching quote
  useEffect(() => {
    if (passages.length === 0) return;

    let targetIndex = targetIdx;

    if (!targetIndex && highlightQuote) {
      const match = passages.find((p) =>
        p.text.toLowerCase().includes(highlightQuote.toLowerCase())
      );
      if (match) {
        targetIndex = match.idx;
      }
    }

    if (targetIndex && segmentRefs.current[targetIndex]) {
      setTimeout(() => {
        segmentRefs.current[targetIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 200);
    }
  }, [passages, targetIdx, highlightQuote]);

  if (!sourceId) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-300 text-slate-950 font-semibold px-1 py-0.5 rounded shadow-sm border border-amber-400"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case "confidential":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "leads_only":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "team":
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  {source?.title || "Project Source"}
                </h2>
                {source && (
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getAccessBadge(
                      source.access_level
                    )}`}
                  >
                    {source.access_level.replace("_", " ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Format: <span className="uppercase font-semibold">{source?.type}</span> •{" "}
                {passages.length} Numbered Locators
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Tabs Toolbar */}
        {!error && source && (
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab("segments")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "segments"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Indexed Segments ({passages.length})
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "raw"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Verbatim Raw Text
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Highlight quote / keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Access Restricted by RLS Policy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {error}
              </p>
              <p className="text-[11px] text-slate-400">
                Trust Rule #4: Permission filtering prevents restricted sources from entering lower-role workspaces.
              </p>
            </div>
          )}

          {!loading && !error && source && (
            <>
              {activeTab === "segments" ? (
                <div className="space-y-4">
                  {passages.map((p) => {
                    const isTarget = targetIdx === p.idx || (highlightQuote && p.text.toLowerCase().includes(highlightQuote.toLowerCase()));
                    return (
                      <div
                        key={p.id}
                        ref={(el) => {
                          segmentRefs.current[p.idx] = el;
                        }}
                        className={`rounded-xl border p-4 bg-white transition-all shadow-sm ${
                          isTarget
                            ? "border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/20"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Segment Header */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              <Hash className="w-3 h-3 mr-1 text-slate-500" />
                              Segment #{p.idx}
                            </span>
                            {p.author && (
                              <span className="inline-flex items-center text-[11px] text-slate-600">
                                <User className="w-3 h-3 mr-1 text-slate-400" />
                                {p.author}
                              </span>
                            )}
                            {p.timestamp && (
                              <span className="inline-flex items-center text-[11px] text-slate-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {p.timestamp}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {isTarget && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-amber-600" />
                                Cited Match
                              </span>
                            )}
                            <button
                              onClick={() => copyToClipboard(p.text, p.id)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded"
                              title="Copy segment text"
                            >
                              {copiedId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Segment Text */}
                        <div className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                          {highlightMatch(p.text, searchQuery)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {highlightMatch(source.raw_text, searchQuery)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
