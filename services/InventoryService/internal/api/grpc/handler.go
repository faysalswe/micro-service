package grpc

import (
	"context"
	"inventory-service/internal/models"
	"inventory-service/internal/service"
	inventoryv1 "inventory-service/proto/inventory/v1"
)

type InventoryHandler struct {
	inventoryv1.UnimplementedInventoryServiceServer
	service service.InventoryService
}

func NewInventoryHandler(svc service.InventoryService) *InventoryHandler {
	return &InventoryHandler{service: svc}
}

func (s *InventoryHandler) ReserveStock(ctx context.Context, req *inventoryv1.ReserveStockRequest) (*inventoryv1.ReserveStockResponse, error) {
	success, msg, err := s.service.Reserve(ctx, req.OrderId, req.ProductId, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.ReserveStockResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) ReleaseStock(ctx context.Context, req *inventoryv1.ReleaseStockRequest) (*inventoryv1.ReleaseStockResponse, error) {
	success, msg, err := s.service.Release(ctx, req.OrderId, req.ProductId, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.ReleaseStockResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) BatchReserveStock(ctx context.Context, req *inventoryv1.BatchReserveStockRequest) (*inventoryv1.BatchReserveStockResponse, error) {
	var items []models.BatchItem
	for _, item := range req.Items {
		items = append(items, models.BatchItem{
			ProductID: item.ProductId,
			Quantity:  item.Quantity,
		})
	}

	success, msg, err := s.service.BatchReserve(ctx, req.OrderId, items)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.BatchReserveStockResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) BatchReleaseStock(ctx context.Context, req *inventoryv1.BatchReleaseStockRequest) (*inventoryv1.BatchReleaseStockResponse, error) {
	var items []models.BatchItem
	for _, item := range req.Items {
		items = append(items, models.BatchItem{
			ProductID: item.ProductId,
			Quantity:  item.Quantity,
		})
	}

	success, msg, err := s.service.BatchRelease(ctx, req.OrderId, items)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.BatchReleaseStockResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) GetStock(ctx context.Context, req *inventoryv1.GetStockRequest) (*inventoryv1.GetStockResponse, error) {
	quantity, err := s.service.GetStock(ctx, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.GetStockResponse{ProductId: req.ProductId, Quantity: quantity}, nil
}

func (s *InventoryHandler) ListProducts(ctx context.Context, req *inventoryv1.ListProductsRequest) (*inventoryv1.ListProductsResponse, error) {
	products, err := s.service.ListProducts(ctx)
	if err != nil {
		return nil, err
	}

	var protoProducts []*inventoryv1.ProductInfo
	for _, p := range products {
		protoProducts = append(protoProducts, &inventoryv1.ProductInfo{
			ProductId: p.ProductID,
			Name:      p.Name,
			Price:     p.Price,
			Quantity:  p.Quantity,
		})
	}

	return &inventoryv1.ListProductsResponse{Products: protoProducts}, nil
}

func (s *InventoryHandler) CreateProduct(ctx context.Context, req *inventoryv1.CreateProductRequest) (*inventoryv1.CreateProductResponse, error) {
	success, msg, err := s.service.CreateProduct(ctx, req.ProductId, req.Name, req.Price, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.CreateProductResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) UpdateProduct(ctx context.Context, req *inventoryv1.UpdateProductRequest) (*inventoryv1.UpdateProductResponse, error) {
	success, msg, err := s.service.UpdateProduct(ctx, req.ProductId, req.Name, req.Price, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.UpdateProductResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) DeleteProduct(ctx context.Context, req *inventoryv1.DeleteProductRequest) (*inventoryv1.DeleteProductResponse, error) {
	success, msg, err := s.service.DeleteProduct(ctx, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.DeleteProductResponse{Success: success, Message: msg}, nil
}

func (s *InventoryHandler) RestockItems(ctx context.Context, req *inventoryv1.RestockItemsRequest) (*inventoryv1.RestockItemsResponse, error) {
	success, msg, err := s.service.RestockItems(ctx, req.ProductId, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &inventoryv1.RestockItemsResponse{Success: success, Message: msg}, nil
}
