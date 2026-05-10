<<<<<<< HEAD
-- ============================================
-- Database/schema.sql
-- ZAYNA Booking System - Database Schema
-- ============================================

-- Create Database
CREATE DATABASE ZaynaDB;
GO

USE ZaynaDB;
GO

-- Users Table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PhoneNumber NVARCHAR(20) NOT NULL UNIQUE,
    Email NVARCHAR(255),
    PasswordHash NVARCHAR(MAX),
    Role INT NOT NULL, -- 1=Admin, 2=Salon, 3=Stylist, 4=Customer
    FullName NVARCHAR(100) NOT NULL,
    FullNameAr NVARCHAR(100),
    AvatarUrl NVARCHAR(500),
    AuthProvider INT NOT NULL DEFAULT 1, -- 1=Phone, 2=Google, 3=Apple, 4=Facebook, 5=Twitter
    ExternalAuthId NVARCHAR(255),
    IsPhoneVerified BIT DEFAULT 0,
    IsEmailVerified BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2
);

CREATE INDEX IX_Users_PhoneNumber ON Users(PhoneNumber);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);

-- Salons Table
CREATE TABLE Salons (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Name NVARCHAR(200) NOT NULL,
    NameAr NVARCHAR(200),
    Description NVARCHAR(MAX),
    DescriptionAr NVARCHAR(MAX),
    LogoUrl NVARCHAR(500),
    PhoneNumber NVARCHAR(20),
    Email NVARCHAR(255),
    Website NVARCHAR(255),
    FacebookUrl NVARCHAR(255),
    InstagramUrl NVARCHAR(255),
    TwitterUrl NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Branches Table
CREATE TABLE Branches (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id) ON DELETE CASCADE,
    Name NVARCHAR(200) NOT NULL,
    NameAr NVARCHAR(200),
    Address NVARCHAR(500),
    AddressAr NVARCHAR(500),
    Latitude FLOAT,
    Longitude FLOAT,
    PhoneNumber NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Branch Working Hours
CREATE TABLE BranchWorkingHours (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BranchId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Branches(Id) ON DELETE CASCADE,
    DayOfWeek INT NOT NULL, -- 0=Sunday, 6=Saturday
    OpenTime TIME NOT NULL,
    CloseTime TIME NOT NULL,
    IsClosed BIT DEFAULT 0
);

-- Stylists Table
CREATE TABLE Stylists (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id),
    BranchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Branches(Id),
    Bio NVARCHAR(MAX),
    BioAr NVARCHAR(MAX),
    Specialization NVARCHAR(255),
    SpecializationAr NVARCHAR(255),
    YearsOfExperience INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Stylist Working Hours
CREATE TABLE StylistWorkingHours (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StylistId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Stylists(Id) ON DELETE CASCADE,
    DayOfWeek INT NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsAvailable BIT DEFAULT 1
);

-- Services Table
CREATE TABLE Services (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id) ON DELETE CASCADE,
    Name NVARCHAR(255) NOT NULL,
    NameAr NVARCHAR(255),
    Description NVARCHAR(MAX),
    DescriptionAr NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    DurationMinutes INT NOT NULL,
    Category NVARCHAR(100),
    CategoryAr NVARCHAR(100),
    ImageUrl NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Stylist Services (Many-to-Many)
CREATE TABLE StylistServices (
    StylistId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Stylists(Id) ON DELETE CASCADE,
    ServiceId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Services(Id),
    PRIMARY KEY (StylistId, ServiceId)
);

-- Customers Table
CREATE TABLE Customers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    DateOfBirth DATE,
    Gender NVARCHAR(20),
    PreferredLanguage NVARCHAR(10) DEFAULT 'en',
    SmsNotifications BIT DEFAULT 1,
    EmailNotifications BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Bookings Table
CREATE TABLE Bookings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CustomerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id),
    BranchId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Branches(Id),
    StylistId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Stylists(Id),
    ServiceId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Services(Id),
    BookingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Status INT NOT NULL DEFAULT 1, -- 1=Pending, 2=Confirmed, 3=Completed, 4=Cancelled, 5=NoShow
    TotalPrice DECIMAL(18,2) NOT NULL,
    Notes NVARCHAR(MAX),
    ReminderSent BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CancelledAt DATETIME2,
    CancellationReason NVARCHAR(MAX)
);

