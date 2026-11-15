// ============================================
// ZAYNA.Infrastructure/Data/ApplicationDbContext.cs
// ============================================
using Core.Entities;
using Microsoft.EntityFrameworkCore;
using ZAYNA.Core.Entities;

namespace ZAYNA.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Salon> Salons { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<Stylist> Stylists { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<StylistService> StylistServices { get; set; }
    public DbSet<BranchWorkingHours> BranchWorkingHours { get; set; }
    public DbSet<LoyaltyPointsHistory> LoyaltyPointsHistory { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<StylistOffDay> StylistOffDays { get; set; }
    public DbSet<OTPVerification> OTPVerifications { get; set; }
    public DbSet<SocialAuthProvider> SocialAuthProviders { get; set; }
    public DbSet<PublicSalon> PublicSalons => Set<PublicSalon>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            // PhoneNumber and Email are both optional (Google users have no phone; OTP users may have no email)
            // but unique when present. EF/SQL Server emit a filtered unique index (WHERE col IS NOT NULL).
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(256);
        });

        // Customer
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithOne(u => u.Customer)
                .HasForeignKey<Customer>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Salon
        modelBuilder.Entity<Salon>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithOne(u => u.Salon)
                .HasForeignKey<Salon>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Branch
        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Salon)
                .WithMany(s => s.Branches)
                .HasForeignKey(e => e.SalonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BranchWorkingHours
        modelBuilder.Entity<BranchWorkingHours>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Branch)
                .WithMany(b => b.WorkingHours)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Stylist
        modelBuilder.Entity<Stylist>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithOne(u => u.Stylist)
                .HasForeignKey<Stylist>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Salon)
                .WithMany(s => s.Stylists)
                .HasForeignKey(e => e.SalonId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Service
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Salon)
                .WithMany(s => s.Services)
                .HasForeignKey(e => e.SalonId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.Property(e => e.Price).HasColumnType("decimal(18,3)"); // OMR has 3 decimal places
        });

        // StylistService (Many-to-Many)
        modelBuilder.Entity<StylistService>(entity =>
        {
            entity.HasKey(e => new { e.StylistId, e.ServiceId });
            
            entity.HasOne(e => e.Stylist)
                .WithMany(s => s.StylistServices)
                .HasForeignKey(e => e.StylistId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Service)
                .WithMany(s => s.StylistServices)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Booking
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.Customer)
                .WithMany(c => c.Bookings)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Salon)
                .WithMany()
                .HasForeignKey(e => e.SalonId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Branch)
                .WithMany(b => b.Bookings)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Stylist)
                .WithMany(s => s.Bookings)
                .HasForeignKey(e => e.StylistId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Service)
                .WithMany(s => s.Bookings)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,3)");
            entity.HasIndex(e => e.BookingDate);

            // TotalAmount is only a convenience wrapper over TotalPrice. Persisting it created a second, 2-decimal
            // column whose value could overwrite the exact TotalPrice when a booking was read back.
            entity.Ignore(e => e.TotalAmount);

            // Booking numbers are unique when present (older rows may have none).
            entity.HasIndex(e => e.BookingNumber).IsUnique();

            // Database-level backstop against double booking: one live booking per stylist, date and start time.
            // (Status 4 = Cancelled, which frees the slot.) Overlaps of different lengths are prevented by the
            // per-stylist lock in BookingService; this index guarantees it even if that lock were ever bypassed.
            entity.HasIndex(e => new { e.StylistId, e.BookingDate, e.StartTime })
                  .IsUnique()
                  .HasFilter("[Status] <> 4");
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Booking)
                .WithOne(b => b.Payment)
                .HasForeignKey<Payment>(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.Property(e => e.Amount).HasColumnType("decimal(18,3)");
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Booking)
                .WithMany(b => b.Notifications)
                .HasForeignKey(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Review
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Customer)
                .WithMany(c => c.Reviews)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Salon)
                .WithMany(s => s.Reviews)
                .HasForeignKey(e => e.SalonId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.Booking)
                .WithMany()
                .HasForeignKey(e => e.BookingId)
                .OnDelete(DeleteBehavior.SetNull);

            // One review per booking, enforced by the database (the controller check alone is racy).
            entity.HasIndex(e => e.BookingId).IsUnique();
        });

        // LoyaltyPointsHistory
        modelBuilder.Entity<LoyaltyPointsHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Customer)
                .WithMany(c => c.LoyaltyPointsHistory)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // StylistOffDay
        modelBuilder.Entity<StylistOffDay>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Stylist)
                .WithMany(s => s.OffDays)
                .HasForeignKey(e => e.StylistId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => new { e.StylistId, e.OffDate });
        });

        // OTPVerification
        modelBuilder.Entity<OTPVerification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PhoneNumber, e.Code });
        });

        // SocialAuthProvider
        modelBuilder.Entity<SocialAuthProvider>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(u => u.SocialAuthProviders)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => new { e.Provider, e.ProviderUserId }).IsUnique();
        });
    }
}