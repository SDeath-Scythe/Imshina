using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourIraq.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddArabicHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DetailsAr",
                table: "HistoricalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SummaryAr",
                table: "HistoricalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TitleAr",
                table: "HistoricalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DetailsAr",
                table: "HistoricalEvents");

            migrationBuilder.DropColumn(
                name: "SummaryAr",
                table: "HistoricalEvents");

            migrationBuilder.DropColumn(
                name: "TitleAr",
                table: "HistoricalEvents");
        }
    }
}
