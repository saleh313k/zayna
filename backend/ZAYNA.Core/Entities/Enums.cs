// backend/ZAYNA.Core/Enums/Enums.cs
namespace ZAYNA.Core.Enums
{
    public enum UserRole
    {
        Admin = 0,
        Salon = 1,
        Stylist = 2,
        Customer = 3
    }


    public enum BookingStatus
    {
        Pending = 0,
        Confirmed = 1,
        InProgress = 2,
        Completed = 3,
        Cancelled = 4,
        NoShow = 5
    }

    public enum PaymentStatus
    {
        Pending = 0,
        Processing = 1,
        Completed = 2,
        Failed = 3,
        Refunded = 4
    }

    public enum PaymentType
    {
        Online = 0,
        InPerson = 1
    }

    public enum Gender
    {
        Male = 0,
        Female = 1,
        Other = 2
    }

    public enum DayOfWeek
    {
        Sunday = 0,
        Monday = 1,
        Tuesday = 2,
        Wednesday = 3,
        Thursday = 4,
        Friday = 5,
        Saturday = 6
    }

    public enum ServiceCategory
    {
        Haircut,
        Coloring,
        Styling,
        Facial,
        Massage,
        Manicure,
        Pedicure,
        Waxing,
        Makeup,
        Other
    }
    public enum OTPPurpose
    {
        Registration = 1,
        Login = 2,
        PasswordReset = 3
    }
    public enum UserLanguage
    {
        English = 1,
        Arabic = 2
    }
    public enum SocialProvider
    {
        Google = 1,
        Apple = 2,
        Facebook = 3,
        Twitter = 4
    }

    public enum PaymentMethod
    {
        Cash = 1,
        Online = 2,
        Card = 3
    }


    public enum NotificationType
    {
        BookingConfirmation = 1,
        BookingReminder = 2,
        BookingCancellation = 3,
        PaymentConfirmation = 4,
        General = 5
    }
}