.PHONY: proto run build tidy

PROTO_DIR=../protos
OUT_DIR=proto

proto:
	@mkdir -p $(OUT_DIR)
	protoc --proto_path=$(PROTO_DIR) \
		--go_out=$(OUT_DIR) --go_opt=paths=source_relative \
		--go-grpc_out=$(OUT_DIR) --go-grpc_opt=paths=source_relative \
		$(PROTO_DIR)/inventory.proto
	@echo "Generated gRPC code in $(OUT_DIR)"

tidy:
	go mod tidy

run: tidy
	go run cmd/server/main.go

build: proto tidy
	go build -o inventory-service ./cmd/server/main.go
