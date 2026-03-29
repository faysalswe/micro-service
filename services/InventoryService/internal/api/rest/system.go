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
}
