import uvicorn
import boto3
import json
from fastapi import FastAPI, HTTPException
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from datetime import datetime
import io
import os

try:
    from .constants.config import CONFIG, INTERNAL_CONSTANTS
except ImportError:
    from constants.config import CONFIG, INTERNAL_CONSTANTS

app = FastAPI(title=CONFIG["SERVICE_NAME"], version=INTERNAL_CONSTANTS["VERSION"])

# --- OpenTelemetry Setup ---
resource = Resource(attributes={SERVICE_NAME: CONFIG["SERVICE_NAME"]})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=CONFIG["OTEL_EXPORTER_OTLP_ENDPOINT"], insecure=True))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
FastAPIInstrumentor.instrument_app(app)

# --- S3 / MinIO Setup ---
s3_client = boto3.client(
    's3',
    endpoint_url=CONFIG["S3_ENDPOINT"],
    aws_access_key_id=CONFIG["S3_ACCESS_KEY"],
    aws_secret_access_key=CONFIG["S3_SECRET_KEY"]
)

def set_bucket_public_policy(bucket_name):
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
            }
        ]
    }
    s3_client.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))

# Ensure bucket exists and is public
try:
    s3_client.create_bucket(Bucket=INTERNAL_CONSTANTS["INVOICE_BUCKET"])
    set_bucket_public_policy(INTERNAL_CONSTANTS["INVOICE_BUCKET"])
except Exception:
    # Try to set policy even if bucket creation fails (already exists)
    try:
        set_bucket_public_policy(INTERNAL_CONSTANTS["INVOICE_BUCKET"])
    except Exception:
        pass 

# --- PDF Generation Logic ---
template_env = Environment(loader=FileSystemLoader("src/templates"))

@app.get("/health")
async def health():
    return {"status": "healthy", "service": CONFIG["SERVICE_NAME"]}

@app.post("/api/pdf/generate/invoice")
async def generate_invoice(order_data: dict):
    try:
        # 1. Prepare data for template
        order_data["date"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        # 2. Render HTML
        template = template_env.get_template("invoice.html")
        html_content = template.render(order_data)
        
        # 3. Generate PDF in memory
        pdf_file = io.BytesIO()
        HTML(string=html_content).write_pdf(pdf_file)
        pdf_file.seek(0)
        
        # 4. Upload to MinIO
        file_name = f"invoice_{order_data['order_id']}.pdf"
        s3_client.upload_fileobj(
            pdf_file, 
            INTERNAL_CONSTANTS["INVOICE_BUCKET"], 
            file_name,
            ExtraArgs={'ContentType': 'application/pdf'}
        )
        
        # 5. Return the URL (signed URL or public URL)
        download_url = f"{CONFIG['S3_ENDPOINT']}/{INTERNAL_CONSTANTS['INVOICE_BUCKET']}/{file_name}"
        
        return {
            "message": "PDF Generated",
            "order_id": order_data["order_id"],
            "download_url": download_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", os.environ.get("REST_PORT", 5015)))
    uvicorn.run(app, host="0.0.0.0", port=port)
