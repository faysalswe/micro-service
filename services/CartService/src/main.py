import uvicorn
import grpc
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from redis import asyncio as aioredis
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource

try:
    from .generated.orders.v1 import orders_pb2, orders_pb2_grpc
    from .constants.config import CONFIG, INTERNAL_CONSTANTS
except ImportError:
    from generated.orders.v1 import orders_pb2, orders_pb2_grpc
    from constants.config import CONFIG, INTERNAL_CONSTANTS

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
redis_client: aioredis.Redis = None

@app.on_event("startup")
async def startup_event():
    global redis_client
    try:
        redis_client = aioredis.from_url(CONFIG["REDIS_URL"], decode_responses=True)
        await redis_client.ping()
        print(f"[OBSERVABILITY] ✅ Unified OTLP and Redis Enabled for {CONFIG['SERVICE_NAME']}")
    except Exception as e:
        print(f"[ERROR] Redis connection failed: {e}")

@app.get("/health")
async def health():
    if not redis_client:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "error": "Redis not initialized"})
    try:
        await redis_client.ping()
        return {"status": "healthy", "service": CONFIG["SERVICE_NAME"]}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "error": str(e)})

@app.post("/api/cart/{user_id}/items")
async def add_item(user_id: str, product_id: str = Query(...), quantity: int = Query(...)):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis client not initialized")
    
    cart_key = f"cart:{user_id}"
    try:
        await redis_client.hincrby(cart_key, product_id, quantity)
        await redis_client.expire(cart_key, INTERNAL_CONSTANTS["SESSION_TTL"])
        return {
            "message": "Item added to cart", 
            "user_id": user_id, 
            "product_id": product_id, 
            "quantity": quantity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")

@app.get("/api/cart/{user_id}")
async def get_cart(user_id: str):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis client not initialized")
    
    cart_key = f"cart:{user_id}"
    items = await redis_client.hgetall(cart_key)
    return {"user_id": user_id, "items": items}

@app.delete("/api/cart/{user_id}")
async def clear_cart(user_id: str):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis client not initialized")
        
    cart_key = f"cart:{user_id}"
    await redis_client.delete(cart_key)
    return {"message": "Cart cleared", "user_id": user_id}

@app.post("/api/cart/{user_id}/checkout")
async def checkout(user_id: str):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis client not initialized")

    cart_key = f"cart:{user_id}"
    items = await redis_client.hgetall(cart_key)
    
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_items = []
    for product_id, quantity in items.items():
        order_items.append(orders_pb2.OrderItem(
            product_id=product_id,
            quantity=int(quantity)
        ))

    try:
        async with grpc.aio.insecure_channel(CONFIG["ORDER_SERVICE_URL"]) as channel:
            stub = orders_pb2_grpc.OrderServiceStub(channel)
            
            request = orders_pb2.CreateOrderRequest(
                user_id=user_id,
                items=order_items,
                total_amount=0.0
            )
            
            response = await stub.CreateOrder(request)
            await redis_client.delete(cart_key)
            
            return {
                "message": "Order created successfully",
                "order_id": response.order_id,
                "status": response.status
            }
    except grpc.RpcError as e:
        raise HTTPException(status_code=500, detail=f"OrderService gRPC failed: {e.details()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("REST_PORT", 5014)))
    uvicorn.run(app, host="0.0.0.0", port=port)
