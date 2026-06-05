using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HotelOS.Housekeeping.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cleanliness_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    duration_mins = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cleanliness_logs", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cleanliness_logs_room_id",
                table: "cleanliness_logs",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_cleanliness_logs_staff_id",
                table: "cleanliness_logs",
                column: "staff_id");

            migrationBuilder.CreateIndex(
                name: "IX_cleanliness_logs_status",
                table: "cleanliness_logs",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cleanliness_logs");
        }
    }
}
