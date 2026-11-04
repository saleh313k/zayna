-- One-time database setup, run by deploy/scripts/init-db.sh (safe to re-run).
-- Creates the database and a dedicated least-privilege login for the application, so the API never uses 'sa'.
-- $(APP_PASSWORD) is supplied by sqlcmd (-v APP_PASSWORD=...).
IF DB_ID(N'ZaynaDB') IS NULL
    CREATE DATABASE [ZaynaDB];
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'zayna_app')
    CREATE LOGIN [zayna_app] WITH PASSWORD = N'$(APP_PASSWORD)', CHECK_POLICY = ON;
ELSE
    ALTER LOGIN [zayna_app] WITH PASSWORD = N'$(APP_PASSWORD)';
GO

USE [ZaynaDB];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'zayna_app')
    CREATE USER [zayna_app] FOR LOGIN [zayna_app];
-- db_owner on THIS database only: required so EF Core migrations can create and alter tables.
ALTER ROLE db_owner ADD MEMBER [zayna_app];
GO
