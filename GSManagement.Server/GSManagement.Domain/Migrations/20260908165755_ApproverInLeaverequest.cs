using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GSManagement.Domain.Migrations
{
    /// <inheritdoc />
    public partial class ApproverInLeaverequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_User_UserId",
                table: "LeaveRequests");

            migrationBuilder.AddColumn<int>(
                name: "ApproverId",
                table: "LeaveRequests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_ApproverId",
                table: "LeaveRequests",
                column: "ApproverId");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_User_ApproverId",
                table: "LeaveRequests",
                column: "ApproverId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_User_UserId",
                table: "LeaveRequests",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_User_ApproverId",
                table: "LeaveRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_User_UserId",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_ApproverId",
                table: "LeaveRequests");

            migrationBuilder.DropColumn(
                name: "ApproverId",
                table: "LeaveRequests");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_User_UserId",
                table: "LeaveRequests",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
