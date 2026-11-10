"use client";

import React, { useEffect, useState } from "react";
import { ClaimVersion } from "@/types/database";
import { computeWordDiff, DiffPart } from "@/lib/utils/diff";
import { 
  X, 
  History, 
  Clock, 
  User, 
  GitCommit, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  AlertCircle 
} from "lucide-react";

interface VersionHistoryModalProps {
  claimId: string | null;
  currentText: string;
  onClose: () => void;
}

export function VersionHistoryModal({
  claimId,
  currentText,
  onClose,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<ClaimVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);

  useEffect(() => {
    if (!claimId) return;

    setLoading(true);
    fetch(`/api/claims/${claimId}/versions`)
      .then((res) => res.json())
      .then((data) => {
        const list: ClaimVersion[] = data.versions || [];
        setVersions(list);
        if (list.length > 0) {
          setSelectedVersionNum(list[0].version);
        }
      })
      .catch((err) => console.error("Failed to load versions", err))
      .finally(() => setLoading(false));
  }, [claimId]);

  if (!claimId) return null;

  const selectedVer = versions.find((v) => v.version === selectedVersionNum);
  const previousVer = versions.find((v) => v.version === (selectedVersionNum || 0) - 1);

  // Compute diff between selected version and previous
  const diffParts: DiffPart[] =
    selectedVer && previousVer
      ? computeWordDiff(previousVer.text, selectedVer.text)
      : selectedVer
      ? [{ type: "unchanged", text: selectedVer.text }]
      : [];

  const getReviewBadge = (state: string) => {
    switch (state) {
      case "approved":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />,
          label: "Approved",
        };
      case "rejected":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <XCircle className="w-3 h-3 mr-1 text-rose-600" />,
          label: "Rejected",
        };
      case "edited":
        return {
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <Edit3 className="w-3 h-3 mr-1 text-indigo-600" />,
          label: "Edited",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <AlertCircle className="w-3 h-3 mr-1 text-slate-500" />,
          label: "Unreviewed",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Claim Version History &amp; Diff View
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record of every edit and review decision.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading version log...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No version history logged.
            </div>
          ) : (
            <>
              {/* Timeline of Versions */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Version Sequence ({versions.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {versions.map((ver) => {
                    const isSelected = ver.version === selectedVersionNum;
                    const badge = getReviewBadge(ver.review_state);
                    return (
                      <button
                        key={ver.id}
                        onClick={() => setSelectedVersionNum(ver.version)}
                        className={`px-3 py-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            v{ver.version}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(ver.edited_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          by {ver.edited_by.split("@")[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Version Details & Diff Box */}
              {selectedVer && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Version {selectedVer.version} Details
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(selectedVer.edited_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Summary:</strong> {selectedVer.diff_summary || "Statement update"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      <strong>Author:</strong> {selectedVer.edited_by}
                    </p>
                  </div>

                  {/* Visual Word Diff */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {previousVer ? `Diff (v${previousVer.version} → v${selectedVer.version})` : `Initial Version Statement`}
                      </span>
                      {previousVer && (
                        <div className="flex items-center space-x-3 text-[10px] font-medium">
                          <span className="text-rose-600 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-rose-500 mr-1 inline-block" />
                            Removed
                          </span>
                          <span className="text-emerald-700 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 inline-block" />
                            Added
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white font-mono text-xs leading-relaxed text-slate-800 shadow-sm">
                      {previousVer ? (
                        diffParts.map((part, idx) => {
                          if (part.type === "added") {
                            return (
                              <mark
                                key={idx}
                                className="bg-emerald-100 text-emerald-900 font-semibold px-1 py-0.5 rounded border border-emerald-300"
                              >
                                {part.text}
                              </mark>
                            );
                          } else if (part.type === "removed") {
                            return (
                              <span
                                key={idx}
                                className="bg-rose-100 text-rose-900 line-through px-1 py-0.5 rounded border border-rose-300"
                              >
                                {part.text}
                              </span>
                            );
                          }
                          return <span key={idx}>{part.text}</span>;
                        })
                      ) : (
                        <p>{selectedVer.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
