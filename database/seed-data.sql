-- ============================================
-- Database/seed-data.sql
-- ZAYNA Booking System - Seed Data
-- ============================================

USE ZaynaDB;
GO

-- Insert Admin User
INSERT INTO Users (Id, PhoneNumber, Email, Role, FullName, FullNameAr, IsPhoneVerified, IsActive, CreatedAt)
VALUES 
(NEWID(), '+96899999999', 'admin@zayna.om', 1, 'Admin User', 'مدير النظام', 1, 1, GETUTCDATE());

-- Insert Sample Salon Owner
DECLARE @SalonOwnerId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Users (Id, PhoneNumber, Email, Role, FullName, FullNameAr, IsPhoneVerified, IsActive, CreatedAt)
VALUES 
(@SalonOwnerId, '+96891111111', 'salon1@zayna.om', 2, 'Ahmed Al-Balushi', 'أحمد البلوشي', 1, 1, GETUTCDATE());

-- Insert Sample Salon
DECLARE @SalonId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Salons (Id, UserId, Name, NameAr, Description, DescriptionAr, PhoneNumber, Email, IsActive, CreatedAt)
VALUES 
(@SalonId, @SalonOwnerId, 'Elite Salon & Spa', 'صالون إيليت والسبا', 
'Premium beauty and grooming services in Muscat', 'خدمات تجميل وعناية فاخرة في مسقط',
'+96824567890', 'info@elitesalon.om', 1, GETUTCDATE());

-- Insert Branch
DECLARE @BranchId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Branches (Id, SalonId, Name, NameAr, Address, AddressAr, Latitude, Longitude, PhoneNumber, IsActive, CreatedAt)
VALUES 
(@BranchId, @SalonId, 'Elite Salon - Qurum', 'إيليت صالون - القرم',
'Qurum City Centre, Muscat', 'مركز مدينة القرم، مسقط',
23.5880, 58.3829, '+96824567890', 1, GETUTCDATE());

-- Insert Working Hours for Branch (Monday to Saturday, 9 AM - 9 PM)
INSERT INTO BranchWorkingHours (Id, BranchId, DayOfWeek, OpenTime, CloseTime, IsClosed)
VALUES 
(NEWID(), @BranchId, 1, '09:00:00', '21:00:00', 0),
(NEWID(), @BranchId, 2, '09:00:00', '21:00:00', 0),
(NEWID(), @BranchId, 3, '09:00:00', '21:00:00', 0),
(NEWID(), @BranchId, 4, '09:00:00', '21:00:00', 0),
(NEWID(), @BranchId, 5, '09:00:00', '21:00:00', 0),
(NEWID(), @BranchId, 6, '09:00:00', '21:00:00', 0),
(NEWID(), @BranchId, 0, '00:00:00', '00:00:00', 1); -- Sunday closed

-- Insert Sample Stylist User
DECLARE @StylistUserId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Users (Id, PhoneNumber, Email, Role, FullName, FullNameAr, IsPhoneVerified, IsActive, CreatedAt)
VALUES 
(@StylistUserId, '+96892222222', 'stylist1@zayna.om', 3, 'Mohammed Al-Hinai', 'محمد الحناعي', 1, 1, GETUTCDATE());

-- Insert Stylist
DECLARE @StylistId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Stylists (Id, UserId, SalonId, BranchId, Bio, BioAr, Specialization, SpecializationAr, YearsOfExperience, IsActive, CreatedAt)
VALUES 
(@StylistId, @StylistUserId, @SalonId, @BranchId,
'Expert barber with 8 years of experience', 'حلاق خبير مع 8 سنوات من الخبرة',
'Hair Styling & Beard Grooming', 'تصفيف الشعر وتهذيب اللحية',
8, 1, GETUTCDATE());

-- Insert Stylist Working Hours
INSERT INTO StylistWorkingHours (Id, StylistId, DayOfWeek, StartTime, EndTime, IsAvailable)
VALUES 
(NEWID(), @StylistId, 1, '09:00:00', '18:00:00', 1),
(NEWID(), @StylistId, 2, '09:00:00', '18:00:00', 1),
(NEWID(), @StylistId, 3, '09:00:00', '18:00:00', 1),
(NEWID(), @StylistId, 4, '09:00:00', '18:00:00', 1),
(NEWID(), @StylistId, 6, '10:00:00', '16:00:00', 1);

-- Insert Services
DECLARE @Service1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Service2Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Service3Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO Services (Id, SalonId, Name, NameAr, Description, DescriptionAr, Price, DurationMinutes, Category, CategoryAr, IsActive, CreatedAt)
VALUES 
(@Service1Id, @SalonId, 'Classic Haircut', 'قص شعر كلاسيكي', 'Professional haircut with styling', 'قصة شعر احترافية مع تصفيف', 5.00, 30, 'Hair', 'شعر', 1, GETUTCDATE()),
(@Service2Id, @SalonId, 'Beard Trimming', 'تهذيب اللحية', 'Precision beard trim and shaping', 'تهذيب وتشكيل اللحية بدقة', 3.00, 20, 'Beard', 'لحية', 1, GETUTCDATE()),
(@Service3Id, @SalonId, 'Full Package', 'باقة كاملة', 'Haircut + Beard trim + Face massage', 'قص شعر + تهذيب لحية + مساج للوجه', 10.00, 60, 'Premium', 'مميزة', 1, GETUTCDATE());

-- Link Services to Stylist
INSERT INTO StylistServices (StylistId, ServiceId)
VALUES 
(@StylistId, @Service1Id),
(@StylistId, @Service2Id),
(@StylistId, @Service3Id);

-- Insert Sample Customer
DECLARE @CustomerUserId UNIQUEIDENTIFIER = NEWID();
INSERT INTO Users (Id, PhoneNumber, Email, Role, FullName, FullNameAr, IsPhoneVerified, IsActive, CreatedAt)
VALUES 
(@CustomerUserId, '+96893333333', 'customer1@zayna.om', 4, 'Ali Al-Lawati', 'علي اللواتي', 1, 1, GETUTCDATE());

INSERT INTO Customers (Id, UserId, PreferredLanguage, SmsNotifications, EmailNotifications, CreatedAt)
VALUES 
(NEWID(), @CustomerUserId, 'en', 1, 1, GETUTCDATE());

PRINT 'Database seeded successfully!';
GO