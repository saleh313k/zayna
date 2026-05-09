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
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PhoneNumber).HasMaxLength(20).IsRequired();
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
            
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
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
            
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.BookingDate);
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Booking)
                .WithOne(b => b.Payment)
                .HasForeignKey<Payment>(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
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