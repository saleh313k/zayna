// ZAYNA.Infrastructure/Data/DbInitializer.cs
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using ZAYNA.Core.Entities;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Core.Enums;

namespace ZAYNA.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(ApplicationDbContext context)
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Check if admin user exists
            if (context.Users.Any(u => u.Role == UserRole.Admin))
            {
                return; // DB has been seeded
            }

            // Create admin user
            var adminUser = new User
            {
                PhoneNumber = "+96812345678",
                Email = "admin@zayna.om",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                IsActive = true,
                IsPhoneVerified = true,
                IsEmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            // Seed sample salon
            var salonUser = new User
            {
                PhoneNumber = "+96887654321",
                Email = "salon@zayna.om",
                Role = UserRole.Salon,
                IsActive = true,
                IsPhoneVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(salonUser);
            await context.SaveChangesAsync();

            var salon = new Salon
            {
                UserId = salonUser.Id,
                SalonName = "Luxury Beauty Salon",
                SalonNameAr = "صالون الجمال الفاخر",
                AboutText = "Premium beauty services in Muscat",
                AboutTextAr = "خدمات تجميل فاخرة في مسقط",
                ContactPhone = "+96887654321",
                ContactEmail = "salon@zayna.om",
                IsVerified = true,
                Rating = 4.8m,
                TotalReviews = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Salons.Add(salon);
            await context.SaveChangesAsync();

            // Seed branch
            var branch = new Branch
            {
                SalonId = salon.Id,
                BranchName = "Muscat Branch",
                BranchNameAr = "فرع مسقط",
                AddressLine = "Al Khuwair, Muscat",
                City = "Muscat",
                Region = "Muscat Governorate",
                Latitude = (double)23.5880m,
                Longitude =(double) 58.3829m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Branches.Add(branch);
            await context.SaveChangesAsync();

            // Seed working hours
            var workingHours = new List<BranchWorkingHours>();
            for (int day = 0; day <= 6; day++)
            {
                if (day == 5) // Friday closed
                {
                    workingHours.Add(new BranchWorkingHours
                    {
                        BranchId = branch.Id,
                        DayOfWeek = (System.DayOfWeek)day,
                        OpenTime = TimeSpan.FromHours(9),
                        CloseTime = TimeSpan.FromHours(21),
                        IsClosed = true
                    });
                }
                else
                {
                    workingHours.Add(new BranchWorkingHours
                    {
                        BranchId = branch.Id,
                        DayOfWeek = (System.DayOfWeek)day,
                        OpenTime = TimeSpan.FromHours(9),
                        CloseTime = TimeSpan.FromHours(21),
                        IsClosed = false
                    });
                }
            }

            context.BranchWorkingHours.AddRange(workingHours);
            await context.SaveChangesAsync();

            // Seed services
            var services = new List<Service>
            {
                new Service
                {
                    SalonId = salon.Id,
                    ServiceName = "Haircut",
                    ServiceNameAr = "قص شعر",
                    Description = "Professional haircut service",
                    DescriptionAr = "خدمة قص شعر احترافية",
                    DurationMinutes = 30,
                    Price = 10.0m,
                    Category = "Haircut",
                    IsActive = true
                },
                new Service
                {
                    SalonId = salon.Id,
                    ServiceName = "Hair Coloring",
                    ServiceNameAr = "صبغ الشعر",
                    Description = "Premium hair coloring",
                    DescriptionAr = "صبغ شعر فاخر",
                    DurationMinutes = 90,
                    Price = 25.0m,
                    Category = "Coloring",
                    IsActive = true
                },
                new Service
                {
                    SalonId = salon.Id,
                    ServiceName = "Facial Treatment",
                    ServiceNameAr = "علاج للوجه",
                    Description = "Deep cleansing facial",
                    DescriptionAr = "تنظيف عميق للوجه",
                    DurationMinutes = 60,
                    Price = 20.0m,
                    Category = "Facial",
                    IsActive = true
                }
            };

            context.Services.AddRange(services);
            await context.SaveChangesAsync();
        }
    }
}