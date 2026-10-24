using System.Globalization;
using ClosedXML.Excel;
using GSManagement.Api.Features.AttendanceFeature.Summary;
using GSManagement.Api.Features.ReportFeature.DTOs;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.ReportFeature;

/// <summary>
/// Formatted Excel workbooks for the attendance exports: a letterhead, a styled
/// header row, frozen panes, number formats and print setup (A4, repeated
/// header row, page numbers), so the file is ready to share or print as is.
/// </summary>
public static class ReportExcelBuilder
{
    private const string Company = "Grateful Solutions Cambodia Co., Ltd";

    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;
    private static readonly LeaveType[] LeaveTypes = Enum.GetValues<LeaveType>();

    private static readonly XLColor Ink = XLColor.FromHtml("#0F172A");
    private static readonly XLColor Muted = XLColor.FromHtml("#64748B");
    private static readonly XLColor HeaderFill = XLColor.FromHtml("#1E293B");
    private static readonly XLColor Line = XLColor.FromHtml("#CBD5E1");
    private static readonly XLColor Zebra = XLColor.FromHtml("#F8FAFC");
    private static readonly XLColor TotalFill = XLColor.FromHtml("#E2E8F0");

    // ---------------------------------------------------------------- monthly

    public static byte[] Monthly(MonthlyReportDto report)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Monthly report");

        var headers = new List<string>
        {
            "No.", "Employee", "Email", "Role", "Working days", "Present", "On time", "Late",
            "Late (min)", "Left early", "Absent", "Leave days"
        };
        headers.AddRange(LeaveTypes.Select(t => $"{t} leave"));
        headers.AddRange(["Missed clock-outs", "Hours worked", "Overtime (h)", "Attendance", "Punctuality"]);
        var lastCol = headers.Count;

        var x = report.Totals;
        var leaveByType = string.Join(" · ", LeaveTypes.Select(lt =>
            $"{lt} {report.Employees.Sum(r => r.Totals.LeaveByType.GetValueOrDefault(lt)).ToString("0.#", Inv)}"));

        var row = Letterhead(ws, "Monthly Attendance Report", lastCol,
        [
            ("Period", PeriodLabel(report.Year, report.Month, report.PeriodEnd)),
            ("Working days", $"{report.WorkingDays} (Mon–Sat, excl. public holidays)"),
            ("Employees", x.Employees.ToString(Inv)),
            ("Leave by type (days)", leaveByType),
        ]);
        row = Figures(ws, row, lastCol, perLine: 4,
        [
            ("Avg. attendance", $"{x.AverageAttendanceRate.ToString("0.#", Inv)}%"),
            ("Avg. punctuality", $"{x.AveragePunctualityRate.ToString("0.#", Inv)}%"),
            ("Hours worked", x.WorkedHours.ToString("#,##0", Inv)),
            ("Overtime", $"{x.OvertimeHours.ToString("0.#", Inv)}h"),
            ("Late arrivals", x.LateDays.ToString(Inv)),
            ("Absent days", x.AbsentDays.ToString(Inv)),
            ("Leave days", x.LeaveDays.ToString("0.#", Inv)),
            ("Missed clock-outs", x.MissedClockOuts.ToString(Inv)),
        ]);

        var headerRow = row;
        WriteHeader(ws, headerRow, headers);

        var i = 0;
        foreach (var r in report.Employees.OrderBy(r => r.Employee.UserName, StringComparer.OrdinalIgnoreCase))
        {
            row++;
            i++;
            var (e, t) = (r.Employee, r.Totals);
            var c = 1;
            ws.Cell(row, c++).Value = i;
            ws.Cell(row, c++).Value = e.UserName;
            ws.Cell(row, c++).Value = e.Email;
            ws.Cell(row, c++).Value = e.Roles;
            ws.Cell(row, c++).Value = t.WorkingDays;
            ws.Cell(row, c++).Value = t.PresentDays;
            ws.Cell(row, c++).Value = t.OnTimeDays;
            ws.Cell(row, c++).Value = t.LateDays;
            ws.Cell(row, c++).Value = t.LateMinutes;
            ws.Cell(row, c++).Value = t.EarlyLeaveDays;
            ws.Cell(row, c++).Value = t.AbsentDays;
            ws.Cell(row, c++).Value = t.LeaveDays;
            foreach (var lt in LeaveTypes)
                ws.Cell(row, c++).Value = t.LeaveByType.GetValueOrDefault(lt);
            ws.Cell(row, c++).Value = t.MissedClockOuts;
            ws.Cell(row, c++).Value = t.WorkedHours;
            ws.Cell(row, c++).Value = t.OvertimeHours;
            ws.Cell(row, c++).Value = t.AttendanceRate / 100;
            ws.Cell(row, c).Value = t.PunctualityRate / 100;

            if (i % 2 == 0) ws.Range(row, 1, row, lastCol).Style.Fill.BackgroundColor = Zebra;
            if (t.AbsentDays > 0) ws.Cell(row, 11).Style.Font.FontColor = XLColor.FromHtml("#BE123C");
            if (t.LateDays > 0) ws.Cell(row, 8).Style.Font.FontColor = XLColor.FromHtml("#B45309");
        }
        var lastDataRow = row;

        // Totals: sums for counts, averages for the rates.
        row++;
        ws.Cell(row, 2).Value = "Total";
        ws.Cell(row, 6).Value = x.PresentDays;
        ws.Cell(row, 8).Value = x.LateDays;
        ws.Cell(row, 10).Value = x.EarlyLeaveDays;
        ws.Cell(row, 11).Value = x.AbsentDays;
        ws.Cell(row, 12).Value = x.LeaveDays;
        var tc = 13;
        foreach (var lt in LeaveTypes)
            ws.Cell(row, tc++).Value = report.Employees.Sum(r => r.Totals.LeaveByType.GetValueOrDefault(lt));
        ws.Cell(row, tc++).Value = x.MissedClockOuts;
        ws.Cell(row, tc++).Value = x.WorkedHours;
        ws.Cell(row, tc++).Value = x.OvertimeHours;
        ws.Cell(row, tc++).Value = x.AverageAttendanceRate / 100;
        ws.Cell(row, tc).Value = x.AveragePunctualityRate / 100;
        StyleTotal(ws.Range(row, 1, row, lastCol));

        // Formats and alignment.
        var body = ws.Range(headerRow + 1, 1, row, lastCol);
        body.Style.Border.BottomBorder = XLBorderStyleValues.Hair;
        body.Style.Border.BottomBorderColor = Line;
        ws.Range(headerRow + 1, 5, row, lastCol).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        ws.Range(headerRow + 1, lastCol - 3, row, lastCol - 2).Style.NumberFormat.Format = "#,##0.0";
        ws.Range(headerRow + 1, lastCol - 1, row, lastCol).Style.NumberFormat.Format = "0.0%";
        ws.Column(1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        if (lastDataRow > headerRow)
            ws.Range(headerRow, 1, lastDataRow, lastCol).SetAutoFilter();

        row = Signatures(ws, row + 3, lastCol, ["Prepared by (HR)", "Checked by", "Approved by"]);

        Finish(ws, headerRow, freezeColumns: 2, landscape: true,
            title: $"Monthly Attendance Report · {MonthName(report.Year, report.Month)}");
        ws.Column(1).Width = 6;
        ws.Column(3).Width = Math.Min(ws.Column(3).Width, 32);
        return Save(wb);
    }

    // --------------------------------------------------------------- employee

    public static byte[] Employee(MonthSummaryDto s)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Attendance");
        string[] headers =
            ["Date", "Day", "Status", "Check-in", "Check-out", "Worked", "Late (min)", "Left early (min)", "Overtime (min)", "Notes"];
        var lastCol = headers.Length;
        var (e, t) = (s.Employee, s.Totals);

        var row = Letterhead(ws, "Employee Attendance Record", lastCol,
        [
            ("Employee", e.UserName),
            ("Email", e.Email),
            ("Role", string.IsNullOrWhiteSpace(e.Roles) ? "–" : e.Roles),
            ("Period", PeriodLabel(s.Year, s.Month, s.PeriodEnd)),
            ("Working days", t.WorkingDays.ToString(Inv)),
        ]);
        row = Figures(ws, row, lastCol, perLine: 5,
        [
            ("Attendance", $"{t.AttendanceRate.ToString("0.#", Inv)}%"),
            ("Punctuality", $"{t.PunctualityRate.ToString("0.#", Inv)}%"),
            ("Present", $"{t.PresentDays} / {t.WorkingDays}"),
            ("Late", $"{t.LateDays}d · {t.LateMinutes} min"),
            ("Absent", $"{t.AbsentDays}d"),
            ("Leave", $"{t.LeaveDays.ToString("0.#", Inv)}d"),
            ("Hours worked", $"{t.WorkedHours.ToString("0.#", Inv)}h"),
            ("Overtime", $"{t.OvertimeHours.ToString("0.#", Inv)}h"),
            ("Left early", $"{t.EarlyLeaveDays}d"),
            ("Missed clock-outs", t.MissedClockOuts.ToString(Inv)),
        ]);

        // Section title, as on the printout.
        ws.Cell(row, 1).Value = "DAILY RECORD";
        ws.Cell(row, 1).Style.Font.SetBold().Font.SetFontSize(8).Font.SetFontColor(XLColor.FromHtml("#334155"));
        var leaveTaken = LeaveTaken(t);
        if (leaveTaken.Length > 0)
        {
            ws.Cell(row, 3).Value = $"Leave taken: {leaveTaken}";
            ws.Cell(row, 3).Style.Font.SetFontSize(8).Font.SetFontColor(Muted);
        }
        row++;

        var headerRow = row;
        WriteHeader(ws, headerRow, headers);

        foreach (var d in s.Days.Where(d => d.Status != DayStatus.Upcoming))
        {
            row++;
            var date = d.Date.ToDateTime(TimeOnly.MinValue);
            ws.Cell(row, 1).Value = date;
            ws.Cell(row, 2).Value = date.ToString("ddd", Inv);
            ws.Cell(row, 3).Value = StatusLabel(d.Status);
            if (d.CheckInTime is { } ci) ws.Cell(row, 4).Value = ci.ToTimeSpan();
            if (d.CheckOutTime is { } co) ws.Cell(row, 5).Value = co.ToTimeSpan();
            if (d.WorkedMinutes > 0) ws.Cell(row, 6).Value = TimeSpan.FromMinutes(d.WorkedMinutes);
            if (d.LateMinutes > 0) ws.Cell(row, 7).Value = d.LateMinutes;
            if (d.EarlyLeaveMinutes > 0) ws.Cell(row, 8).Value = d.EarlyLeaveMinutes;
            if (d.OvertimeMinutes > 0) ws.Cell(row, 9).Value = d.OvertimeMinutes;
            ws.Cell(row, 10).Value = Notes(d);

            var (fill, ink) = StatusColors(d.Status);
            ws.Cell(row, 3).Style.Fill.BackgroundColor = fill;
            ws.Cell(row, 3).Style.Font.FontColor = ink;
            if (d.Status is DayStatus.DayOff or DayStatus.Holiday)
                ws.Range(row, 1, row, lastCol).Style.Font.FontColor = Muted;
        }

        row++;
        ws.Cell(row, 1).Value = "Total";
        ws.Cell(row, 6).Value = TimeSpan.FromMinutes(s.Days.Sum(d => d.WorkedMinutes));
        ws.Cell(row, 7).Value = t.LateMinutes;
        ws.Cell(row, 8).Value = s.Days.Sum(d => d.EarlyLeaveMinutes);
        ws.Cell(row, 9).Value = s.Days.Sum(d => d.OvertimeMinutes);
        StyleTotal(ws.Range(row, 1, row, lastCol));

        var body = ws.Range(headerRow + 1, 1, row, lastCol);
        body.Style.Border.BottomBorder = XLBorderStyleValues.Hair;
        body.Style.Border.BottomBorderColor = Line;
        ws.Range(headerRow + 1, 1, row, 1).Style.NumberFormat.Format = "dd mmm yyyy";
        ws.Range(headerRow + 1, 4, row, 5).Style.NumberFormat.Format = "hh:mm";
        ws.Range(headerRow + 1, 6, row, 6).Style.NumberFormat.Format = "[h]:mm";
        ws.Range(headerRow + 1, 4, row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

        row = Signatures(ws, row + 3, lastCol, ["Employee", "Prepared by (HR)", "Approved by"]);

        Finish(ws, headerRow, freezeColumns: 0, landscape: false,
            title: $"Attendance · {e.UserName} · {MonthName(s.Year, s.Month)}");
        ws.Column(2).Width = 7;
        ws.Column(10).Width = Math.Clamp(ws.Column(10).Width, 24, 48);
        ws.Column(10).Style.Alignment.WrapText = true;
        return Save(wb);
    }

    // ---------------------------------------------------------------- helpers

    /// <summary>
    /// The printout's letterhead: logo, company name and legal name on the left,
    /// report title and generated time on the right, a heavy rule under both,
    /// then the details as small uppercase labels over bold values.
    /// Returns the next free row.
    /// </summary>
    private static int Letterhead(IXLWorksheet ws, string title, int lastCol, (string Label, string Value)[] meta)
    {
        ws.Row(1).Height = 20;
        ws.Row(2).Height = 14;

        if (Logo.Value is { } logo)
        {
            using var stream = new MemoryStream(logo);
            ws.AddPicture(stream).MoveTo(ws.Cell(1, 1), 2, 2).WithSize(40, 40);
        }

        // Company block, starting after the logo.
        var split = Math.Max(3, lastCol / 2);
        ws.Cell(1, 2).Value = "Grateful Solutions";
        ws.Range(1, 2, 1, split).Merge().Style.Font.SetBold().Font.SetFontSize(13).Font.SetFontColor(Ink);
        ws.Cell(2, 2).Value = "Cambodia Co., Ltd";
        ws.Range(2, 2, 2, split).Merge().Style.Font.SetFontSize(8).Font.SetFontColor(Muted);

        // Title block on the right.
        ws.Cell(1, split + 1).Value = title.ToUpperInvariant();
        var t = ws.Range(1, split + 1, 1, lastCol).Merge();
        t.Style.Font.SetBold().Font.SetFontSize(13).Font.SetFontColor(Ink);
        t.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        ws.Cell(2, split + 1).Value = $"Generated {DateTime.Now.ToString("dd MMM yyyy, HH:mm", Inv)}";
        var g = ws.Range(2, split + 1, 2, lastCol).Merge();
        g.Style.Font.SetFontSize(8).Font.SetFontColor(Muted);
        g.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

        var rule = ws.Range(2, 1, 2, lastCol);
        rule.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
        rule.Style.Border.BottomBorderColor = Ink;

        // Details: label over value, spread across the sheet.
        const int labelRow = 4, valueRow = 5;
        var span = Math.Max(1, lastCol / meta.Length);
        for (var k = 0; k < meta.Length; k++)
        {
            var from = 1 + k * span;
            var to = k == meta.Length - 1 ? lastCol : from + span - 1;
            ws.Cell(labelRow, from).Value = meta[k].Label.ToUpperInvariant();
            ws.Range(labelRow, from, labelRow, to).Merge().Style.Font.SetBold().Font.SetFontSize(7).Font.SetFontColor(Muted);
            ws.Cell(valueRow, from).Value = meta[k].Value;
            ws.Range(valueRow, from, valueRow, to).Merge().Style.Font.SetBold().Font.SetFontColor(Ink);
        }
        return valueRow + 2;
    }

    /// <summary>Headline figures as a grid of boxes, like the printout. Returns the next free row.</summary>
    private static int Figures(IXLWorksheet ws, int row, int lastCol, int perLine, (string Label, string Value)[] figures)
    {
        var span = Math.Max(1, lastCol / perLine);
        for (var k = 0; k < figures.Length; k++)
        {
            var labelRow = row + k / perLine * 2;
            var slot = k % perLine;
            var from = 1 + slot * span;
            var to = slot == perLine - 1 ? lastCol : from + span - 1;

            ws.Cell(labelRow, from).Value = figures[k].Label.ToUpperInvariant();
            ws.Range(labelRow, from, labelRow, to).Merge().Style.Font.SetFontSize(7).Font.SetFontColor(Muted);
            ws.Cell(labelRow + 1, from).Value = figures[k].Value;
            ws.Range(labelRow + 1, from, labelRow + 1, to).Merge().Style.Font.SetBold().Font.SetFontSize(11).Font.SetFontColor(Ink);

            var box = ws.Range(labelRow, from, labelRow + 1, to);
            box.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            box.Style.Border.OutsideBorderColor = Line;
            box.Style.Alignment.Indent = 1;
        }
        var lines = (figures.Length + perLine - 1) / perLine;
        return row + lines * 2 + 1;
    }

    // The company logo, embedded in the API (Assets/report-logo.png); null if missing.
    private static readonly Lazy<byte[]?> Logo = new(() =>
    {
        using var stream = typeof(ReportExcelBuilder).Assembly.GetManifestResourceStream("report-logo.png");
        if (stream is null) return null;
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        return ms.ToArray();
    });

    private static void WriteHeader(IXLWorksheet ws, int row, IReadOnlyList<string> headers)
    {
        for (var c = 0; c < headers.Count; c++)
            ws.Cell(row, c + 1).Value = headers[c];
        var r = ws.Range(row, 1, row, headers.Count);
        r.Style.Fill.BackgroundColor = HeaderFill;
        r.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
        r.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        r.Style.Alignment.WrapText = true;
        ws.Row(row).Height = 30;
    }

    private static void StyleTotal(IXLRange r)
    {
        r.Style.Font.SetBold();
        r.Style.Fill.BackgroundColor = TotalFill;
        r.Style.Border.TopBorder = XLBorderStyleValues.Thin;
        r.Style.Border.TopBorderColor = Ink;
    }

    /// <summary>Signature lines spread across the sheet. Returns the last row used.</summary>
    private static int Signatures(IXLWorksheet ws, int row, int lastCol, string[] roles)
    {
        var span = Math.Max(2, lastCol / roles.Length);
        for (var k = 0; k < roles.Length; k++)
        {
            var from = 1 + k * span;
            var to = Math.Min(lastCol, from + span - 2);
            var line = ws.Range(row, from, row, to);
            line.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            line.Style.Border.BottomBorderColor = Ink;
            ws.Cell(row + 1, from).Value = roles[k];
            ws.Cell(row + 1, from).Style.Font.SetBold();
            ws.Cell(row + 2, from).Value = "Name, signature & date";
            ws.Cell(row + 2, from).Style.Font.SetFontColor(Muted).Font.SetFontSize(9);
        }
        ws.Row(row).Height = 34;
        return row + 2;
    }

    private static void Finish(IXLWorksheet ws, int headerRow, int freezeColumns, bool landscape, string title)
    {
        ws.Style.Font.FontName = "Calibri";
        ws.Columns().AdjustToContents(headerRow, headerRow + 500);
        foreach (var col in ws.ColumnsUsed())
            col.Width = Math.Clamp(col.Width + 2, 8, 40);

        ws.SheetView.Freeze(headerRow, freezeColumns);
        ws.ShowGridLines = false;

        var p = ws.PageSetup;
        p.PaperSize = XLPaperSize.A4Paper;
        p.PageOrientation = landscape ? XLPageOrientation.Landscape : XLPageOrientation.Portrait;
        p.FitToPages(1, 0);
        p.Margins.Left = p.Margins.Right = 0.4;
        p.Margins.Top = 0.5;
        p.Margins.Bottom = 0.6;
        p.SetRowsToRepeatAtTop(headerRow, headerRow);
        p.Footer.Left.AddText($"{Company} · Confidential");
        p.Footer.Right.AddText("Page ");
        p.Footer.Right.AddText(XLHFPredefinedText.PageNumber);
        p.Footer.Right.AddText(" of ");
        p.Footer.Right.AddText(XLHFPredefinedText.NumberOfPages);
    }

    private static byte[] Save(XLWorkbook wb)
    {
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    private static string MonthName(int year, int month) =>
        new DateTime(year, month, 1).ToString("MMMM yyyy", Inv);

    private static string PeriodLabel(int year, int month, DateOnly end)
    {
        var start = new DateOnly(year, month, 1);
        return $"{MonthName(year, month)} ({start.ToString("d MMM", Inv)} – {end.ToString("d MMM yyyy", Inv)})";
    }

    private static string LeaveTaken(SummaryTotalsDto t) =>
        string.Join(", ", LeaveTypes.Where(lt => t.LeaveByType.GetValueOrDefault(lt) > 0)
            .Select(lt => $"{lt} {t.LeaveByType[lt].ToString("0.#", Inv)}"));

    private static string Notes(SummaryDayDto d)
    {
        var parts = new List<string>();
        if (d.HolidayName is { } h) parts.Add(h);
        if (d.LeaveType is { } lt)
            parts.Add(d.HalfDayPeriod is { } p ? $"{lt} leave ({p.ToString().ToLowerInvariant()})" : $"{lt} leave");
        if (d.MissedClockOut) parts.Add("Missed clock-out");
        if (!string.IsNullOrWhiteSpace(d.Remark)) parts.Add(d.Remark!);
        return string.Join(" · ", parts);
    }

    // Same wording as the app (attendanceDisplay.ts on the client).
    private static string StatusLabel(DayStatus s) => s switch
    {
        DayStatus.Present => "Present",
        DayStatus.Late => "Late",
        DayStatus.HalfDay => "Half day",
        DayStatus.OnLeave => "On leave",
        DayStatus.Absent => "Absent",
        DayStatus.InProgress => "Working",
        DayStatus.NotClockedIn => "Not in yet",
        DayStatus.Holiday => "Holiday",
        DayStatus.DayOff => "Day off",
        DayStatus.Upcoming => "Upcoming",
        _ => "No record",
    };

    private static (XLColor Fill, XLColor Ink) StatusColors(DayStatus s) => s switch
    {
        DayStatus.Present => (XLColor.FromHtml("#DCFCE7"), XLColor.FromHtml("#166534")),
        DayStatus.Late => (XLColor.FromHtml("#FEF3C7"), XLColor.FromHtml("#92400E")),
        DayStatus.HalfDay => (XLColor.FromHtml("#E0E7FF"), XLColor.FromHtml("#3730A3")),
        DayStatus.OnLeave => (XLColor.FromHtml("#F3E8FF"), XLColor.FromHtml("#6B21A8")),
        DayStatus.Absent => (XLColor.FromHtml("#FFE4E6"), XLColor.FromHtml("#9F1239")),
        DayStatus.InProgress => (XLColor.FromHtml("#E0F2FE"), XLColor.FromHtml("#075985")),
        _ => (XLColor.FromHtml("#F1F5F9"), Muted),
    };
}
