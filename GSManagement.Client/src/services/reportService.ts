import { api } from "../lib/api";
import { fileSlug } from "../lib/print";
import type { MonthlyReport } from "../types/report";

const BASE = "/reports";

const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export const fetchMonthlyReport = async (
  year: number,
  month: number,
): Promise<MonthlyReport> => {
  const response = await api.get<MonthlyReport>(`${BASE}/monthly`, {
    params: { year, month },
  });
  return response.data;
};

// Downloads through the api client so the auth cookie and CSRF handling
// apply, then hands the file to the browser.
async function download(url: string, params: Record<string, unknown>, fileName: string) {
  const response = await api.get<Blob>(url, { params, responseType: "blob" });
  const href = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}

/** The monthly report as a formatted Excel workbook. */
export const downloadMonthlyReportExcel = (year: number, month: number) =>
  download(`${BASE}/monthly/export`, { year, month }, `Attendance-Report-${monthKey(year, month)}.xlsx`);

/** One employee's month as a formatted Excel workbook. */
export const downloadEmployeeMonthExcel = (userId: number, userName: string, year: number, month: number) =>
  download(
    `${BASE}/employees/${userId}/export`,
    { year, month },
    `Attendance-${fileSlug(userName)}-${monthKey(year, month)}.xlsx`,
  );
