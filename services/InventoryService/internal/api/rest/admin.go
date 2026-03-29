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
		Path:        "/api/inventory",
		Summary:     "Create new product",
		Tags:        []string{"Admin"},
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, input *CreateProductRequest) (*SuccessResponse, error) {
		// Huma v2: The context can be cast to huma.Context if needed, 
		// but Register handlers usually take huma.Context directly in some adapters.
		// Let's use the most reliable way for humagin.
		if err := ValidateAdminToken(ctx.(huma.Context)); err != nil {
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
		Path:        "/api/inventory/{id}",
		Summary:     "Update product",
		Tags:        []string{"Admin"},
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, input *UpdateProductRequest) (*SuccessResponse, error) {
		if err := ValidateAdminToken(ctx.(huma.Context)); err != nil {
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
		Path:        "/api/inventory/{id}",
		Summary:     "Delete product",
		Tags:        []string{"Admin"},
		Security:    []map[string][]string{{"bearerAuth": {}}},
	}, func(ctx context.Context, input *ProductIDParam) (*SuccessResponse, error) {
		if err := ValidateAdminToken(ctx.(huma.Context)); err != nil {
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