CREATE INDEX IX_Bookings_Customer ON Bookings(CustomerId);
CREATE INDEX IX_Bookings_Date ON Bookings(BookingDate);
CREATE INDEX IX_Bookings_Status ON Bookings(Status);

-- Payments Table
CREATE TABLE Payments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BookingId UNIQUEIDENTIFIER NOT NULL UNIQUE FOREIGN KEY REFERENCES Bookings(Id),
    Method INT NOT NULL, -- 1=Cash, 2=Card, 3=Online
    Status INT NOT NULL DEFAULT 1, -- 1=Pending, 2=Paid, 3=Failed, 4=Refunded
    Amount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) DEFAULT 'OMR',
    TransactionId NVARCHAR(255),
    PaymentGatewayResponse NVARCHAR(MAX),
    PaidAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Loyalty Points Table
CREATE TABLE LoyaltyPoints (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CustomerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Customers(Id),
    SalonId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Salons(Id),
    Points INT NOT NULL,
    Source NVARCHAR(100), -- 'Booking', 'Referral', 'Promotion'
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2
);

-- OTP Codes Table
CREATE TABLE OtpCodes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PhoneNumber NVARCHAR(20) NOT NULL,
    Code NVARCHAR(10) NOT NULL,
    Purpose INT NOT NULL, -- 1=Registration, 2=Login, 3=PhoneVerification, 4=PasswordReset
    IsUsed BIT DEFAULT 0,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_OtpCodes_Phone_Code ON OtpCodes(PhoneNumber, Code, Purpose);
=======
-- ============================================
-- Database/schema.sql
-- ZAYNA Booking System - Database Schema
-- ============================================

-- Create Database
CREATE DATABASE ZaynaDB;
GO

USE ZaynaDB;
GO

-- Users Table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PhoneNumber NVARCHAR(20) NOT NULL UNIQUE,
    Email NVARCHAR(255),
    PasswordHash NVARCHAR(MAX),
    Role INT NOT NULL, -- 1=Admin, 2=Salon, 3=Stylist, 4=Customer
    FullName NVARCHAR(100) NOT NULL,
    FullNameAr NVARCHAR(100),
    AvatarUrl NVARCHAR(500),
    AuthProvider INT NOT NULL DEFAULT 1, -- 1=Phone, 2=Google, 3=Apple, 4=Facebook, 5=Twitter
    ExternalAuthId NVARCHAR(255),
    IsPhoneVerified BIT DEFAULT 0,
    IsEmailVerified BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2
);

CREATE INDEX IX_Users_PhoneNumber ON Users(PhoneNumber);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(Role);

