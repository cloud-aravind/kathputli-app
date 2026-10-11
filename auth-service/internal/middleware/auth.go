package middleware

import (
	"context"
	"github.com/google/uuid"
	"github.com/kathputli/auth-service/internal/service"
	"net/http"
	"strings"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	RoleKey   contextKey = "role"
)

func RequireAuth(a *service.AuthService, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := strings.Fields(r.Header.Get("Authorization"))
		if len(p) != 2 || !strings.EqualFold(p[0], "Bearer") {
			http.Error(w, `{"error":"missing or invalid authorization header"}`, http.StatusUnauthorized)
			return
		}
		id, role, e := a.ParseToken(p[1])
		if e != nil {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, id)
		ctx = context.WithValue(ctx, RoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
func UserIDFromContext(c context.Context) (uuid.UUID, bool) {
	v, ok := c.Value(UserIDKey).(uuid.UUID)
	return v, ok
}
func RoleFromContext(c context.Context) (string, bool) {
	v, ok := c.Value(RoleKey).(string)
	return v, ok
}
