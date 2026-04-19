import uvicorn
import grpc
from fastapi import FastAPI
from redis import asyncio as aioredis
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource

from .generated.orders.v1 import orders_pb2, orders_pb2_grpc
from .constants.config import CONFIG, INTERNAL_CONSTANTS

app = FastAPI(title=CONFIG["SERVICE_NAME"], version=INTERNAL_CONSTANTS["VERSION"])

# --- OpenTelemetry Setup ---
resource = Resource(attributes={
    SERVICE_NAME: CONFIG["SERVICE_NAME"]
})

provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=CONFIG["OTEL_EXPORTER_OTLP_ENDPOINT"], insecure=True))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

FastAPIInstrumentor.instrument_app(app)

# --- Redis Setup ---
redis_client = None

@app.on_event("startup")
async def startup_event():
    global redis_client
    redis_client = aioredis.from_url(CONFIG["REDIS_URL"], decode_responses=True)
    print(f"[OBSERVABILITY] ✅ Unified OTLP Enabled for {CONFIG['SERVICE_NAME']}")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": CONFIG["SERVICE_NAME"]}

# Placeholder for Cart Routes
@app.post("/api/cart/{user_id}/items")
async def add_item(user_id: str, product_id: str, quantity: int):
    # Using Redis Hash to store cart items: cart:user_123 -> {product_abc: 2}
    cart_key = f"cart:{user_id}"
    await redis_client.hincrby(cart_key, product_id, quantity)
    await redis_client.expire(cart_key, INTERNAL_CONSTANTS["SESSION_TTL"])
    return {"message": "Item added to cart", "user_id": user_id}

@app.get("/api/cart/{user_id}")
async def get_cart(user_id: str):
    cart_key = f"cart:{user_id}"
    items = await redis_client.hgetall(cart_key)
    return {"user_id": user_id, "items": items}

@app.delete("/api/cart/{user_id}")
async def clear_cart(user_id: str):
    cart_key = f"cart:{user_id}"
    await redis_client.delete(cart_key)
    return {"message": "Cart cleared", "user_id": user_id}

@app.post("/api/cart/{user_id}/checkout")
async def checkout(user_id: str):
    # 1. Get cart items from Redis
    cart_key = f"cart:{user_id}"
    items = await redis_client.hgetall(cart_key)
    
    if not items:
        return {"error": "Cart is empty"}, 400

    # 2. Prepare gRPC Request
    order_items = []
    for product_id, quantity in items.items():
        order_items.append(orders_pb2.OrderItem(
            product_id=product_id,
            quantity=int(quantity)
        ))

    # 3. Call OrderService via gRPC
    # Note: Using grpc.aio for async support
    async with grpc.aio.insecure_channel(CONFIG["ORDER_SERVICE_URL"]) as channel:
        stub = orders_pb2_grpc.OrderServiceStub(channel)
        
        request = orders_pb2.CreateOrderRequest(
            user_id=user_id,
            items=order_items,
            total_amount=0.0 # OrderService will recalculate
        )
        
        try:
            response = await stub.CreateOrder(request)
            
            # 4. Clear cart on success
            await redis_client.delete(cart_key)
            
            return {
                "message": "Order created successfully",
                "order_id": response.order_id,
                "status": response.status
            }
        except grpc.RpcError as e:
            return {"error": f"OrderService failed: {e.details()}"}, 500

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5014)