-- Salons Table
CREATE TABLE Salons (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Name NVARCHAR(200) NOT NULL,
    NameAr NVARCHAR(200),
    Description NVARCHAR(MAX),
    DescriptionAr NVARCHAR(MAX),
    LogoUrl NVARCHAR(500),
    PhoneNumber NVARCHAR(20),
    Email NVARCHAR(255),
    Website NVARCHAR(255),
    FacebookUrl NVARCHAR(255),
    InstagramUrl NVARCHAR(255),
    TwitterUrl NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Branches Table
CREATE TABLE Branches (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id) ON DELETE CASCADE,
    Name NVARCHAR(200) NOT NULL,
    NameAr NVARCHAR(200),
    Address NVARCHAR(500),
    AddressAr NVARCHAR(500),
    Latitude FLOAT,
    Longitude FLOAT,
    PhoneNumber NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Branch Working Hours
CREATE TABLE BranchWorkingHours (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BranchId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Branches(Id) ON DELETE CASCADE,
    DayOfWeek INT NOT NULL, -- 0=Sunday, 6=Saturday
    OpenTime TIME NOT NULL,
    CloseTime TIME NOT NULL,
    IsClosed BIT DEFAULT 0
);

-- Stylists Table
CREATE TABLE Stylists (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id),
    BranchId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Branches(Id),
    Bio NVARCHAR(MAX),
    BioAr NVARCHAR(MAX),
    Specialization NVARCHAR(255),
    SpecializationAr NVARCHAR(255),
    YearsOfExperience INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Stylist Working Hours
CREATE TABLE StylistWorkingHours (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StylistId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Stylists(Id) ON DELETE CASCADE,
    DayOfWeek INT NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsAvailable BIT DEFAULT 1
);

-- Services Table
CREATE TABLE Services (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id) ON DELETE CASCADE,
    Name NVARCHAR(255) NOT NULL,
    NameAr NVARCHAR(255),
    Description NVARCHAR(MAX),
    DescriptionAr NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    DurationMinutes INT NOT NULL,
    Category NVARCHAR(100),
    CategoryAr NVARCHAR(100),
    ImageUrl NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Stylist Services (Many-to-Many)
CREATE TABLE StylistServices (
    StylistId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Stylists(Id) ON DELETE CASCADE,
    ServiceId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Services(Id),
    PRIMARY KEY (StylistId, ServiceId)
);

-- Customers Table
CREATE TABLE Customers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    DateOfBirth DATE,
    Gender NVARCHAR(20),
    PreferredLanguage NVARCHAR(10) DEFAULT 'en',
    SmsNotifications BIT DEFAULT 1,
    EmailNotifications BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Bookings Table
CREATE TABLE Bookings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CustomerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(Id),
    SalonId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Salons(Id),
    BranchId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Branches(Id),
    StylistId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Stylists(Id),
    ServiceId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Services(Id),
    BookingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Status INT NOT NULL DEFAULT 1, -- 1=Pending, 2=Confirmed, 3=Completed, 4=Cancelled, 5=NoShow
    TotalPrice DECIMAL(18,2) NOT NULL,
    Notes NVARCHAR(MAX),
    ReminderSent BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    CancelledAt DATETIME2,
    CancellationReason NVARCHAR(MAX)
);

CREATE INDEX IX_Bookings_Customer ON Bookings(CustomerId);
CREATE INDEX IX_Bookings_Date ON Bookings(BookingDate);
CREATE INDEX IX_Bookings_Status ON Bookings(Status);

-- Payments Table
CREATE TABLE Payments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BookingId UNIQUEIDENTIFIER NOT NULL UNIQUE FOREIGN KEY REFERENCES Bookings(Id),
    Method INT NOT NULL, -- 1=Cash, 2=Card, 3=Online
    Status INT NOT NULL DEFAULT 1, -- 1=Pending, 2=Paid, 3=Failed, 4=Refunded
    Amount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) DEFAULT 'OMR',
    TransactionId NVARCHAR(255),
    PaymentGatewayResponse NVARCHAR(MAX),
    PaidAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Loyalty Points Table
CREATE TABLE LoyaltyPoints (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    CustomerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Customers(Id),
    SalonId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Salons(Id),
    Points INT NOT NULL,
    Source NVARCHAR(100), -- 'Booking', 'Referral', 'Promotion'
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2
);

-- OTP Codes Table
CREATE TABLE OtpCodes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PhoneNumber NVARCHAR(20) NOT NULL,
    Code NVARCHAR(10) NOT NULL,
    Purpose INT NOT NULL, -- 1=Registration, 2=Login, 3=PhoneVerification, 4=PasswordReset
    IsUsed BIT DEFAULT 0,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_OtpCodes_Phone_Code ON OtpCodes(PhoneNumber, Code, Purpose);
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
