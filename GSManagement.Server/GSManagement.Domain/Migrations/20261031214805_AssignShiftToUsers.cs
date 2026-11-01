using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GSManagement.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AssignShiftToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShiftId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_ShiftId",
                table: "Users",
                column: "ShiftId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Shifts_ShiftId",
                table: "Users",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Shifts_ShiftId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_ShiftId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShiftId",
                table: "Users");
        }
    }
}
