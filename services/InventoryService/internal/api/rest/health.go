package rest

import (
	"context"
	"os"
	"github.com/danielgtaylor/huma/v2"
)

func RegisterHealthHandler(api huma.API) {
	huma.Get(api, "/health", func(ctx context.Context, input *struct{}) (*struct{ Body map[string]string }, error) {
		appVersion := os.Getenv("APP_VERSION")
		if appVersion == "" {
			appVersion = "1.0.0-dev"
		}
		return &struct{ Body map[string]string }{
			Body: map[string]string{
				"status":  "UP",
				"service": "InventoryService",
				"version": appVersion,
			},
		}, nil
	})
}
