package rest

import (
	"inventory-service/internal/service"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humagin"
	"github.com/gin-gonic/gin"
)

type InventoryHandler struct {
	svc service.InventoryService
}

func NewInventoryHandler(svc service.InventoryService) *InventoryHandler {
	return &InventoryHandler{svc: svc}
}

func (h *InventoryHandler) SetupRoutes(r *gin.Engine) {
	// 1. Initialize Huma with the main Gin engine
	config := huma.DefaultConfig("Inventory Service API", "1.0.0")
	// We disable Huma's default docs to use our own Scalar UI
	config.DocsPath = ""
	
	// Define Security Scheme for Docs
	config.Components.SecuritySchemes = map[string]*huma.SecurityScheme{
		"bearerAuth": {
			Type:         "http",
			Scheme:       "bearer",
			BearerFormat: "JWT",
		},
	}
	
	api := humagin.New(r, config)

	// 2. Register all handlers
	RegisterHealthHandler(api)
	RegisterInventoryHandlers(api, h.svc)
	RegisterSystemHandlers(api, h.svc)
	RegisterAdminHandlers(api, h.svc)

	// 3. Add Scalar UI route manually to Gin
	r.GET("/docs", h.ScalarUI)
}

func (h *InventoryHandler) ScalarUI(c *gin.Context) {
	html := `
<!doctype html>
<html>
  <head>
    <title>Inventory Service API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
