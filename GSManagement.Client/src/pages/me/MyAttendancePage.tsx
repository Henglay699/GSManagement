import { useCallback, useState } from "react";
import {
  Printer,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { fileSlug, printDocument } from "../../lib/print";
import { fetchMySummary } from "../../services/employeeAttendanceService";
import Alert from "../../components/ui/Alert";
import MonthView from "../../components/attendance/MonthView";
import AttendancePrintSheet from "../../components/report/AttendancePrintSheet";

// The employee's own monthly summary: the same view HR has of them.
export default function MyAttendancePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, loading, error } = useAsync(
    useCallback(() => fetchMySummary(year, month), [year, month]),
    "Could not load your attendance.",
  );

  return (
    <div className="mx-auto max-w-7xl pb-10">
      {data && <AttendancePrintSheet summary={data} />}

      <div className="no-print space-y-5">
        {error && <Alert>{error}</Alert>}
        <MonthView
          year={year}
          month={month}
          summary={data}
          loading={loading}
          onChangeMonth={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
          actions={
            <button
              onClick={() =>
                data &&
                printDocument(`Attendance-${fileSlug(data.employee.userName)}-${year}-${String(month).padStart(2, "0")}`)
              }
              disabled={!data}
              className="btn btn-secondary btn-sm"
            >
              <Printer size={15} />
              Print
            </button>
          }
        />
      </div>
    </div>
  );
}
