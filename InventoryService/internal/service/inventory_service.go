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
	CreateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error)
	UpdateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error)
	DeleteProduct(ctx context.Context, productID string) (bool, string, error)
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

func (s *inventoryService) CreateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error) {
	product := models.ProductStock{
		ProductID: productID,
		Name:      name,
		Price:     price,
		Quantity:  quantity,
	}
	err := s.repo.CreateProduct(ctx, product)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Product created successfully", nil
}

func (s *inventoryService) UpdateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error) {
	product := models.ProductStock{
		ProductID: productID,
		Name:      name,
		Price:     price,
		Quantity:  quantity,
	}
	err := s.repo.UpdateProduct(ctx, product)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Product updated successfully", nil
}

func (s *inventoryService) DeleteProduct(ctx context.Context, productID string) (bool, string, error) {
	err := s.repo.DeleteProduct(ctx, productID)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Product deleted successfully", nil
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
