package service

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/kathputli/user-service/internal/model"
	"github.com/kathputli/user-service/internal/repository"
	"strings"
)

var ErrInvalidName = errors.New("name must not be empty")

type UserService struct{ repo *repository.UserRepository }

func NewUserService(r *repository.UserRepository) *UserService { return &UserService{r} }
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (model.UserResponse, error) {
	u, e := s.repo.FindByID(ctx, id)
	if e != nil {
		return model.UserResponse{}, e
	}
	return model.ToResponse(u), nil
}
func (s *UserService) UpdateProfile(ctx context.Context, id uuid.UUID, req model.UpdateProfileRequest) (model.UserResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return model.UserResponse{}, ErrInvalidName
	}
	u, e := s.repo.UpdateName(ctx, id, name)
	if e != nil {
		return model.UserResponse{}, e
	}
	return model.ToResponse(u), nil
}

func (s *UserService) CreateFromEvent(ctx context.Context, event model.UserCreatedEvent) error {
	return s.repo.UpsertFromEvent(ctx, event)
}
