using ZAYNA.Core.Enums;

namespace ZAYNA.Infrastructure.Data
{
    public static class DbInitializer
    {
        /// <summary>
        /// Applies EF Core migrations, bootstraps the admin account, and (development only) seeds demo data.
        /// </summary>
        /// <param name="adminEmail">
        /// Email of the platform administrator (config key Admin:Email). The admin signs in with Google using
        /// this address. No password and no hardcoded credentials are ever created.
        /// </param>
        /// <param name="seedDemoData">Only true in the Development environment.</param>
        public static async Task Initialize(ApplicationDbContext context, string? adminEmail, bool seedDemoData)
        {
            // Never EnsureCreated: it bypasses migrations and makes later schema updates impossible.
            await context.Database.MigrateAsync();

            await EnsureAdminAsync(context, adminEmail);

            if (seedDemoData)
            {
                await SeedDemoSalonAsync(context);
                await SeedDemoStaffAsync(context);
            }
        }

        private static async Task EnsureAdminAsync(ApplicationDbContext context, string? adminEmail)
        {
            if (string.IsNullOrWhiteSpace(adminEmail))
                return;

            var email = adminEmail.Trim().ToLowerInvariant();
            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                context.Users.Add(new User
                {
                    Email = email,
                    FullName = "Administrator",
                    Role = UserRole.Admin,
                    IsActive = true,
                    IsEmailVerified = true, // required so the Google sign-in can link to this account
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
            else if (user.Role != UserRole.Admin || !user.IsEmailVerified)
            {
                // Operator-controlled configuration is the source of truth for who the admin is.
                user.Role = UserRole.Admin;
                user.IsEmailVerified = true;
                user.PasswordHash = null; // admins sign in with Google only; drop any password set before promotion
                user.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Development only. Gives the demo salon two stylists who perform all its services, so the booking flow can be
        /// exercised end to end. Safe to run repeatedly (does nothing once the salon has stylists).
        /// </summary>
        private static async Task SeedDemoStaffAsync(ApplicationDbContext context)
        {
            var salon = await context.Salons.FirstOrDefaultAsync(s => s.ContactEmail == "salon@zayna.om");
            if (salon == null || await context.Stylists.AnyAsync(s => s.SalonId == salon.Id))
                return;

            var branch = await context.Branches.Include(b => b.WorkingHours)
                .FirstOrDefaultAsync(b => b.SalonId == salon.Id && b.IsActive);
            var services = await context.Services.Where(s => s.SalonId == salon.Id && s.IsActive).ToListAsync();
            if (branch == null || services.Count == 0)
                return;

            if (!branch.WorkingHours.Any())
            {
                for (int day = 0; day <= 6; day++)
                {
                    branch.WorkingHours.Add(new BranchWorkingHours
                    {
                        DayOfWeek = (System.DayOfWeek)day,
                        OpenTime = TimeSpan.FromHours(9),
                        CloseTime = TimeSpan.FromHours(21),
                        IsClosed = day == 5 // Friday closed
                    });
                }
            }

            var staff = new[]
            {
                (Name: "Ahmed Al-Said", NameAr: "أحمد السعيد", Phone: "+96890000001", Years: 5),
                (Name: "Mariam Al-Balushi", NameAr: "مريم البلوشي", Phone: "+96890000002", Years: 8)
            };

            foreach (var member in staff)
            {
                var user = new User
                {
                    PhoneNumber = member.Phone,
                    FullName = member.Name,
                    Role = UserRole.Stylist,
                    IsActive = true,
                    IsPhoneVerified = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Users.Add(user);

                var stylist = new Stylist
                {
                    User = user,
                    SalonId = salon.Id,
                    BranchId = branch.Id,
                    FullName = member.Name,
                    FullNameAr = member.NameAr,
                    YearsOfExperience = member.Years,
                    IsActive = true
                };
                foreach (var service in services)
                    stylist.StylistServices.Add(new StylistService { Service = service });

                context.Stylists.Add(stylist);
            }

            await context.SaveChangesAsync();
        }

        private static async Task SeedDemoSalonAsync(ApplicationDbContext context)
        {
            if (await context.Salons.AnyAsync())
                return;

            var salonUser = new User
            {
                PhoneNumber = "+96887654321",
                Email = "salon@zayna.om",
                FullName = "Demo Salon Owner",
                Role = UserRole.Salon,
                IsActive = true,
                IsPhoneVerified = true,
                IsEmailVerified = true,
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

            var branch = new Branch
            {
                SalonId = salon.Id,
                BranchName = "Muscat Branch",
                BranchNameAr = "فرع مسقط",
                AddressLine = "Al Khuwair, Muscat",
                City = "Muscat",
                Region = "Muscat Governorate",
                Latitude = 23.5880,
                Longitude = 58.3829,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Branches.Add(branch);
            await context.SaveChangesAsync();

            for (int day = 0; day <= 6; day++)
            {
                context.BranchWorkingHours.Add(new BranchWorkingHours
                {
                    BranchId = branch.Id,
                    DayOfWeek = (System.DayOfWeek)day,
                    OpenTime = TimeSpan.FromHours(9),
                    CloseTime = TimeSpan.FromHours(21),
                    IsClosed = day == 5 // Friday closed
                });
            }
            await context.SaveChangesAsync();

            context.Services.AddRange(
                new Service { SalonId = salon.Id, ServiceName = "Haircut", ServiceNameAr = "قص شعر", Description = "Professional haircut service", DescriptionAr = "خدمة قص شعر احترافية", DurationMinutes = 30, Price = 10.0m, Category = "Haircut", IsActive = true },
                new Service { SalonId = salon.Id, ServiceName = "Hair Coloring", ServiceNameAr = "صبغ الشعر", Description = "Premium hair coloring", DescriptionAr = "صبغ شعر فاخر", DurationMinutes = 90, Price = 25.0m, Category = "Coloring", IsActive = true },
                new Service { SalonId = salon.Id, ServiceName = "Facial Treatment", ServiceNameAr = "علاج للوجه", Description = "Deep cleansing facial", DescriptionAr = "تنظيف عميق للوجه", DurationMinutes = 60, Price = 20.0m, Category = "Facial", IsActive = true });
            await context.SaveChangesAsync();
        }
    }
}
