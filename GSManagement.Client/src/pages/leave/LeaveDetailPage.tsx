/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import type {
  LeaveRequestDto,
  LeaveStatus,
  ApiErrorBody,
} from "../../types/leave";

const API_BASE = "/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return res.status === 204 ? (null as T) : ((await res.json()) as T);
}

const STATUS_STYLES: Record<LeaveStatus, string> = {
  Pending:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-800/50",
  Approved:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-800/50",
  Reject:
    "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-rose-600/20 dark:ring-rose-800/50",
  Cancel:
    "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 ring-slate-500/20 dark:ring-zinc-700/50",
};

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requestId = Number(id);

  const [request, setRequest] = useState<LeaveRequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiFetch<LeaveRequestDto>(`/leave-requests/${requestId}`)
      .then((data) => {
        if (isMounted) setRequest(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load details.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  async function handleApprove() {
    if (!requestId) return;
    setActioning(true);
    try {
      await apiFetch(`/leave-requests/${requestId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Approved" }),
      });
      navigate(-1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve request.",
      );
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Top Header & Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <ArrowLeft size={16} /> Back to Leave Requests
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm">Fetching leave request details...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : request ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Card Title Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                <FileText size={20} />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                  Leave Request #{request.id}
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Submitted on {request.createdAt}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                STATUS_STYLES[request.status]
              }`}
            >
              {request.status}
            </span>
          </div>

          <div className="space-y-6 p-6">
            {/* Employee Profile Header */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60">
              {request.userImageUrl ? (
                <img
                  src={request.userImageUrl}
                  alt={request.userName}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300">
                  <User size={28} />
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  {request.userName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Employee ID: #{request.userId}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                  <CalendarDays size={16} />
                  <span>Leave Type</span>
                </div>
                <p className="mt-2 text-base font-medium text-slate-800 dark:text-zinc-200">
                  {request.leaveType}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                  <Clock size={16} />
                  <span>Duration</span>
                </div>
                <p className="mt-2 text-base font-medium text-slate-800 dark:text-zinc-200">
                  {request.totalDays}{" "}
                  {request.totalDays === 1 ? "Working Day" : "Working Days"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
                  <Calendar size={16} />
                  <span>Date Range</span>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-800 dark:text-zinc-200">
                  {request.startDate} <span className="text-slate-400">→</span>{" "}
                  {request.endDate}
                </p>
              </div>
            </div>

            {/* Remark Section */}
            <div className="rounded-xl border border-slate-100 p-4 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                Remark / Justification
              </span>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-zinc-300">
                {request.remark || (
                  <span className="italic text-slate-400 dark:text-zinc-500">
                    No remark provided for this request.
                  </span>
                )}
              </p>
            </div>

            {/* Audit / Action Metadata */}
            {request.approverName && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-zinc-800/40 dark:text-zinc-300">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>
                  Approved by: <strong>{request.approverName}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          {request.status === "Pending" && (
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <button
                disabled={actioning}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={16} /> Approve Request
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
