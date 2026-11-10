"use client";

import React, { useState } from "react";
import { SourceType, AccessLevel } from "@/types/handover";
import { X, Upload, FileText, CheckCircle2 } from "lucide-react";

interface SourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SourceUploadModal({ isOpen, onClose, onSuccess }: SourceUploadModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SourceType>("notes");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("team");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      setError("Please fill in both the title and source text.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, accessLevel, rawText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload source");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Connect / Ingest Project Source
              </h2>
              <p className="text-xs text-slate-500">
                Parses into numbered segments with locator tags and applies RLS access rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Title
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 Architecture Retrospective or Issue Export"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Format
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SourceType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="notes">Meeting Notes (Markdown)</option>
                <option value="github">GitHub Export (JSON)</option>
                <option value="chat">Chat Export (Text log)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Access Level (RLS Tier)
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="team">Team (All Roles)</option>
                <option value="leads_only">Leads Only (Incoming Lead + Owner)</option>
                <option value="confidential">Confidential (Owner Only)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Raw Source Text / Export Content
              </label>
              <span className="text-[11px] text-slate-400">
                Will be indexed into verbatim segments
              </span>
            </div>
            <textarea
              rows={8}
              placeholder="Paste Markdown notes, GitHub issues JSON array, or chat transcript lines here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Pre-Generation Security:</strong> Content is tagged with <code>{accessLevel}</code>. It will be excluded from prompt generation context for lower tiers, preventing data leaks.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Chunking & Ingesting..." : "Ingest & Index Passages"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
