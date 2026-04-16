package rest

import (
	"context"
	"inventory-service/internal/models"
	"inventory-service/internal/service"
	"net/http"
	"github.com/danielgtaylor/huma/v2"
)

func RegisterInventoryHandlers(api huma.API, svc service.InventoryService) {
	// List all products
	huma.Register(api, huma.Operation{
		OperationID: "list-products",
		Method:      http.MethodGet,
		Path:        "/api/inventory",
		Summary:     "List all products",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, input *struct{}) (*ListProductsResponse, error) {
		products, err := svc.ListProducts(ctx)
		if err != nil {
			return nil, huma.Error500InternalServerError(err.Error())
		}
		return &ListProductsResponse{Body: products}, nil
	})

	// Get a specific product by ID
	huma.Register(api, huma.Operation{
		OperationID: "get-product",
		Method:      http.MethodGet,
		Path:        "/api/inventory/{id}",
		Summary:     "Get product details",
		Tags:        []string{"Inventory"},
	}, func(ctx context.Context, input *ProductIDParam) (*struct{ Body models.ProductStock }, error) {
		product, err := svc.GetProduct(ctx, input.ID)
		if err != nil {
			return nil, huma.Error404NotFound("Product not found")
		}
		return &struct{ Body models.ProductStock }{Body: product}, nil
	})
}
