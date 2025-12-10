# ZAYNA File Structure

## Copy code from artifacts to these files:

### Backend
- backend\ZAYNA.Core\Entities\User.cs
- backend\ZAYNA.Core\Entities\Customer.cs
- backend\ZAYNA.Core\Entities\Salon.cs
- backend\ZAYNA.Core\Entities\Branch.cs
- backend\ZAYNA.Core\Entities\Stylist.cs
- backend\ZAYNA.Core\Entities\Service.cs
- backend\ZAYNA.Core\Entities\Booking.cs
- backend\ZAYNA.Core\Entities\Payment.cs
- backend\ZAYNA.Core\Entities\StylistService.cs
- backend\ZAYNA.Core\Entities\BranchWorkingHours.cs
- backend\ZAYNA.Core\Entities\LoyaltyPointsHistory.cs
- backend\ZAYNA.Core\Entities\Notification.cs
- backend\ZAYNA.Core\Entities\Review.cs
- backend\ZAYNA.Core\Entities\StylistOffDay.cs
- backend\ZAYNA.Core\Entities\OTPVerification.cs
- backend\ZAYNA.Core\Entities\SocialAuthProvider.cs

- backend\ZAYNA.Core\Interfaces\IRepository.cs
- backend\ZAYNA.Core\Interfaces\IAuthService.cs
- backend\ZAYNA.Core\Interfaces\ISMSService.cs
- backend\ZAYNA.Core\Interfaces\IEmailService.cs
- backend\ZAYNA.Core\Interfaces\IPaymentService.cs
- backend\ZAYNA.Core\Interfaces\ILoyaltyService.cs
- backend\ZAYNA.Core\Interfaces\INotificationService.cs
- backend\ZAYNA.Core\Interfaces\IBookingService.cs
- backend\ZAYNA.Infrastructure\Repositories\GenericRepository.cs
- backend\ZAYNA.Infrastructure\Services\AuthService.cs
- backend\ZAYNA.Infrastructure\Services\TwilioSMSService.cs
- backend\ZAYNA.Infrastructure\Services\SendGridEmailService.cs

- backend\ZAYNA.Infrastructure\Services\BookingService.cs
- backend\ZAYNA.Infrastructure\Services\ThawaniPaymentService.cs
- backend\ZAYNA.Infrastructure\Services\LoyaltyService.cs
- backend\ZAYNA.Infrastructure\Services\NotificationService.cs

- backend\ZAYNA.API\Controllers\AuthController.cs
- backend\ZAYNA.API\Controllers\BookingController.cs
- backend\ZAYNA.API\Controllers\SalonController.cs
- backend\ZAYNA.API\Controllers\ServiceController.cs
- backend\ZAYNA.API\Controllers\AdminController.cs
- backend\ZAYNA.API\Controllers\CustomerController.cs
- backend\ZAYNA.Infrastructure\Services\NotificationScheduler.cs
- backend\ZAYNA.API\Controllers\BranchController.cs
- backend\ZAYNA.API\Controllers\ReviewController.cs

- backend\ZAYNA.API\ZAYNA.API.csproj
- backend\ZAYNA.Core\ZAYNA.Core.csproj
- backend\ZAYNA.Infrastructure\ZAYNA.Infrastructure.csproj
- backend\ZAYNA.Application\ZAYNA.Application.csproj

- backend\ZAYNA.Infrastructure\Data\ApplicationDbContext.cs
- backend\ZAYNA.Infrastructure\Repositories\GenericRepository.cs
- backend\ZAYNA.API\Program.cs
- backend\ZAYNA.API\appsettings.json

- Dockerfile
- docker-compose.yml
- frontend\Dockerfile
- frontend\nginx.conf
- .dockerignore
- .github\workflows\deploy.yml
- .gitignore



### Frontend
- frontend\src\App.jsx
- frontend\src\main.jsx

- frontend\src\App.jsx
- frontend\src\context\AuthContext.jsx
- frontend\src\context\LanguageContext.jsx
- frontend\src\hooks\useAuth.js
- frontend\src\hooks\useLanguage.js
- frontend\src\components\common\ProtectedRoute.jsx
- frontend\src\components\common\LoadingSpinner.jsx

- frontend\src\services\api.js
- frontend\src\services\authService.js
- frontend\src\pages\Login.jsx
- frontend\src\pages\Register.jsx
- frontend\src\components\common\Header.jsx
- frontend\src\components\common\LanguageSwitcher.jsx

- frontend\src\pages\Dashboard.jsx
- frontend\src\components\common\Sidebar.jsx
- frontend\src\i18n\en.json
- frontend\src\i18n\ar.json

- frontend\src\components\customer\CustomerDashboard.jsx
- frontend\src\components\customer\BookingForm.jsx
- frontend\src\components\customer\MyBookings.jsx

- frontend\src\components\admin\AdminDashboard.jsx
- frontend\src\components\admin\UserManagement.jsx
- frontend\src\components\admin\Reports.jsx
- frontend\src\components\salon\ServiceManagement.jsx
- frontend\src\components\salon\SalonDashboard.jsx
- frontend\src\components\stylist\StylistDashboard.jsx
- frontend\src\pages\NotFound.jsx
- frontend\src\styles\globals.css
- tailwind.config.js
- vite.config.js
- package.json
- postcss.config.js
- index.html
- frontend\src\main.jsx

- README.md
- docs\ARCHITECTURE.md
- docs\TESTING_DEPLOYMENT.md


- frontend\index.html
- frontend\vite.config.js
- frontend\tailwind.config.js

### Database
- database\schema.sql

See FILE_MAPPING.md for detailed artifact-to-file mapping.
