.PHONY: proto run build tidy

PROTO_DIR=../protos
OUT_DIR=proto

proto:
	@mkdir -p $(OUT_DIR)
	cd ../.. && npm run proto:generate
	@echo "Generated gRPC code in $(OUT_DIR) using buf"

tidy:
	go mod tidy

run: tidy
	go run cmd/server/main.go

build: proto tidy
	go build -o inventory-service ./cmd/server/main.go
