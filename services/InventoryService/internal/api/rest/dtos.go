package rest

import "inventory-service/internal/models"

// --- Named Data Models (DTOs) ---
// These are reusable and act as your API "Contract"

type ProductInput struct {
	ProductID string  `json:"productID" example:"PROD-001" doc:"Unique ID for the product"`
	Name      string  `json:"name"      example:"Laptop"   doc:"Product name"`
	Price     float64 `json:"price"     example:"1200.00"  doc:"Unit price"`
	Quantity  int32   `json:"quantity"  example:"100"      doc:"Initial stock level"`
}

type ProductUpdateInput struct {
	Name     string  `json:"name"     example:"Gaming Laptop"`
	Price    float64 `json:"price"    example:"1500.00"`
	Quantity int32   `json:"quantity" example:"150"`
}

type ReserveInput struct {
	OrderID   string `json:"orderId"   example:"ORD-12345"`
	ProductID string `json:"productId" example:"PROD-001"`
	Quantity  int32  `json:"quantity"  example:"2"`
}

// --- Huma Request Wrappers ---
// These tell Huma WHERE the data comes from (Path vs Body)

type ProductIDParam struct {
	ID string `path:"id" example:"PROD-001" doc:"The unique identifier of the product"`
}

type CreateProductRequest struct {
	Body ProductInput
}

type UpdateProductRequest struct {
	ID   string `path:"id"`
	Body ProductUpdateInput
}

type ReserveRequest struct {
	Body ReserveInput
}

// --- Responses ---

type SuccessBody struct {
	Success bool   `json:"success" example:"true"`
	Message string `json:"message" example:"Operation completed successfully"`
}

type SuccessResponse struct {
	Body SuccessBody
}

type ListProductsResponse struct {
	Body []models.ProductStock
}

type StockBody struct {
	ProductID string `json:"productID" example:"PROD-001"`
	Quantity  int32  `json:"quantity"  example:"50"`
}

type StockResponse struct {
	Body StockBody
}
