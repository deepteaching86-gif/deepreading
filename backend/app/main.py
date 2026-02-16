"""
Main FastAPI Application Entry Point
====================================

This is the main entry point for the backend API server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routers
from app.english_test.router import router as english_test_router
from app.english_test.admin_routes import router as admin_router
from app.ai.router import router as ai_router

# Try to import Vision router (optional - requires MediaPipe/OpenCV)
vision_router = None
vision_available = False
try:
    from app.vision.router import router as vision_router
    vision_available = True
    print("✅ Vision tracking module loaded successfully")
except Exception as e:
    print(f"⚠️  Vision tracking module not available: {e}")
    print("   (MediaPipe/OpenCV dependencies may be missing)")

# Import Perception router (Visual Perception Test)
try:
    from app.perception.router import router as perception_router
    print("✅ Visual Perception Test module loaded")
except Exception as e:
    print(f"⚠️  Visual Perception Test not available: {e}")
    perception_router = None

# Create FastAPI app
app = FastAPI(
    title="Literacy Test API",
    description="Backend API for English Adaptive Testing System",
    version="1.0.0"
)

# CORS middleware - Restrict to known origins
ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_URL", "https://playful-cocada-a89755.netlify.app"),
    os.getenv("NODE_BACKEND_URL", "https://literacy-backend.onrender.com"),
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:3001",
]

# Also allow any Netlify preview deploys
def cors_origin_callback(origin: str) -> bool:
    if not origin:
        return True
    if origin in ALLOWED_ORIGINS:
        return True
    if ".netlify.app" in origin:
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
)


# Security headers middleware (added after CORS - order matters)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include routers
app.include_router(english_test_router, prefix="/api/english-test", tags=["English Test"])
app.include_router(admin_router, prefix="/api/admin/english-test", tags=["Admin English Test"])
app.include_router(ai_router, prefix="/api/admin/ai", tags=["Admin AI"])

# Include Vision router if available
if vision_available and vision_router:
    app.include_router(vision_router, prefix="/api/vision", tags=["Vision Tracking"])

# Include Perception router if available
if perception_router:
    app.include_router(perception_router, prefix="/api/perception", tags=["Visual Perception Test"])

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Literacy Test API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "literacy-test-api"
    }

