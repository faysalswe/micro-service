package rest

import (
	"context"
	"inventory-service/internal/service"
	"net/http"
	"github.com/danielgtaylor/huma/v2"
)

func RegisterSystemHandlers(api huma.API, svc service.InventoryService) {
	// Reserve stock for an order
	huma.Register(api, huma.Operation{
		OperationID: "reserve-stock",
		Method:      http.MethodPost,
		Path:        "/api/inventory/reserve",
		Summary:     "Reserve stock",
		Tags:        []string{"System"},
	}, func(ctx context.Context, input *ReserveRequest) (*SuccessResponse, error) {
		success, msg, err := svc.Reserve(ctx, input.Body.OrderID, input.Body.ProductID, input.Body.Quantity)
		if err != nil {
			return nil, huma.Error500InternalServerError(err.Error())
		}
		return &SuccessResponse{
			Body: SuccessBody{Success: success, Message: msg},
		}, nil
	})

	// Restock items (conceptually a system operation for this simulation)
	huma.Register(api, huma.Operation{
		OperationID: "restock-items",
		Method:      http.MethodPost,
		Path:        "/api/inventory/restock",
		Summary:     "Restock items",
		Tags:        []string{"System"},
	}, func(ctx context.Context, input *RestockItemsRequest) (*SuccessResponse, error) {
		success, msg, err := svc.RestockItems(ctx, input.Body.ProductID, input.Body.Quantity)
		if err != nil {
			return nil, huma.Error500InternalServerError(err.Error())
		}
		return &SuccessResponse{
			Body: SuccessBody{Success: success, Message: msg},
		}, nil
	})
}
