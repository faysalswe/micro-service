import uvicorn
import boto3
import json
import logging
from fastapi import FastAPI, HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
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
import sys

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

def _set_bucket_public_policy(bucket_name):
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
    logger.info(f"Public read policy set for bucket: {bucket_name}")

def ensure_invoice_bucket():
    """Idempotent: head_bucket → create if missing → apply public-read policy.
    Called lazily on each PDF generation so cluster cold-starts can't leave us
    in a half-initialized state (race with MinIO readiness at app startup)."""
    bucket = INTERNAL_CONSTANTS["INVOICE_BUCKET"]
    try:
        s3_client.head_bucket(Bucket=bucket)
        return
    except s3_client.exceptions.ClientError:
        logger.info(f"Bucket missing, creating: {bucket}")
    s3_client.create_bucket(Bucket=bucket)
    _set_bucket_public_policy(bucket)

# --- PDF Generation Logic ---
template_env = Environment(loader=FileSystemLoader("src/templates"))

@app.get("/health")
async def health():
    return {"status": "healthy", "service": CONFIG["SERVICE_NAME"]}

@app.post("/api/pdf/generate/invoice")
async def generate_invoice(order_data: dict):
    logger.info(f"Generating invoice for Order ID: {order_data.get('order_id')}")
    try:
        ensure_invoice_bucket()

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
        logger.info(f"Invoice uploaded successfully: {file_name}")
        
        # 5. Return the URL (signed URL or public URL)
        download_url = f"{CONFIG['S3_ENDPOINT']}/{INTERNAL_CONSTANTS['INVOICE_BUCKET']}/{file_name}"
        
        return {
            "message": "PDF Generated",
            "order_id": order_data["order_id"],
            "download_url": download_url
        }
    except Exception as e:
        logger.error(f"Error generating/uploading PDF for Order {order_data.get('order_id')}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    _port_str = os.environ.get("REST_PORT")
    if not _port_str:
        logger.critical("Required environment variable 'REST_PORT' is not set")
        sys.exit(1)
    uvicorn.run(app, host="0.0.0.0", port=int(_port_str))
