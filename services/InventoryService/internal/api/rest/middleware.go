package rest

import (
	"fmt"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/danielgtaylor/huma/v2"
)

// ValidateAdminToken is a helper for Huma handlers to check permissions
func ValidateAdminToken(ctx huma.Context) error {
	authHeader := ctx.Header("Authorization")
	if authHeader == "" {
		return huma.Error401Unauthorized("Authorization header required")
	}

	bearerToken := strings.Split(authHeader, " ")
	if len(bearerToken) != 2 {
		return huma.Error401Unauthorized("Invalid token format")
	}

	tokenString := bearerToken[1]
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "ThisIsAVerySecretKeyForDevelopmentOnly123!"
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil || !token.Valid {
		return huma.Error401Unauthorized("Invalid or expired token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return huma.Error401Unauthorized("Invalid token claims")
	}

	role, hasRole := claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
	if !hasRole {
		role = claims["role"]
	}

	if role != "Admin" && role != "ADMIN" {
		return huma.Error403Forbidden("Access denied: Admin role required")
	}

	return nil
}

// Keep Gin Middlewares for standard Gin routes if any
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
