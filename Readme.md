# 🎨 ZAYNA - Beauty & Barber Salon Booking System

<div align="center">

![ZAYNA Logo](https://via.placeholder.com/200x80/276351/FFFFFF?text=ZAYNA)

**Your Time to Shine | وقتك للتألق**

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A complete bilingual (Arabic/English) salon appointment booking system designed for Oman.

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎯 Core Features

- **Multi-Role System**: Admin, Salon Owner, Stylist, and Customer roles
- **Bilingual Support**: Full Arabic and English localization with RTL support
- **OTP Authentication**: Secure phone-based authentication with SMS verification
- **Social Login**: Google, Apple, Facebook, and Twitter integration
- **Wizard Registration**: Step-by-step onboarding for smooth user experience
- **Real-time Booking**: Check availability and book appointments instantly
- **Payment Integration**: Online payments via Stripe or in-person cash
- **Smart Notifications**: SMS and email reminders 2 hours before appointments
- **Loyalty Program**: Points system for repeat customers
- **Multi-Branch Support**: Salons can manage multiple locations
- **Service Management**: Flexible service catalog with pricing and duration
- **Stylist Scheduling**: Individual working hours and service assignments

### 🎨 Design Features

- **Brand Colors**: 
  - Primary: Emerald Green (#276351)
  - Secondary: Arabic Beige (#D4B483)
  - Accent: Warm Gold (#E3B23C)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Ready**: Easy theme switching capability
- **Elegant UI**: Clean, modern interface with smooth animations

---

## 🛠 Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: SQL Server 2022
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer Tokens
- **API Documentation**: Swagger/OpenAPI
- **SMS**: Twilio
- **Email**: SendGrid
- **Payments**: Stripe

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Context API
- **HTTP Client**: Axios
- **Internationalization**: i18next
- **Notifications**: React Toastify
- **Date Handling**: date-fns

### DevOps
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **CI/CD**: GitHub Actions (ready)

---

## 📁 Project Structure

```
ZAYNA/
├── Backend/
│   ├── Zayna.API/              # Web API project
│   │   ├── Controllers/        # API controllers
│   │   ├── Program.cs          # Application entry point
│   │   └── appsettings.json    # Configuration
│   │
│   ├── Zayna.Core/             # Domain layer
│   │   ├── Entities/           # Domain entities
│   │   ├── Interfaces/         # Service interfaces
│   │   └── DTOs/               # Data transfer objects
│   │
│   └── Zayna.Infrastructure/   # Data & services layer
│       ├── Data/               # DbContext & migrations
│       ├── Repositories/       # Data access
│       └── Services/           # External services
│
├── Frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/           # Authentication
│   │   │   ├── common/         # Shared components
│   │   │   ├── customer/       # Customer dashboard
│   │   │   ├── salon/          # Salon dashboard
│   │   │   └── admin/          # Admin dashboard
│   │   ├── contexts/           # React contexts
│   │   ├── services/           # API services
│   │   ├── i18n/               # Translations
│   │   └── App.jsx             # Main app component
│   │
│   ├── public/                 # Static assets
│   └── package.json            # Dependencies
│
├── Database/
│   ├── schema.sql              # Database schema
│   └── seed-data.sql           # Sample data
│
├── docker-compose.yml          # Docker orchestration
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server 2022](https://www.microsoft.com/sql-server) or Docker
- [Git](https://git-scm.com/)

### Installation

#### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/zayna.git
cd zayna

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# The app will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

#### Option 2: Manual Setup

**1. Database Setup**

```bash
# Create database
sqlcmd -S localhost -U sa -P YourPassword -i Database/schema.sql

# Seed data
sqlcmd -S localhost -U sa -P YourPassword -i Database/seed-data.sql
```

**2. Backend Setup**

```bash
cd Backend

# Restore packages
dotnet restore

# Update connection string in appsettings.json
# Then run migrations
dotnet ef database update --project Zayna.Infrastructure --startup-project Zayna.API

# Run the API
dotnet run --project Zayna.API

# API will be available at http://localhost:5000
```

**3. Frontend Setup**

```bash
cd Frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev

# Frontend will be available at http://localhost:3000
```

---

## ⚙️ Configuration

### Backend Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ZaynaDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyMinimum32Characters!",
    "Issuer": "https://zayna.om",
    "Audience": "https://zayna.om"
  },
  "Twilio": {
    "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "AuthToken": "your_auth_token",
    "PhoneNumber": "+96812345678"
  },
  "SendGrid": {
    "ApiKey": "SG.your_api_key",
    "FromEmail": "noreply@zayna.om"
  },
  "Stripe": {
    "SecretKey": "sk_test_your_key",
    "PublishableKey": "pk_test_your_key"
  }
}
```

### Frontend Configuration (.env)

```bash
VITE_API_URL=http://localhost:5000/api
```

### Default Credentials (Seed Data)

| Role | Phone | Email | Password (OTP) |
|------|-------|-------|----------------|
| Admin | +96899999999 | admin@zayna.om | Check console |
| Salon | +96891111111 | salon1@zayna.om | Check console |
| Customer | +96893333333 | customer1@zayna.om | Check console |

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/register
POST /api/auth/login
POST /api/auth/social-login
```

### Booking Endpoints

```http
GET  /api/booking/available-slots
POST /api/booking
GET  /api/booking/my-bookings
GET  /api/booking/{id}
POST /api/booking/{id}/cancel
```

### Salon Endpoints

```http
GET  /api/salon
GET  /api/salon/{id}
GET  /api/salon/{id}/services
GET  /api/salon/{id}/stylists
GET  /api/salon/{id}/bookings
POST /api/salon
PUT  /api/salon/{id}
```

**Full API documentation available at**: `http://localhost:5000/swagger`

---

## 🌐 Deployment

### Production Deployment

**1. Update Configuration**

```bash
# Backend: Update appsettings.Production.json
# Frontend: Update production .env
```

**2. Build for Production**

```bash
# Backend
cd Backend
dotnet publish -c Release -o ./publish

# Frontend
cd Frontend
npm run build
```

**3. Deploy to Server**

```bash
# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to cloud platforms:
# - Azure App Service
# - AWS Elastic Beanstalk
# - DigitalOcean App Platform
```

### Environment Variables for Production

```bash
# Database
DB_SERVER=your-server.database.windows.net
DB_NAME=ZaynaDB_Prod
DB_USER=zayna_admin
DB_PASSWORD=YourProductionPassword

# JWT
JWT_KEY=YourProductionSecretKey

# External Services
TWILIO_ACCOUNT_SID=your_production_sid
SENDGRID_API_KEY=your_production_key
STRIPE_SECRET_KEY=sk_live_your_production_key
```

---

## 🧪 Testing

### Backend Tests

```bash
cd Backend
dotnet test
```

### Frontend Tests

```bash
cd Frontend
npm run test
```

---

## 📱 Mobile App (Future)

The system is designed with a REST API that can be consumed by:
- React Native mobile app
- Flutter mobile app
- Native iOS/Android apps

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Project Lead**: Your Name
- **Backend Developer**: Your Name
- **Frontend Developer**: Your Name
- **UI/UX Designer**: Your Name

---

## 📞 Support

For support, email support@zayna.om or join our Slack channel.

---

## 🙏 Acknowledgments

- Icons by [React Icons](https://react-icons.github.io/react-icons/)
- UI inspired by modern salon booking systems
- Built with ❤️ for the Omani market

---

<div align="center">

**Made with 💚 in Oman**

[Website](https://zayna.om) • [Documentation](https://docs.zayna.om) • [API](https://api.zayna.om)

</div>