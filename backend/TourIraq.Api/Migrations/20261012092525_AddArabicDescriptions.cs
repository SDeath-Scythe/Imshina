using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourIraq.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddArabicDescriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionAr",
                table: "Places",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShortDescriptionAr",
                table: "Places",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionAr",
                table: "Governorates",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionAr",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "ShortDescriptionAr",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "DescriptionAr",
                table: "Governorates");
        }
    }
}
