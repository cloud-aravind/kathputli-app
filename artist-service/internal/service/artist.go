package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/kathputli/artist-service/internal/broker"
	"github.com/kathputli/artist-service/internal/model"
	"github.com/kathputli/artist-service/internal/repository"
)

var (
	ErrInvalidInput   = errors.New("invalid input")
	ErrArtistNotFound = errors.New("artist not found")
	ErrForbidden      = errors.New("forbidden")
)

type ArtistService struct {
	repo   *repository.Repository
	broker *broker.Client
}

func NewArtistService(repo *repository.Repository, brokerClient *broker.Client) *ArtistService {
	return &ArtistService{
		repo:   repo,
		broker: brokerClient,
	}
}

func (s *ArtistService) Create(ctx context.Context, userID uuid.UUID, req model.CreateArtistRequest) (*model.Artist, error) {
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" ||
		strings.TrimSpace(req.Address) == "" || strings.TrimSpace(req.City) == "" {
		return nil, ErrInvalidInput
	}

	existing, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("check existing artist: %w", err)
	}
	if existing != nil {
		return nil, errors.New("artist profile already exists")
	}

	artist := &model.Artist{
		ID:      uuid.New(),
		UserID:  userID,
		Name:    strings.TrimSpace(req.Name),
		Email:   strings.TrimSpace(req.Email),
		Phone:   strings.TrimSpace(req.Phone),
		Address: strings.TrimSpace(req.Address),
		City:    strings.TrimSpace(req.City),
		State:   strings.TrimSpace(req.State),
		Country: strings.TrimSpace(req.Country),
		Bio:     strings.TrimSpace(req.Bio),
	}

	if err := s.repo.Create(ctx, artist); err != nil {
		return nil, fmt.Errorf("create artist: %w", err)
	}

	event := model.ArtistCreatedEvent{
		EventID:   uuid.New().String(),
		Event:     "artist.created",
		ArtistID:  artist.ID,
		UserID:    artist.UserID,
		Name:      artist.Name,
		Email:     artist.Email,
		City:      artist.City,
		CreatedAt: artist.CreatedAt,
	}

	if err := s.broker.PublishArtistCreated(event); err != nil {
		return nil, fmt.Errorf("artist created but event publication failed: %w", err)
	}

	return artist, nil
}

func (s *ArtistService) Get(ctx context.Context, id uuid.UUID) (*model.Artist, error) {
	artist, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if artist == nil {
		return nil, ErrArtistNotFound
	}

	return artist, nil
}

func (s *ArtistService) Update(ctx context.Context, userID, artistID uuid.UUID, req model.UpdateArtistRequest) (*model.Artist, error) {
	artist, err := s.repo.GetByID(ctx, artistID)
	if err != nil {
		return nil, err
	}
	if artist == nil {
		return nil, ErrArtistNotFound
	}

	if artist.UserID != userID {
		return nil, ErrForbidden
	}

	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" ||
		strings.TrimSpace(req.Address) == "" || strings.TrimSpace(req.City) == "" {
		return nil, ErrInvalidInput
	}

	artist.Name = strings.TrimSpace(req.Name)
	artist.Email = strings.TrimSpace(req.Email)
	artist.Phone = strings.TrimSpace(req.Phone)
	artist.Address = strings.TrimSpace(req.Address)
	artist.City = strings.TrimSpace(req.City)
	artist.State = strings.TrimSpace(req.State)
	artist.Country = strings.TrimSpace(req.Country)
	artist.Bio = strings.TrimSpace(req.Bio)

	if err := s.repo.Update(ctx, artist); err != nil {
		return nil, err
	}

	return artist, nil
}
