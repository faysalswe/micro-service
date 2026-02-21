package rest

import (
	"context"
	"github.com/danielgtaylor/huma/v2"
)

func RegisterHealthHandler(api huma.API) {
	huma.Get(api, "/health", func(ctx context.Context, input *struct{}) (*struct{ Body map[string]string }, error) {
		return &struct{ Body map[string]string }{Body: map[string]string{"status": "UP"}}, nil
	})
}
