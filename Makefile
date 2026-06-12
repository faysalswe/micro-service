COMPOSE_INFRA    = platform/cluster/compose/docker-compose.infra.yaml
COMPOSE_SERVICES = platform/cluster/compose/docker-compose.debug.yaml

# Pinned Python for Cart/Pdf services — pydantic-core has no wheels for >3.13.
PYTHON ?= python3.13

.PHONY: help \
        env \
        infra-up infra-down kong-local kong-docker \
        services-up services-down \
        run-payment run-inventory run-order run-identity run-cart run-pdf \
        run-storefront run-back-office \
        setup-cart setup-pdf setup-python \
        secrets deploy-infra deploy-services deploy-umbrella deploy-kind-all deploy-k3d-all \
        logs-payment logs-inventory logs-order logs-identity logs-cart logs-pdf

# ── Default ────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  Local dev"
	@echo "    make env               Print command to load root .env into your shell"
	@echo "    eval \"\$$(make env)\"     Load root .env into current shell session"
	@echo "    make run-payment       Run PaymentService locally"
	@echo "    make run-inventory     Run InventoryService locally"
	@echo "    make run-order         Run OrderService locally"
	@echo "    make run-identity      Run IdentityService locally"
	@echo "    make run-cart          Run CartService locally"
	@echo "    make run-pdf           Run PdfService locally"
	@echo "    make run-storefront    Run Storefront (React) dev server"
	@echo "    make run-back-office   Run Back-Office (Angular) dev server"
	@echo "    make setup-python      Create venvs + install deps for Cart/Pdf services"
	@echo ""
	@echo "  Docker Compose"
	@echo "    make infra-up          Start all infrastructure (DBs, Redis, MinIO, Kong, observability)"
	@echo "    make kong-local        Switch Kong to local mode  (no infra restart)"
	@echo "    make kong-docker       Switch Kong to Docker mode (no infra restart)"
	@echo "    make infra-down        Stop infrastructure containers"
	@echo "    make services-up       Start all services (debug mode)"
	@echo "    make services-down     Stop all service containers"
	@echo ""
	@echo "  Kubernetes"
	@echo "    make secrets           Create K8s secrets from root .env"
	@echo "    make deploy-infra      Deploy infra Helm charts"
	@echo "    make deploy-services   Deploy service Helm charts"
	@echo "    make deploy-umbrella   Deploy everything via umbrella Helm chart"
	@echo "    make deploy-kind-all   Deploy everything to a local kind cluster"
	@echo "    make deploy-k3d-all    Deploy everything to a local k3d cluster"
	@echo ""
	@echo "  Logs (Docker)"
	@echo "    make logs-payment      Tail PaymentService logs"
	@echo "    make logs-inventory    Tail InventoryService logs"
	@echo "    make logs-order        Tail OrderService logs"
	@echo "    make logs-identity     Tail IdentityService logs"
	@echo "    make logs-cart         Tail CartService logs"
	@echo "    make logs-pdf          Tail PdfService logs"
	@echo ""

# ── Local dev ──────────────────────────────────────────────────────────────────

env:
	@echo "set -a && source $(CURDIR)/.env && set +a"

run-payment:
	cd services/PaymentService && set -a && source ../../.env && set +a && ts-node src/server.ts

run-inventory:
	cd services/InventoryService && set -a && source ../../.env && set +a && go run ./cmd/server

run-order:
	cd services/OrderService && set -a && source ../../.env && set +a && dotnet run

run-identity:
	cd services/IdentityService && set -a && source ../../.env && set +a && dotnet run

run-cart: setup-cart
	cd services/CartService && set -a && source ../../.env && set +a && PYTHONPATH=src:src/generated .venv/bin/python src/main.py

run-pdf: setup-pdf
	cd services/PdfService && set -a && source ../../.env && set +a && .venv/bin/python src/main.py

setup-cart:
	@cd services/CartService && \
	  if [ ! -x .venv/bin/python ]; then $(PYTHON) -m venv .venv; fi && \
	  .venv/bin/pip install --quiet --upgrade pip && \
	  .venv/bin/pip install --quiet -r requirements.txt

setup-pdf:
	@if ! pkg-config --exists cairo pango gdk-pixbuf-2.0; then \
	  echo "PdfService needs native libs for weasyprint."; \
	  echo "Run: brew install cairo pango gdk-pixbuf libffi"; \
	  exit 1; \
	fi
	@cd services/PdfService && \
	  if [ ! -x .venv/bin/python ]; then $(PYTHON) -m venv .venv; fi && \
	  .venv/bin/pip install --quiet --upgrade pip && \
	  .venv/bin/pip install --quiet -r requirements.txt

setup-python: setup-cart setup-pdf

run-storefront:
	cd apps/storefront && npm run dev

run-back-office:
	cd apps/back-office && npm start

# ── Docker Compose ─────────────────────────────────────────────────────────────

infra-up:
	docker compose -f $(COMPOSE_INFRA) --env-file .env --env-file .env.docker up -d

kong-local:
	KONG_CONFIG=kong.local.yml docker compose -f $(COMPOSE_INFRA) --env-file .env --env-file .env.docker up -d --no-deps --force-recreate kong

kong-docker:
	KONG_CONFIG=kong.yml docker compose -f $(COMPOSE_INFRA) --env-file .env --env-file .env.docker up -d --no-deps --force-recreate kong

infra-down:
	docker compose -f $(COMPOSE_INFRA) --env-file .env --env-file .env.docker down

services-up:
	docker compose -f $(COMPOSE_SERVICES) --env-file .env --env-file .env.docker up -d

services-down:
	docker compose -f $(COMPOSE_SERVICES) --env-file .env --env-file .env.docker down

# ── Kubernetes ─────────────────────────────────────────────────────────────────

secrets:
	./platform/scripts/create-secrets.sh

deploy-infra:
	./platform/scripts/deploy-infra.sh

deploy-services:
	./platform/scripts/deploy-services.sh

deploy-umbrella:
	./platform/scripts/deploy-umbrella.sh

deploy-kind-all:
	./platform/cluster/kind/setup-kind.sh
	./platform/scripts/deploy-umbrella.sh

deploy-k3d-all:
	./platform/cluster/k3d/setup-k3d.sh
	./platform/scripts/deploy-umbrella.sh

# ── Logs ───────────────────────────────────────────────────────────────────────

logs-payment:
	docker logs -f payment-service

logs-inventory:
	docker logs -f inventory-service

logs-order:
	docker logs -f order-service

logs-identity:
	docker logs -f identity-service

logs-cart:
	docker logs -f cart-service

logs-pdf:
	docker logs -f pdf-service
