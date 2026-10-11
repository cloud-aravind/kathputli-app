package middleware

import (
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
    Email string `json:"email"`
    Role  string `json:"role"`
    jwt.RegisteredClaims
}

func ParseToken(tokenString, secret string) (*Claims, error) {
    claims := &Claims{}

    token, err := jwt.ParseWithClaims(
        tokenString,
        claims,
        func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, jwt.ErrTokenSignatureInvalid
            }
            return []byte(secret), nil
        },
    )
    if err != nil {
        return nil, err
    }

    if !token.Valid {
        return nil, jwt.ErrTokenInvalidClaims
    }

    return claims, nil
}

func JWTAuth(secret string, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        header := r.Header.Get("Authorization")

        if !strings.HasPrefix(header, "Bearer ") {
            http.Error(w, `{"error":"missing bearer token"}`, http.StatusUnauthorized)
            return
        }

        tokenString := strings.TrimPrefix(header, "Bearer ")

        claims, err := ParseToken(tokenString, secret)
        if err != nil {
            http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
            return
        }

        r.Header.Set("X-User-ID", claims.Subject)
        r.Header.Set("X-User-Role", claims.Role)

        next.ServeHTTP(w, r)
    })
}
