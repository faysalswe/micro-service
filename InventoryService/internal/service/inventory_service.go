package service

import (
	"context"
	"github.com/faysal/micro-service/inventory-service/internal/models"
	"github.com/faysal/micro-service/inventory-service/internal/repository"
)

type InventoryService interface {
	Reserve(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error)
	Release(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error)
	GetStock(ctx context.Context, productID string) (int32, error)
	ListProducts(ctx context.Context) ([]models.ProductStock, error)
}

type inventoryService struct {
	repo repository.InventoryRepository
}

func NewInventoryService(repo repository.InventoryRepository) InventoryService {
	return &inventoryService{repo: repo}
}

func (s *inventoryService) ListProducts(ctx context.Context) ([]models.ProductStock, error) {
	return s.repo.ListProducts(ctx)
}

func (s *inventoryService) Reserve(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error) {
	err := s.repo.ReserveStock(ctx, orderID, productID, quantity)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Stock reserved successfully", nil
}

func (s *inventoryService) Release(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error) {
	err := s.repo.ReleaseStock(ctx, orderID, productID, quantity)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Stock released successfully", nil
}

func (s *inventoryService) GetStock(ctx context.Context, productID string) (int32, error) {
	return s.repo.GetStock(ctx, productID)
}
