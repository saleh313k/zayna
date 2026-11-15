namespace Zayna.Core.Interfaces
{
    public interface IPasswordService
    {
        /// <summary>
        /// Emails a reset link when the address belongs to an active account. Never reveals whether it does:
        /// it returns normally in every case (unknown address, disabled account, throttled, email failure).
        /// </summary>
        Task RequestResetAsync(string? email);

        /// <summary>Sets a new password using a token from a reset email. Throws AppException(RESET_TOKEN_INVALID) if unusable.</summary>
        Task ResetAsync(string? token, string? newPassword);

        /// <summary>Changes the password of a signed-in user after verifying the current one.</summary>
        Task ChangeAsync(Guid userId, string? currentPassword, string? newPassword);
    }
}
