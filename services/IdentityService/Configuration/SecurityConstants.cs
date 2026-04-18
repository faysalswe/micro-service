namespace IdentityService.Configuration;

/// <summary>
/// Centralized Source of Truth for Security Roles.
/// These constants are "Glued to Code" and correspond to the 
/// definitions in protos/auth/v1/roles.proto.
/// </summary>
public static class SecurityRoles
{
    // These values match the string representation of UserRole enum
    public const string Admin = "Admin";     
    public const string Manager = "Manager"; 
    public const string Auditor = "Auditor"; 
    public const string User = "User";       

    public static readonly string[] All = { Admin, Manager, Auditor, User };

    public static bool IsManagement(string role) => role == Admin || role == Manager;
    public static bool IsAdmin(string role) => role == Admin;
}
