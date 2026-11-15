using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZAYNA.API.Migrations
{
    /// <summary>
    /// Makes "one review per booking" a database rule: Reviews.BookingId gets a UNIQUE index (NULLs excluded).
    ///
    /// HAND-WRITTEN (no NuGet access when authored). Verify with `dotnet ef migrations add Check`: it must produce an
    /// EMPTY migration; then remove it.
    ///
    /// BEFORE APPLYING to a database that already holds data, make sure no booking has two reviews:
    ///   SELECT BookingId, COUNT(*) FROM Reviews WHERE BookingId IS NOT NULL GROUP BY BookingId HAVING COUNT(*) &gt; 1;
    /// (Index creation fails, with no partial change, if any rows are returned.)
    /// </summary>
    public partial class ReviewIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews",
                column: "BookingId",
                unique: true,
                filter: "[BookingId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId",
                table: "Reviews",
                column: "BookingId");
        }
    }
}
