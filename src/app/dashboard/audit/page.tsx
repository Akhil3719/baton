"use client";

import React, { useState, useEffect } from "react";
import { AuditLog } from "@/types/database";
import { 
  History, 
  Search, 
  ShieldCheck, 
  Clock, 
  User, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Upload, 
  RefreshCw,
  Database
} from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CLAIM_APPROVE":
      case "CLAIM_APPROVED":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />,
          label: "Claim Approved",
        };
      case "CLAIM_REJECT":
      case "CLAIM_REJECTED":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <XCircle className="w-3 h-3 mr-1 text-rose-600" />,
          label: "Claim Rejected",
        };
      case "CLAIM_EDIT":
      case "CLAIM_EDITED":
        return {
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <Edit3 className="w-3 h-3 mr-1 text-indigo-600" />,
          label: "Claim Edited",
        };
      case "LEAVER_QUESTION_ANSWERED":
        return {
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          icon: <User className="w-3 h-3 mr-1 text-purple-600" />,
          label: "Leaver Answered",
        };
      case "SOURCE_UPLOAD":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <Upload className="w-3 h-3 mr-1 text-blue-600" />,
          label: "Source Ingested",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          icon: <History className="w-3 h-3 mr-1 text-slate-500" />,
          label: action.replace(/_/g, " "),
        };
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && !log.action.includes(actionFilter.toUpperCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchTarget = log.target.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      return matchActor || matchTarget || matchAction;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Audit Log &amp; Provenance
            </h1>
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              {logs.length} Events Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trust Rule #6: Immutable event trail of all extractions, human approvals, edits, and leaver responses.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Log
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-500 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Filter Action:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Events</option>
            <option value="approve">Approvals</option>
            <option value="reject">Rejections</option>
            <option value="edit">Edits</option>
            <option value="leaver">Leaver Answers</option>
            <option value="source">Source Ingestions</option>
          </select>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search actor or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-slate-50/60 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target / Subject</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.actor.split("@")[0]}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {log.target}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-sm truncate">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <span>
                            {log.details.version ? `Version: v${log.details.version} • ` : ""}
                            {log.details.diffSummary ? String(log.details.diffSummary) : JSON.stringify(log.details)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trust Notice */}
      <div className="rounded-xl bg-slate-100/80 border border-slate-200 p-4 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>Provenance Guarantee:</strong> Every claim edit creates an immutable <code>claim_versions</code> row with diff snapshots. All approval decisions are cryptographically attributed to the reviewer.
          </span>
        </div>
      </div>
    </div>
  );
}
