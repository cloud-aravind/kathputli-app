package service

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/kathputli/auth-service/internal/broker"
	"github.com/kathputli/auth-service/internal/model"
	"github.com/kathputli/auth-service/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"time"
)

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidRole        = errors.New("invalid role")
)

type AuthService struct {
	users     *repository.UserRepository
	events    *broker.Client
	jwtSecret []byte
	jwtExpiry time.Duration
}

func NewAuthService(u *repository.UserRepository, events *broker.Client, s string, e time.Duration) *AuthService {
	return &AuthService{users: u, events: events, jwtSecret: []byte(s), jwtExpiry: e}
}
func (s *AuthService) Register(ctx context.Context, r model.RegisterRequest) (model.User, error) {
	r.Name = strings.TrimSpace(r.Name)
	r.Email = strings.TrimSpace(strings.ToLower(r.Email))
	if r.Name == "" || r.Email == "" || len(r.Password) < 8 {
		return model.User{}, ErrInvalidInput
	}
	if r.Role == "" {
		r.Role = "customer"
	}
	if r.Role != "customer" && r.Role != "artist-admin" && r.Role != "delivery-agent" {
		return model.User{}, ErrInvalidRole
	}
	h, e := bcrypt.GenerateFromPassword([]byte(r.Password), bcrypt.DefaultCost)
	if e != nil {
		return model.User{}, e
	}
	u := model.User{ID: uuid.New(), Name: r.Name, Email: r.Email, PasswordHash: string(h), Role: r.Role}
	if e = s.users.Create(ctx, u); e != nil {
		return model.User{}, e
	}
	event := model.UserCreatedEvent{
		EventID: uuid.NewString(),
		Event:   "user.created", UserID: u.ID, Name: u.Name,
		Email: u.Email, Role: u.Role, CreatedAt: u.CreatedAt,
	}
	if event.CreatedAt == "" {
		event.CreatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	}
	if e = s.events.PublishUserCreated(event); e != nil {
		return model.User{}, errors.New("user created but user.created event could not be published")
	}
	return u, nil
}
func (s *AuthService) Login(ctx context.Context, r model.LoginRequest) (model.AuthResponse, error) {
	u, e := s.users.FindByEmail(ctx, strings.TrimSpace(strings.ToLower(r.Email)))
	if e != nil {
		if errors.Is(e, repository.ErrUserNotFound) {
			return model.AuthResponse{}, ErrInvalidCredentials
		}
		return model.AuthResponse{}, e
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(r.Password)) != nil {
		return model.AuthResponse{}, ErrInvalidCredentials
	}
	now := time.Now()
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": u.ID.String(), "email": u.Email, "role": u.Role, "iat": now.Unix(), "exp": now.Add(s.jwtExpiry).Unix()})
	token, e := t.SignedString(s.jwtSecret)
	if e != nil {
		return model.AuthResponse{}, e
	}
	return model.AuthResponse{Token: token, User: u}, nil
}
func (s *AuthService) ParseToken(v string) (uuid.UUID, string, error) {
	t, e := jwt.Parse(v, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if e != nil || !t.Valid {
		return uuid.Nil, "", ErrInvalidCredentials
	}
	c, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, "", ErrInvalidCredentials
	}
	sub, ok := c["sub"].(string)
	if !ok {
		return uuid.Nil, "", ErrInvalidCredentials
	}
	id, e := uuid.Parse(sub)
	if e != nil {
		return uuid.Nil, "", ErrInvalidCredentials
	}
	role, _ := c["role"].(string)
	return id, role, nil
}
func (s *AuthService) UserByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	return s.users.FindByID(ctx, id)
}
