"""
AI Module for English Test System
==================================

Provides AI-powered functionality including:
- Test item generation using Gemini API
- Quality assurance validation
- Personalized feedback generation
"""

from .gemini_client import GeminiClient
from .item_generation_service import ItemGenerationService

__all__ = [
    'GeminiClient',
    'ItemGenerationService'
]
