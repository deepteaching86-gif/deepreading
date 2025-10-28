"""
Admin AI Router
===============

FastAPI routes for AI-powered test item generation and management.
This provides admin-only endpoints for:
- Generating test items using Gemini AI
- Batch generation with specifications
- Item validation and quality assurance
- Item regeneration for flagged items
- Viewing AI generation metadata
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

from app.ai.gemini_client import GeminiClient
from app.ai.item_generation_service import ItemGenerationService

# Load environment variables
load_dotenv()

# Initialize router
router = APIRouter()

# Initialize AI services (lazy loading to avoid startup errors)
_gemini_client = None
_item_generation_service = None


def get_gemini_client() -> GeminiClient:
    """Get or initialize Gemini client"""
    global _gemini_client
    if _gemini_client is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GOOGLE_API_KEY not configured. Please set the environment variable."
            )
        _gemini_client = GeminiClient(api_key=api_key)
    return _gemini_client


def get_item_generation_service() -> ItemGenerationService:
    """Get or initialize Item Generation Service"""
    global _item_generation_service
    if _item_generation_service is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise HTTPException(
                status_code=500,
                detail="DATABASE_URL not configured. Please set the environment variable."
            )
        client = get_gemini_client()
        _item_generation_service = ItemGenerationService(client, database_url)
    return _item_generation_service


# ===== Request/Response Models =====

class GenerateItemRequest(BaseModel):
    """Request model for generating a single item"""
    domain: str = Field(..., description="Domain (vocabulary, grammar, reading)")
    difficulty: float = Field(..., description="IRT difficulty parameter (b), typically -3 to 3")
    discrimination: float = Field(..., description="IRT discrimination parameter (a), typically 0.5 to 2.5")
    skill_tag: str = Field(..., description="Specific skill being tested")
    cefr_level: str = Field(..., description="CEFR level (A1, A2, B1, B2, C1, C2)")
    stage: int = Field(..., description="MST stage (1, 2, 3)")
    panel: str = Field(..., description="MST panel (Stage 1: '1A', Stage 2/3: '2A', '2B', '2C', '3A', '3B', '3C')")
    form_id: int = Field(default=1, description="Form ID")
    text_type: Optional[str] = Field(None, description="Text type for reading items")
    constraints: Optional[Dict[str, Any]] = Field(None, description="Additional constraints")
    auto_approve: bool = Field(default=False, description="Skip validation and auto-approve")

    class Config:
        json_schema_extra = {
            "example": {
                "domain": "vocabulary",
                "difficulty": -0.5,
                "discrimination": 1.2,
                "skill_tag": "synonyms",
                "cefr_level": "B1",
                "stage": 2,
                "panel": "2B",
                "form_id": 1,
                "auto_approve": False
            }
        }


class BatchGenerateRequest(BaseModel):
    """Request model for batch item generation"""
    specifications: List[Dict[str, Any]] = Field(
        ...,
        description="List of item specifications (same format as GenerateItemRequest)"
    )
    auto_approve: bool = Field(default=False, description="Skip validation for all items")

    class Config:
        json_schema_extra = {
            "example": {
                "specifications": [
                    {
                        "domain": "vocabulary",
                        "difficulty": -0.5,
                        "discrimination": 1.2,
                        "skill_tag": "synonyms",
                        "cefr_level": "B1",
                        "stage": 2,
                        "panel": "2B"
                    },
                    {
                        "domain": "grammar",
                        "difficulty": 0.3,
                        "discrimination": 1.5,
                        "skill_tag": "verb_tenses",
                        "cefr_level": "B2",
                        "stage": 2,
                        "panel": "2C"
                    }
                ],
                "auto_approve": False
            }
        }


class ValidateItemRequest(BaseModel):
    """Request model for validating an existing item"""
    item_id: int = Field(..., description="ID of the item to validate")


class RegenerateItemRequest(BaseModel):
    """Request model for regenerating a flagged item"""
    item_id: int = Field(..., description="ID of the item to regenerate")
    preserve_parameters: bool = Field(
        default=True,
        description="Keep original IRT parameters and specifications"
    )


# ===== API Endpoints =====

@router.post("/generate-item", response_model=Dict[str, Any])
async def generate_item(request: GenerateItemRequest):
    """
    Generate a single test item using Gemini AI.

    This endpoint:
    1. Generates item content using Gemini API
    2. Optionally validates quality (unless auto_approve=True)
    3. Saves to database with metadata
    4. Returns complete item with generation details
    """
    try:
        service = get_item_generation_service()

        result = service.generate_and_save_item(
            domain=request.domain,
            difficulty=request.difficulty,
            discrimination=request.discrimination,
            skill_tag=request.skill_tag,
            cefr_level=request.cefr_level,
            stage=request.stage,
            panel=request.panel,
            form_id=request.form_id,
            text_type=request.text_type,
            constraints=request.constraints,
            auto_approve=request.auto_approve
        )

        return {
            "success": True,
            "message": "Item generated successfully",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Item generation failed: {str(e)}")


@router.post("/generate-batch", response_model=Dict[str, Any])
async def generate_batch(request: BatchGenerateRequest):
    """
    Generate multiple test items in batch.

    This endpoint:
    1. Processes multiple item specifications sequentially
    2. Continues on individual failures
    3. Returns summary with successful and failed items
    """
    try:
        service = get_item_generation_service()

        result = service.batch_generate_items(
            specifications=request.specifications,
            auto_approve=request.auto_approve
        )

        return {
            "success": True,
            "message": f"Batch generation completed: {result['successful']}/{result['total']} items",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch generation failed: {str(e)}")


@router.post("/validate-item", response_model=Dict[str, Any])
async def validate_item(request: ValidateItemRequest):
    """
    Validate an existing item using Gemini AI quality assurance.

    This endpoint:
    1. Retrieves item from database
    2. Runs AI quality validation
    3. Updates item status based on validation result
    4. Returns validation scores and recommendations
    """
    try:
        service = get_item_generation_service()

        result = service.validate_existing_item(item_id=request.item_id)

        return {
            "success": True,
            "message": "Item validated successfully",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Item validation failed: {str(e)}")


@router.post("/regenerate-item", response_model=Dict[str, Any])
async def regenerate_item(request: RegenerateItemRequest):
    """
    Regenerate a flagged item with improved quality.

    This endpoint:
    1. Retrieves original item and parameters
    2. Generates new content with same specifications (if preserve_parameters=True)
    3. Validates new content
    4. Updates database with new version
    """
    try:
        service = get_item_generation_service()

        result = service.regenerate_item(
            item_id=request.item_id,
            preserve_parameters=request.preserve_parameters
        )

        return {
            "success": True,
            "message": "Item regenerated successfully",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Item regeneration failed: {str(e)}")


@router.get("/ai-items", response_model=Dict[str, Any])
async def list_ai_items(
    limit: int = Query(default=50, ge=1, le=500, description="Number of items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    model_name: Optional[str] = Query(None, description="Filter by AI model name"),
    min_score: Optional[float] = Query(None, description="Minimum validation score")
):
    """
    List AI-generated items with metadata.

    This endpoint:
    1. Retrieves AI-generated items with pagination
    2. Optionally filters by model and validation score
    3. Returns items with generation parameters and validation results
    """
    try:
        service = get_item_generation_service()

        result = service.list_ai_generated_items(
            limit=limit,
            offset=offset,
            model_name=model_name,
            min_score=min_score
        )

        return {
            "success": True,
            "message": f"Retrieved {len(result['items'])} AI-generated items",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list AI items: {str(e)}")


@router.get("/ai-items/{item_id}", response_model=Dict[str, Any])
async def get_ai_item_details(item_id: int):
    """
    Get detailed AI metadata for a specific item.

    Returns:
    - Item content and IRT parameters
    - Generation parameters used
    - Validation results and scores
    - Generation timestamp and model info
    """
    try:
        service = get_item_generation_service()

        result = service.get_ai_item_details(item_id=item_id)

        if not result:
            raise HTTPException(status_code=404, detail="AI item metadata not found")

        return {
            "success": True,
            "message": "AI item details retrieved successfully",
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI item details: {str(e)}")


@router.get("/health", response_model=Dict[str, Any])
async def ai_health_check():
    """
    Health check for AI services.

    Verifies:
    - Gemini API key is configured
    - Database connection is available
    - AI client can be initialized
    """
    try:
        # Check API key
        api_key = os.getenv("GOOGLE_API_KEY")
        api_key_status = "configured" if api_key else "missing"

        # Check database URL
        db_url = os.getenv("DATABASE_URL")
        db_status = "configured" if db_url else "missing"

        # Try to initialize client (doesn't make API call)
        try:
            get_gemini_client()
            client_status = "initialized"
        except Exception as e:
            client_status = f"error: {str(e)}"

        overall_status = "healthy" if (api_key and db_url and client_status == "initialized") else "degraded"

        return {
            "success": True,
            "status": overall_status,
            "components": {
                "google_api_key": api_key_status,
                "database_url": db_status,
                "gemini_client": client_status
            }
        }

    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }
