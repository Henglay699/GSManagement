using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GSManagement.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AttendanceRedesign : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Keep at most one record per employee per day (lowest Id wins)
            // so the unique index below can be created.
            migrationBuilder.Sql(@"
WITH d AS (SELECT Id, ROW_NUMBER() OVER (PARTITION BY UserId, [Date] ORDER BY Id) AS rn FROM Attendances)
DELETE FROM d WHERE rn > 1;");

            migrationBuilder.Sql("UPDATE Attendances SET Remark = LEFT(Remark, 500) WHERE LEN(Remark) > 500;");

            migrationBuilder.DropTable(
                name: "OvertimeRecords");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_UserId",
                table: "Attendances");

            migrationBuilder.AlterColumn<string>(
                name: "Remark",
                table: "Attendances",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EarlyLeaveMinutes",
                table: "Attendances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LateMinutes",
                table: "Attendances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "MissedClockOut",
                table: "Attendances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // New status names.
            migrationBuilder.Sql(@"
UPDATE Attendances SET Status = 'Present' WHERE Status = 'OnTime';
UPDATE Attendances SET Status = 'OnLeave' WHERE Status = 'Leave';
UPDATE Attendances SET Status = 'HalfDay' WHERE Status = 'HalfDayLeave';");

            // Remarks the old code wrote automatically now have their own columns.
            migrationBuilder.Sql(@"
UPDATE Attendances SET Remark = NULL
WHERE Remark IN ('Clocked in on time', 'Missed clock-out', 'No clock-in (marked automatically)', 'Late', 'Arrived On Time', 'On Leave')
   OR Remark LIKE 'Late by % minutes'
   OR Remark LIKE 'Afternoon check-in % at %';
UPDATE Attendances SET Remark = REPLACE(Remark, '; Missed clock-out', '') WHERE Remark LIKE '%; Missed clock-out';");

            // Backfill late / left-early / overtime / missed clock-out from the stored
            // times, using the record's shift, else the default shift, else 08:00-17:00.
            migrationBuilder.Sql(@"
WITH x AS (
    SELECT a.*,
        COALESCE(s.StartTime, ds.StartTime, CAST('08:00' AS time)) AS ShiftStart,
        COALESCE(s.EndTime,   ds.EndTime,   CAST('17:00' AS time)) AS ShiftEnd,
        COALESCE(s.GraceMinutes, ds.GraceMinutes, 15)             AS Grace
    FROM Attendances a
    LEFT JOIN Shifts s ON s.Id = a.ShiftId
    OUTER APPLY (SELECT TOP 1 StartTime, EndTime, GraceMinutes FROM Shifts WHERE IsDefault = 1) ds
)
UPDATE x SET
    LateMinutes = CASE
        WHEN CheckInTime IS NOT NULL AND Status IN ('Present', 'Late')
             AND CheckInTime > DATEADD(MINUTE, Grace, ShiftStart)
        THEN DATEDIFF(MINUTE, ShiftStart, CheckInTime) ELSE 0 END,
    EarlyLeaveMinutes = CASE
        WHEN CheckOutTime IS NOT NULL AND Status IN ('Present', 'Late') AND CheckOutTime < ShiftEnd
        THEN DATEDIFF(MINUTE, CheckOutTime, ShiftEnd) ELSE 0 END,
    OvertimeMinutes = CASE
        WHEN CheckOutTime IS NOT NULL AND CheckOutTime > ShiftEnd
        THEN DATEDIFF(MINUTE, ShiftEnd, CheckOutTime) ELSE OvertimeMinutes END,
    MissedClockOut = CASE
        WHEN CheckInTime IS NOT NULL AND CheckOutTime IS NULL AND [Date] < CAST(GETDATE() AS date)
        THEN 1 ELSE 0 END;

UPDATE Attendances SET Status = CASE WHEN LateMinutes > 0 THEN 'Late' ELSE 'Present' END
WHERE Status IN ('Present', 'Late') AND CheckInTime IS NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_UserId_Date",
                table: "Attendances",
                columns: new[] { "UserId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE Attendances SET Status = 'OnTime' WHERE Status = 'Present';
UPDATE Attendances SET Status = 'Leave' WHERE Status = 'OnLeave';
UPDATE Attendances SET Status = 'HalfDayLeave' WHERE Status = 'HalfDay';");
            migrationBuilder.DropIndex(
                name: "IX_Attendances_UserId_Date",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveMinutes",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "LateMinutes",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "MissedClockOut",
                table: "Attendances");

            migrationBuilder.AlterColumn<string>(
                name: "Remark",
                table: "Attendances",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "OvertimeRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AttendanceId = table.Column<int>(type: "int", nullable: false),
                    OvertimeMinutes = table.Column<double>(type: "float", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OvertimeRecords_Attendances_AttendanceId",
                        column: x => x.AttendanceId,
                        principalTable: "Attendances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_UserId",
                table: "Attendances",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeRecords_AttendanceId",
                table: "OvertimeRecords",
                column: "AttendanceId",
                unique: true);
        }
    }
}
