package security

// Standard Roles matching IdentityService
const (
	RoleAdmin   = "Admin"
	RoleManager = "Manager"
	RoleAuditor = "Auditor"
	RoleUser    = "User"
)

// Permission Checks
func IsManagement(role string) bool {
	return role == RoleAdmin || role == RoleManager
}

func IsAdmin(role string) bool {
	return role == RoleAdmin
}
