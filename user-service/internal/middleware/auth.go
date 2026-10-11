package middleware

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"net/http"
	"strings"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const RoleKey contextKey = "role"

func RequireAuth(secret string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Fields(r.Header.Get("Authorization"))
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			unauthorized(w, "missing or invalid authorization header")
			return
		}
		token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
			if t.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			unauthorized(w, "invalid or expired token")
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			unauthorized(w, "invalid token claims")
			return
		}
		sub, ok := claims["sub"].(string)
		if !ok {
			unauthorized(w, "invalid token subject")
			return
		}
		id, err := uuid.Parse(sub)
		if err != nil {
			unauthorized(w, "invalid token subject")
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, id)
		ctx = context.WithValue(ctx, RoleKey, claims["role"])
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	v, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return v, ok
}
func RoleFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(RoleKey).(string)
	return v, ok
}
func unauthorized(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":"` + msg + `"}`))
}
