using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourIraq.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddArabicPlaceGuidance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CulturalTipsAr",
                table: "Places",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SafetyNotesAr",
                table: "Places",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CulturalTipsAr",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "SafetyNotesAr",
                table: "Places");
        }
    }
}
