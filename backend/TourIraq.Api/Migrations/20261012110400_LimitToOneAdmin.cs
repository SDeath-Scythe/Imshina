using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourIraq.Api.Migrations
{
    /// <inheritdoc />
    public partial class LimitToOneAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role",
                unique: true,
                filter: "\"Role\" = 'Admin'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Role",
                table: "Users");
        }
    }
}
