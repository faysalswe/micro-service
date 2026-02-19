package rest

import (
	"github.com/faysal/micro-service/inventory-service/internal/service"
	"github.com/gin-gonic/gin"
)

type InventoryHandler struct {
	svc service.InventoryService
}

func NewInventoryHandler(svc service.InventoryService) *InventoryHandler {
	return &InventoryHandler{svc: svc}
}

func (h *InventoryHandler) SetupRoutes(r *gin.Engine) {
	r.GET("/health", h.Health)
	r.GET("/api/inventory", h.ListProducts)
	r.GET("/api/inventory/:id", h.GetStock)
	r.POST("/api/inventory/reserve", h.Reserve)

	// Admin routes
	r.POST("/api/inventory", h.CreateProduct)
	r.PUT("/api/inventory/:id", h.UpdateProduct)
	r.DELETE("/api/inventory/:id", h.DeleteProduct)
}

func (h *InventoryHandler) Health(c *gin.Context) {
	c.JSON(200, gin.H{"status": "UP"})
}

func (h *InventoryHandler) ListProducts(c *gin.Context) {
	products, err := h.svc.ListProducts(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, products)
}

func (h *InventoryHandler) GetStock(c *gin.Context) {
	id := c.Param("id")
	stock, err := h.svc.GetStock(c.Request.Context(), id)
	if err != nil {
		c.JSON(404, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(200, gin.H{"productID": id, "quantity": stock})
}

func (h *InventoryHandler) CreateProduct(c *gin.Context) {
	var req struct {
		ProductID string  `json:"productID"`
		Name      string  `json:"name"`
		Price     float64 `json:"price"`
		Quantity  int32   `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	success, msg, err := h.svc.CreateProduct(c.Request.Context(), req.ProductID, req.Name, req.Price, req.Quantity)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"success": success, "message": msg})
}

func (h *InventoryHandler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     string  `json:"name"`
		Price    float64 `json:"price"`
		Quantity int32   `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	success, msg, err := h.svc.UpdateProduct(c.Request.Context(), id, req.Name, req.Price, req.Quantity)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": success, "message": msg})
}

func (h *InventoryHandler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	success, msg, err := h.svc.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": success, "message": msg})
}

func (h *InventoryHandler) Reserve(c *gin.Context) {
	var req struct {
		OrderID   string `json:"orderId"`
		ProductID string `json:"productId"`
		Quantity  int32  `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	success, msg, err := h.svc.Reserve(c.Request.Context(), req.OrderID, req.ProductID, req.Quantity)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"success": success, "message": msg})
}
