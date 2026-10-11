package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kathputli/artwork-service/internal/broker"
	"github.com/kathputli/artwork-service/internal/client"
	"github.com/kathputli/artwork-service/internal/model"
	"github.com/kathputli/artwork-service/internal/repository"
)

var (
	ErrInvalidInput     = errors.New("invalid input")
	ErrCategoryNotFound = errors.New("category not found")
	ErrArtworkNotFound  = errors.New("artwork not found")
	ErrForbidden        = errors.New("forbidden")
	ErrAlreadyExists    = errors.New("already exists")
	ErrArtistNotFound   = errors.New("artist not found")
)

type ArtworkService struct {
	repo         *repository.Repository
	broker       *broker.Client
	artistClient *client.ArtistClient
}

func NewArtworkService(repo *repository.Repository, brokerClient *broker.Client, artistClient *client.ArtistClient) *ArtworkService {
	return &ArtworkService{repo: repo, broker: brokerClient, artistClient: artistClient}
}

func (s *ArtworkService) verifyOwnership(ctx context.Context, userID, artistID uuid.UUID) error {
	if userID == uuid.Nil || artistID == uuid.Nil {
		return ErrForbidden
	}
	if err := s.artistClient.VerifyOwnership(ctx, userID, artistID); err != nil {
		if errors.Is(err, client.ErrNotFound) {
			return ErrArtistNotFound
		}
		if errors.Is(err, client.ErrForbidden) {
			return ErrForbidden
		}
		return fmt.Errorf("verify artist ownership: %w", err)
	}
	return nil
}

func (s *ArtworkService) CreateCategory(ctx context.Context, userID, artistID uuid.UUID, req model.CreateCategoryRequest) (*model.Category, error) {
	if userID == uuid.Nil || artistID == uuid.Nil || strings.TrimSpace(req.Name) == "" {
		return nil, ErrInvalidInput
	}
	if err := s.verifyOwnership(ctx, userID, artistID); err != nil {
		return nil, err
	}
	c := &model.Category{ID: uuid.New(), ArtistID: artistID, Name: strings.TrimSpace(req.Name), Slug: repository.Slugify(req.Name)}
	if c.Slug == "" {
		return nil, ErrInvalidInput
	}
	if err := s.repo.CreateCategory(ctx, c); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrAlreadyExists
		}
		return nil, fmt.Errorf("create category: %w", err)
	}
	return c, nil
}

func (s *ArtworkService) ListCategories(ctx context.Context, artistID uuid.UUID) ([]model.Category, error) {
	if artistID == uuid.Nil {
		return nil, ErrInvalidInput
	}
	return s.repo.ListCategories(ctx, artistID)
}

func (s *ArtworkService) CreateArtwork(ctx context.Context, userID, artistID uuid.UUID, req model.CreateArtworkRequest) (*model.Artwork, error) {
	if userID == uuid.Nil || artistID == uuid.Nil || strings.TrimSpace(req.Title) == "" || req.Price < 0 || req.Stock < 0 {
		return nil, ErrInvalidInput
	}
	if err := s.verifyOwnership(ctx, userID, artistID); err != nil {
		return nil, err
	}
	if req.CategoryID != nil {
		ok, err := s.repo.CategoryBelongsToArtist(ctx, *req.CategoryID, artistID)
		if err != nil {
			return nil, fmt.Errorf("validate category: %w", err)
		}
		if !ok {
			return nil, ErrCategoryNotFound
		}
	}
	currency := strings.ToUpper(strings.TrimSpace(req.Currency))
	if currency == "" {
		currency = "INR"
	}
	a := &model.Artwork{ID: uuid.New(), ArtistID: artistID, CategoryID: req.CategoryID, Title: strings.TrimSpace(req.Title), Description: strings.TrimSpace(req.Description), Price: req.Price, Currency: currency, ImageURL: strings.TrimSpace(req.ImageURL), Stock: req.Stock, IsActive: true}
	if err := s.repo.CreateArtwork(ctx, a); err != nil {
		return nil, fmt.Errorf("create artwork: %w", err)
	}
	event := model.ArtworkCreatedEvent{EventID: uuid.New().String(), Event: "artwork.created", ArtworkID: a.ID, ArtistID: a.ArtistID, CategoryID: a.CategoryID, Title: a.Title, Price: a.Price, Currency: a.Currency, CreatedAt: a.CreatedAt}
	if err := s.broker.PublishArtworkCreated(event); err != nil {
		return nil, fmt.Errorf("artwork created but event publication failed: %w", err)
	}
	return a, nil
}

func (s *ArtworkService) ListArtworks(ctx context.Context, artistID uuid.UUID) ([]model.Artwork, error) {
	if artistID == uuid.Nil {
		return nil, ErrInvalidInput
	}
	return s.repo.ListArtworks(ctx, artistID)
}

func (s *ArtworkService) GetArtwork(ctx context.Context, id uuid.UUID) (*model.Artwork, error) {
	a, err := s.repo.GetArtwork(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get artwork: %w", err)
	}
	if a == nil {
		return nil, ErrArtworkNotFound
	}
	return a, nil
}

func (s *ArtworkService) ListActiveArtworks(ctx context.Context) ([]model.Artwork, error) {
	return s.repo.ListActiveArtworks(ctx)
}

func (s *ArtworkService) UpdateArtwork(ctx context.Context, userID, artworkID uuid.UUID, req model.UpdateArtworkRequest) (*model.Artwork, error) {
	a, err := s.repo.GetArtwork(ctx, artworkID)
	if err != nil {
		return nil, fmt.Errorf("get artwork: %w", err)
	}
	if a == nil {
		return nil, ErrArtworkNotFound
	}
	if userID == uuid.Nil {
		return nil, ErrForbidden
	}
	if err := s.verifyOwnership(ctx, userID, a.ArtistID); err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Title) == "" || req.Price < 0 || req.Stock < 0 {
		return nil, ErrInvalidInput
	}
	if req.CategoryID != nil {
		ok, err := s.repo.CategoryBelongsToArtist(ctx, *req.CategoryID, a.ArtistID)
		if err != nil {
			return nil, fmt.Errorf("validate category: %w", err)
		}
		if !ok {
			return nil, ErrCategoryNotFound
		}
	}
	a.CategoryID = req.CategoryID
	a.Title = strings.TrimSpace(req.Title)
	a.Description = strings.TrimSpace(req.Description)
	a.Price = req.Price
	a.Currency = strings.ToUpper(strings.TrimSpace(req.Currency))
	if a.Currency == "" {
		a.Currency = "INR"
	}
	a.ImageURL = strings.TrimSpace(req.ImageURL)
	a.Stock = req.Stock
	a.IsActive = req.IsActive
	if err := s.repo.UpdateArtwork(ctx, a); err != nil {
		return nil, fmt.Errorf("update artwork: %w", err)
	}
	return a, nil
}

func (s *ArtworkService) DeleteArtwork(ctx context.Context, userID, artworkID uuid.UUID) error {
	if userID == uuid.Nil {
		return ErrForbidden
	}
	a, err := s.repo.GetArtwork(ctx, artworkID)
	if err != nil {
		return fmt.Errorf("get artwork: %w", err)
	}
	if a == nil {
		return ErrArtworkNotFound
	}
	if err := s.verifyOwnership(ctx, userID, a.ArtistID); err != nil {
		return err
	}
	if err := s.repo.DeleteArtwork(ctx, artworkID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrArtworkNotFound
		}
		return fmt.Errorf("delete artwork: %w", err)
	}
	return nil
}
