import { FormEvent, useCallback, useState } from "react";
import { AlertCircle, Clock, Sun, Moon } from "lucide-react";
import UserSelect from "../ui/UserSelect";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { fetchUserOptions } from "../../services/userService";
import {
  createLeaveRequest,
  updateLeaveRequest,
} from "../../services/leaveService";
import { createMyLeaveRequest } from "../../services/myLeaveService";
import {
  LEAVE_TYPES,
  type HalfDayPeriod,
  type LeaveRequestDto,
  type LeaveStatus,
  type LeaveType,
} from "../../types/leave";

interface LeaveFormModalProps {
  request?: LeaveRequestDto;
  onClose: () => void;
  onSaved: () => void;
  // Employee requesting leave for themselves: no employee picker or status,
  // and it goes to the self-service endpoint as Pending.
  self?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-indigo-400";
const labelClass =
  "mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400";

export default function LeaveFormModal({
  request,
  onClose,
  onSaved,
  self = false,
}: LeaveFormModalProps) {
  const isEdit = !!request;
  const [form, setForm] = useState({
    userId: request ? String(request.userId) : "",
    leaveType: request?.leaveType ?? ("Sick" as LeaveType),
    startDate: request?.startDate ?? "",
    endDate: request?.endDate ?? "",
    status: request?.status ?? ("Pending" as LeaveStatus),
    remark: request?.remark ?? "",
    isHalfDay: request?.isHalfDay ?? false,
    halfDayPeriod: (request?.halfDayPeriod ?? "Morning") as HalfDayPeriod,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = useAsync(
    useCallback(
      () => (self ? Promise.resolve([]) : fetchUserOptions()),
      [self],
    ),
    "Failed to load employees.",
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const finalEndDate = form.isHalfDay ? form.startDate : form.endDate;

    if ((!self && !form.userId) || !form.startDate || !finalEndDate) {
      setError(
        self
          ? "Please fill in the start and end date."
          : "Please fill in employee, start date, and end date.",
      );
      return;
    }
    if (finalEndDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    const details = {
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: finalEndDate,
      remark: form.remark || undefined,
      isHalfDay: form.isHalfDay,
      halfDayPeriod: form.isHalfDay ? form.halfDayPeriod : undefined,
    };
    const common = { ...details, userId: Number(form.userId) };

    setSubmitting(true);
    try {
      if (self) {
        await createMyLeaveRequest(details);
      } else if (request) {
        await updateLeaveRequest(request.id, {
          ...common,
          status: form.status,
        });
      } else {
        await createLeaveRequest({ ...common, initialStatus: "Approved" });
      }
      onSaved();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          isEdit
            ? "Failed to update the request."
            : "Failed to create the request.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const shownError = error ?? users.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          {isEdit
            ? "Edit Leave Request"
            : self
              ? "Request Leave"
              : "Create Leave Request"}
        </h2>

        {shownError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
            <AlertCircle size={16} className="shrink-0" />
            <span>{shownError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!self && (
            <div>
              <label className={labelClass}>Employee</label>
              <UserSelect
                users={users.data ?? []}
                loading={users.loading}
                value={form.userId}
                onChange={(userId) => setForm({ ...form, userId })}
                placeholder="Search and select employee..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={isEdit ? "" : "col-span-2"}>
              <label className={labelClass}>Leave Type</label>
              <select
                value={form.leaveType}
                onChange={(e) =>
                  setForm({ ...form, leaveType: e.target.value as LeaveType })
                }
                className={inputClass}
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className={labelClass}>
                  {isEdit ? "Status" : "Set status to"}
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as LeaveStatus })
                  }
                  className={inputClass}
                >
                  {isEdit ? (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Reject">Rejected</option>
                      <option value="Cancel">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved (skip review)</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Half-Day Leave Toggle */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock
                  size={15}
                  className="text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  Half-Day Leave
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHalfDay}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isHalfDay: e.target.checked,
                      endDate: e.target.checked ? form.startDate : form.endDate,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {form.isHalfDay && (
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, halfDayPeriod: "Morning" })}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    form.halfDayPeriod === "Morning"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                  }`}
                >
                  <Sun size={13} />
                  <span>Morning (8AM - 12PM)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, halfDayPeriod: "Afternoon" })
                  }
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    form.halfDayPeriod === "Afternoon"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                  }`}
                >
                  <Moon size={13} />
                  <span>Afternoon (1PM - 5PM)</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={form.isHalfDay ? "col-span-2" : ""}>
              <label className={labelClass}>
                {form.isHalfDay ? "Leave Date" : "Start Date"}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startDate: e.target.value,
                    endDate: form.isHalfDay ? e.target.value : form.endDate,
                  })
                }
                className={inputClass}
              />
            </div>
            {!form.isHalfDay && (
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Remark (optional)</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
              className={`${inputClass} placeholder:text-slate-400 dark:placeholder:text-zinc-500`}
              placeholder="Reason or context for this leave..."
            />
          </div>

          <div className="mt-5 flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isEdit
                ? submitting
                  ? "Saving..."
                  : "Save Changes"
                : submitting
                  ? "Submitting..."
                  : self
                    ? "Submit Request"
                    : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
