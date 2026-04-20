package rest

import (
	"context"
	"inventory-service/internal/service"
	"net/http"
	"github.com/danielgtaylor/huma/v2"
)

func RegisterAdminHandlers(api huma.API, svc service.InventoryService) {
	
	// Create a new product
	huma.Register(api, huma.Operation{
		OperationID: "create-product",
		Method:      http.MethodPost,
		Path:        "/api/inventory/active-products",
		Summary:     "Create new product",
		Tags:        []string{"Admin"},
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, input *CreateProductRequest) (*SuccessResponse, error) {
		hctx := ctx.(huma.Context)
		if err := ValidateAdminToken(hctx); err != nil {
			return nil, err
		}
		success, msg, err := svc.CreateProduct(ctx, input.Body.ProductID, input.Body.Name, input.Body.Price, input.Body.Quantity)
		if err != nil {
			return nil, huma.Error500InternalServerError(err.Error())
		}
		return &SuccessResponse{
			Body: SuccessBody{Success: success, Message: msg},
		}, nil
	})

	// Update an existing product
	huma.Register(api, huma.Operation{
		OperationID: "update-product",
		Method:      http.MethodPut,
		Path:        "/api/inventory/active-products/{id}",
		Summary:     "Update product",
		Tags:        []string{"Admin"},
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, input *UpdateProductRequest) (*SuccessResponse, error) {
		hctx := ctx.(huma.Context)
		if err := ValidateAdminToken(hctx); err != nil {
			return nil, err
		}
		success, msg, err := svc.UpdateProduct(ctx, input.ID, input.Body.Name, input.Body.Price, input.Body.Quantity)
		if err != nil {
			return nil, huma.Error500InternalServerError(err.Error())
		}
		return &SuccessResponse{
			Body: SuccessBody{Success: success, Message: msg},
		}, nil
	})

	// Delete a product
	huma.Register(api, huma.Operation{
		OperationID: "delete-product",
		Method:      http.MethodDelete,
		Path:        "/api/inventory/active-products/{id}",
		Summary:     "Delete product",
		Tags:        []string{"Admin"},
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, input *ProductIDParam) (*SuccessResponse, error) {
		hctx := ctx.(huma.Context)
		if err := ValidateAdminToken(hctx); err != nil {
			return nil, err
		}
		success, msg, err := svc.DeleteProduct(ctx, input.ID)
		if err != nil {
			return nil, huma.Error500InternalServerError(err.Error())
		}
		return &SuccessResponse{
			Body: SuccessBody{Success: success, Message: msg},
		}, nil
	})
}
