package rest

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates the JWT and extracts claims
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		tokenString := bearerToken[1]
		secretKey := os.Getenv("JWT_SECRET")
		if secretKey == "" {
			secretKey = "ThisIsAVerySecretKeyForDevelopmentOnly123!" // Match IdentityService
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Set claims in context for downstream handlers
		c.Set("user_id", claims["user_id"])
		
		// .NET ClaimTypes.Role maps to this long string in standard JWTs or just "role"
		// We check both for robustness
		role, hasRole := claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
		if !hasRole {
			role = claims["role"]
		}
		c.Set("role", role)

		c.Next()
	}
}

// AdminOnly checks if the user has the Admin role
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || (role != "Admin" && role != "ADMIN") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: Admin role required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
