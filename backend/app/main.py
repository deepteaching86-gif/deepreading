"""
Main FastAPI Application Entry Point
====================================

This is the main entry point for the backend API server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Create FastAPI app
app = FastAPI(
    title="Literacy Test API",
    description="Backend API for English Adaptive Testing System",
    version="1.0.0"
)

# CORS middleware - Allow all origins for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(english_test_router, prefix="/api/english-test", tags=["English Test"])
app.include_router(admin_router, prefix="/api/admin/english-test", tags=["Admin English Test"])
app.include_router(ai_router, prefix="/api/admin/ai", tags=["Admin AI"])

# Include Vision router if available
if vision_available and vision_router:
    app.include_router(vision_router, prefix="/api/vision", tags=["Vision Tracking"])

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

