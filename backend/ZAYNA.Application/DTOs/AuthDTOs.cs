<<<<<<< HEAD
using System;
using System.Collections.Generic;

// ZAYNA.Application/DTOs/AuthDTOs.cs
using System;

namespace ZAYNA.Application.DTOs
{
    public class LoginRequestDTO
    {
        public string PhoneNumber { get; set; }
        public string OTPCode { get; set; }
    }

    public class RegisterRequestDTO
    {
        public string PhoneNumber { get; set; }
        public string OTPCode { get; set; }
        public string Role { get; set; }
        public string FullName { get; set; }
    }

    public class SendOTPRequestDTO
    {
        public string PhoneNumber { get; set; }
    }

    public class AuthResponseDTO
    {
        public bool Success { get; set; }
        public string Token { get; set; }
        public UserDTO User { get; set; }
        public string Message { get; set; }
    }

    public class UserDTO
    {
        public Guid Id { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }
=======
using System;
using System.Collections.Generic;

// ZAYNA.Application/DTOs/AuthDTOs.cs
using System;

namespace ZAYNA.Application.DTOs
{
    public class LoginRequestDTO
    {
        public string PhoneNumber { get; set; }
        public string OTPCode { get; set; }
    }

    public class RegisterRequestDTO
    {
        public string PhoneNumber { get; set; }
        public string OTPCode { get; set; }
        public string Role { get; set; }
        public string FullName { get; set; }
    }

    public class SendOTPRequestDTO
    {
        public string PhoneNumber { get; set; }
    }

    public class AuthResponseDTO
    {
        public bool Success { get; set; }
        public string Token { get; set; }
        public UserDTO User { get; set; }
        public string Message { get; set; }
    }

    public class UserDTO
    {
        public Guid Id { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
}