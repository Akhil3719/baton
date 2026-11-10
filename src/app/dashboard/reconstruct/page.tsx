"use client";

import React, { useState, useEffect } from "react";
import { VerifiedClaim } from "@/lib/pipeline/integrity";
import { ClaimsBoard } from "@/components/claims/ClaimsBoard";
import { 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Database,
  ArrowRight,
  RotateCcw
} from "lucide-react";

export default function ReconstructPage() {
  const [claims, setClaims] = useState<VerifiedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canFallback, setCanFallback] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/claims");
      const data = await res.json();
      setClaims(data.claims || []);
    } catch {
      setError("Failed to fetch claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleRunPipeline = async (useCache: boolean = false) => {
    setRunning(true);
    setError(null);
    setRunMessage(null);
    setCanFallback(false);

    try {
      const res = await fetch("/api/pipeline/reconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCache }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reconstruction failed");
        if (data.canFallbackToCache) {
          setCanFallback(true);
        }
        return;
      }

      setRunMessage(
        data.isCached
          ? `Loaded ${data.claimsCount} code-verified claims from cached baseline run.`
          : `Extracted & verified ${data.claimsCount} claims with Gemini model output.`
      );
      setClaims(data.claims || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pipeline execution failed");
      setCanFallback(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Knowledge Reconstruction Pipeline
            </h1>
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Gemini Structured Extraction + Code Verification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Extracts evidence-linked claims, validates verbatim citations in code, and flags contradictions and missing rationale.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Fast Path: Use Cached Run */}
          <button
            onClick={() => handleRunPipeline(true)}
            disabled={running}
            className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors disabled:opacity-50"
            title="Load pre-validated baseline extraction immediately without consuming API quota"
          >
            <Database className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Use Cached Run
          </button>

          {/* Live API Run */}
          <button
            onClick={() => handleRunPipeline(false)}
            disabled={running}
            className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Extracting & Verifying...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Run Extraction (Gemini)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Trust Notice & Pre-Generation Barrier Card */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Code Verification Active</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Claims are <strong>only marked Verified</strong> if their quoted evidence exists verbatim in the cited source text via normalized substring match in server code. No hallucinated citations pass.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
            <span className="text-[10px] text-slate-400 block uppercase">Prompt Isolation</span>
            <span className="font-semibold text-emerald-400">Strict XML Delimiters</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
            <span className="text-[10px] text-slate-400 block uppercase">Integrity Check</span>
            <span className="font-semibold text-indigo-400">Pure Code Substring</span>
          </div>
        </div>
      </div>

      {/* Error & Retry Banner (Never invent content on failure) */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Extraction Pipeline Interrupted
              </h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                {error}
              </p>
              <p className="text-[11px] text-rose-500 mt-1 italic">
                Trust Rule #7: Baton never invents or simulates claims on API error.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 border-t border-rose-200/60">
            <button
              onClick={() => handleRunPipeline(false)}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Retry API Call
            </button>
            {canFallback && (
              <button
                onClick={() => handleRunPipeline(true)}
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-100/50"
              >
                <Database className="w-3 h-3 mr-1" />
                Switch to Cached Sample Run
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {runMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{runMessage}</span>
          </div>
          <button
            onClick={() => setRunMessage(null)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Claims Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Extracted & Code-Verified Claims Board
            </h2>
            <p className="text-xs text-slate-500">
              Filtered and tagged claims ready for human review and approval.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            {claims.length} Claims
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading claims...
          </div>
        ) : (
          <ClaimsBoard claims={claims} onRefresh={fetchClaims} />
        )}
      </div>
    </div>
  );
}
