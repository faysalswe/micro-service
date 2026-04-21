import uvicorn
import grpc
import json
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
async def add_item(user_id: str, product_id: str = Query(...), quantity: int = Query(...), price: float = Query(...)):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis client not initialized")
    
    cart_key = f"cart:{user_id}"
    try:
        # Fetch existing item to accumulate quantity
        existing_data = await redis_client.hget(cart_key, product_id)
        if existing_data:
            item_info = json.loads(existing_data)
            new_quantity = item_info.get("quantity", 0) + quantity
        else:
            new_quantity = quantity
            
        # Store as JSON string
        item_data = json.dumps({
            "quantity": new_quantity,
            "price": price
        })
        
        await redis_client.hset(cart_key, product_id, item_data)
        await redis_client.expire(cart_key, INTERNAL_CONSTANTS["SESSION_TTL"])
        return {
            "message": "Item added to cart", 
            "user_id": user_id, 
            "product_id": product_id, 
            "quantity": new_quantity,
            "price": price
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")

@app.get("/api/cart/{user_id}")
async def get_cart(user_id: str):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis client not initialized")
    
    cart_key = f"cart:{user_id}"
    items = await redis_client.hgetall(cart_key)
    
    # Extract only quantities for the frontend
    processed_items = {}
    for pid, val in items.items():
        try:
            item_info = json.loads(val)
            processed_items[pid] = str(item_info.get("quantity", 0))
        except (json.JSONDecodeError, TypeError):
            processed_items[pid] = val # Old format
            
    return {"user_id": user_id, "items": processed_items}

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
    total_amount = 0.0
    
    for product_id, item_json in items.items():
        try:
            item_info = json.loads(item_json)
            qty = int(item_info.get("quantity", 0))
            price = float(item_info.get("price", 0.0))
            
            order_items.append(orders_pb2.OrderItem(
                product_id=product_id,
                quantity=qty,
                unit_price=price
            ))
            total_amount += (qty * price)
        except (json.JSONDecodeError, TypeError, ValueError):
            # Fallback for old data format
            order_items.append(orders_pb2.OrderItem(
                product_id=product_id,
                quantity=int(item_json),
                unit_price=0.0
            ))

    try:
        async with grpc.aio.insecure_channel(CONFIG["ORDER_SERVICE_URL"]) as channel:
            stub = orders_pb2_grpc.OrderServiceStub(channel)
            
            request = orders_pb2.CreateOrderRequest(
                user_id=user_id,
                items=order_items,
                total_amount=total_amount
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
