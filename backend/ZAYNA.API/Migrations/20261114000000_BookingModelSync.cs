using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZAYNA.API.Migrations
{
    /// <summary>
    /// Brings the database in line with ApplicationDbContext changes made in the "booking journey" commit (2af3625)
    /// that never received a migration:
    ///   * OMR amounts use 3 decimal places (Services.Price, Bookings.TotalPrice, Payments.Amount)
    ///   * Bookings.TotalAmount (a duplicate of TotalPrice) is no longer persisted
    ///   * Bookings.BookingNumber becomes nvarchar(450) with a unique index (SQL Server cannot index nvarchar(max))
    ///   * Database-level double-booking backstop: one live (Status &lt;&gt; Cancelled) booking per stylist, date, start time
    ///
    /// HAND-WRITTEN: generated without being able to run `dotnet ef` (no NuGet access in the authoring environment).
    /// Verify with `dotnet ef migrations add Check` -- it must produce an EMPTY migration; then remove it.
    ///
    /// BEFORE APPLYING to a database that already holds data, make sure there are no duplicate live slots:
    ///   SELECT StylistId, BookingDate, StartTime, COUNT(*) FROM Bookings
    ///   WHERE Status &lt;&gt; 4 GROUP BY StylistId, BookingDate, StartTime HAVING COUNT(*) &gt; 1;
    /// (Index creation fails, with no partial change, if any rows are returned.)
    /// </summary>
    public partial class BookingModelSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Keep the value if only TotalAmount held it, before the column is dropped.
            migrationBuilder.Sql("UPDATE [Bookings] SET [TotalPrice] = [TotalAmount] WHERE [TotalPrice] = 0 AND [TotalAmount] <> 0");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "Bookings");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Services",
                type: "decimal(18,3)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Payments",
                type: "decimal(18,3)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "Bookings",
                type: "decimal(18,3)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "BookingNumber",
                table: "Bookings",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingNumber",
                table: "Bookings",
                column: "BookingNumber",
                unique: true,
                filter: "[BookingNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_StylistId_BookingDate_StartTime",
                table: "Bookings",
                columns: new[] { "StylistId", "BookingDate", "StartTime" },
                unique: true,
                filter: "[Status] <> 4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_StylistId_BookingDate_StartTime",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BookingNumber",
                table: "Bookings");

            migrationBuilder.AlterColumn<string>(
                name: "BookingNumber",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldMaxLength: 450,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalPrice",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,3)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Payments",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,3)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Services",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,3)");

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "Bookings",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("UPDATE [Bookings] SET [TotalAmount] = [TotalPrice]");
        }
    }
}
