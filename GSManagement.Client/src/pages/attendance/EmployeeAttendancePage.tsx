import { useCallback, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Download,
  Loader2,
  Printer,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { Permission } from "../../lib/permissions";
import { fileSlug, printDocument } from "../../lib/print";
import { fetchEmployeeMonth } from "../../services/attendanceService";
import { downloadEmployeeMonthExcel } from "../../services/reportService";
import type { SummaryDay } from "../../types/attendance";
import Alert from "../../components/ui/Alert";
import MonthView from "../../components/attendance/MonthView";
import AttendanceRecordModal from "../../components/attendance/AttendanceRecordModal";
import AttendancePrintSheet from "../../components/report/AttendancePrintSheet";

// HR's view of one employee's month, with corrections.
export default function EmployeeAttendancePage() {
  const { id } = useParams();
  const userId = Number(id);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(Permission.UpdateAttendance) || hasPermission(Permission.CreateAttendance);

  // ?month=YYYY-MM keeps the month in the URL, so links from reports land on it.
  const now = new Date();
  const [y, m] = (params.get("month") ?? "").split("-").map(Number);
  const year = y && m ? y : now.getFullYear();
  const month = y && m ? m : now.getMonth() + 1;
  const [editing, setEditing] = useState<SummaryDay | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    useCallback(() => fetchEmployeeMonth(userId, year, month), [userId, year, month]),
    "Could not load this employee's attendance.",
  );
  const e = data?.employee;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const changeMonth = (ny: number, nm: number) => setParams({ month: `${ny}-${String(nm).padStart(2, "0")}` });

  async function exportExcel() {
    if (!e) return;
    setExporting(true);
    setExportError(null);
    try {
      await downloadEmployeeMonthExcel(e.id, e.userName, year, month);
    } catch (err) {
      setExportError(getErrorMessage(err, "Could not export this month."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl pb-4">
      {data && <AttendancePrintSheet summary={data} />}

      <div className="no-print space-y-5">
        {(exportError ?? error) && <Alert>{exportError ?? error}</Alert>}

        <MonthView
          year={year}
          month={month}
          summary={data}
          loading={loading}
          onChangeMonth={changeMonth}
          onEditDay={canEdit ? setEditing : undefined}
          // Back to wherever HR came from (daily board, report); the board if opened directly.
          onBack={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.attendance))}
          actions={
            <>
              <button
                onClick={() => e && printDocument(`Attendance-${fileSlug(e.userName)}-${monthKey}`)}
                disabled={!data}
                className="btn btn-secondary btn-sm"
              >
                <Printer size={15} /> Print
              </button>
              <button onClick={exportExcel} disabled={exporting || !data} className="btn btn-secondary btn-sm">
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Export
              </button>
            </>
          }
        />
      </div>

      {editing && e && (
        <AttendanceRecordModal
          userId={e.id}
          employeeName={e.userName}
          day={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
