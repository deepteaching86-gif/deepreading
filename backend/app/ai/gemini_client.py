"""
Google Gemini API Client for AI-Powered Test Item Generation
=============================================================

Handles all interactions with Google's Gemini API for:
- Test item generation
- Quality assurance validation
- Content analysis

Updated: Using gemini-pro model
"""

import os
import json
from typing import Dict, List, Optional, Any
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)


class GeminiClient:
    """
    Client for interacting with Google Gemini API.

    Provides methods for generating test items, validating content,
    and analyzing educational materials using Gemini language models.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        """
        Initialize Gemini API client.

        Args:
            api_key: Google API key (defaults to env var GOOGLE_API_KEY)
            model_name: Gemini model to use
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GOOGLE_API_KEY not found. "
                "Set environment variable or pass api_key parameter."
            )

        genai.configure(api_key=self.api_key)

        # Configure generation settings
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
        }

        self.model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=self.generation_config
        )

        self.model_name = model_name

    def generate_item(
        self,
        domain: str,
        difficulty: float,
        discrimination: float,
        skill_tag: str,
        cefr_level: str,
        text_type: Optional[str] = None,
        constraints: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate a single test item using Gemini API.

        Args:
            domain: Test domain (vocabulary, grammar, reading)
            difficulty: IRT difficulty parameter (b)
            discrimination: IRT discrimination parameter (a)
            skill_tag: Specific skill being tested
            cefr_level: CEFR level (A1-C2)
            text_type: Text type for reading items
            constraints: Additional constraints (word_count, avoid_topics, etc.)

        Returns:
            Dictionary containing generated item with all metadata
        """
        prompt = self._build_generation_prompt(
            domain, difficulty, discrimination, skill_tag,
            cefr_level, text_type, constraints
        )

        try:
            # Configure generation with higher token limit
            generation_config = {
                "max_output_tokens": 8192,  # Increased for full JSON response
                "temperature": 0.7,
                "top_p": 0.95,
            }

            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )

            # Parse response
            content = response.text
            item_data = self._parse_item_response(content)

            # Add metadata
            item_data['ai_generated'] = True
            item_data['model'] = self.model_name
            item_data['generation_params'] = {
                'domain': domain,
                'difficulty': difficulty,
                'discrimination': discrimination,
                'skill_tag': skill_tag,
                'cefr_level': cefr_level
            }

            logger.info(f"Generated {domain} item for {cefr_level} level")
            return item_data

        except Exception as e:
            logger.error(f"Failed to generate item: {e}")
            raise

    def validate_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate test item quality using Gemini API.

        Args:
            item: Test item dictionary to validate

        Returns:
            Validation result with quality scores and recommendations
        """
        prompt = self._build_validation_prompt(item)

        try:
            # Use lower temperature for validation
            validation_model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.3,
                    "max_output_tokens": 2048
                }
            )

            response = validation_model.generate_content(prompt)
            content = response.text
            validation_result = self._parse_validation_response(content)

            logger.info(f"Validated item {item.get('id', 'new')} - Score: {validation_result['overall_score']}")
            return validation_result

        except Exception as e:
            logger.error(f"Failed to validate item: {e}")
            raise

    def generate_feedback(
        self,
        item: Dict[str, Any],
        user_response: str,
        is_correct: bool,
        user_ability: float
    ) -> str:
        """
        Generate personalized feedback for a user's response.

        Args:
            item: Test item dictionary
            user_response: User's selected answer
            is_correct: Whether response was correct
            user_ability: User's current ability estimate (theta)

        Returns:
            Personalized feedback message
        """
        prompt = self._build_feedback_prompt(item, user_response, is_correct, user_ability)

        try:
            feedback_model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 512
                }
            )

            response = feedback_model.generate_content(prompt)
            feedback = response.text.strip()

            logger.info(f"Generated feedback for item {item.get('id')}")
            return feedback

        except Exception as e:
            logger.error(f"Failed to generate feedback: {e}")
            return "답변을 제출해주셔서 감사합니다. 계속 학습해 나가세요!"

    def batch_generate_items(
        self,
        specifications: List[Dict[str, Any]],
        max_concurrent: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple items in batch (sequential for now).

        Args:
            specifications: List of item specifications
            max_concurrent: Maximum concurrent API calls (future implementation)

        Returns:
            List of generated items
        """
        generated_items = []

        for spec in specifications:
            try:
                item = self.generate_item(**spec)
                generated_items.append(item)
            except Exception as e:
                logger.error(f"Failed to generate item with spec {spec}: {e}")
                continue

        logger.info(f"Generated {len(generated_items)}/{len(specifications)} items")
        return generated_items

    # ===== Private Helper Methods =====

    def _build_generation_prompt(
        self,
        domain: str,
        difficulty: float,
        discrimination: float,
        skill_tag: str,
        cefr_level: str,
        text_type: Optional[str],
        constraints: Optional[Dict]
    ) -> str:
        """Build prompt for item generation."""

        difficulty_desc = self._map_difficulty_to_description(difficulty)
        discrimination_desc = self._map_discrimination_to_description(discrimination)

        prompt = f"""You are an expert English language test item writer following IRT 3PL principles.

Generate a {domain} test item with these specifications:
- CEFR Level: {cefr_level}
- Skill: {skill_tag}
- Difficulty: {difficulty_desc} (IRT b = {difficulty:.2f})
- Discrimination: {discrimination_desc} (IRT a = {discrimination:.2f})
"""

        if text_type:
            prompt += f"- Text Type: {text_type}\n"

        if constraints:
            prompt += "\nConstraints:\n"
            for key, value in constraints.items():
                prompt += f"- {key}: {value}\n"

        prompt += """
Requirements:
1. Item must have exactly 4 options (A, B, C, D)
2. Only ONE correct answer
3. Distractors must be plausible but clearly incorrect
4. Use natural, authentic language appropriate for the CEFR level
5. Avoid cultural bias or sensitive topics
6. For reading items, include a passage (50-200 words for lower levels, up to 500 for advanced)

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "stem": "question text here",
  "passage": "reading passage if applicable, otherwise null",
  "passage_title": "passage title if applicable, otherwise null",
  "options": {
    "A": "option A text",
    "B": "option B text",
    "C": "option C text",
    "D": "option D text"
  },
  "correct_answer": "A",
  "rationale": "brief explanation of why this tests the target skill",
  "estimated_difficulty": -1.5,
  "estimated_discrimination": 1.2
}

Generate the item now:"""

        return prompt

    def _build_validation_prompt(self, item: Dict[str, Any]) -> str:
        """Build prompt for item validation."""

        return f"""You are a test quality assurance expert. Evaluate this English test item:

Item:
- Stem: {item.get('stem')}
- Options: {json.dumps(item.get('options'), ensure_ascii=False)}
- Correct Answer: {item.get('correct_answer')}
- Domain: {item.get('domain')}
- CEFR Level: {item.get('cefr_level', 'Not specified')}

Evaluate on these criteria (score 1-10 for each):
1. Grammar & Language Quality
2. Option Quality (plausibility of distractors)
3. Cultural Appropriateness
4. Difficulty Appropriateness for CEFR level
5. Clarity & Unambiguity

Output ONLY valid JSON (no markdown):
{{
  "grammar_score": 8,
  "options_score": 7,
  "cultural_score": 10,
  "difficulty_score": 8,
  "clarity_score": 9,
  "overall_score": 8.4,
  "issues": ["list any issues found"],
  "recommendations": ["list improvement suggestions"],
  "approved": true
}}

Evaluate now:"""

    def _build_feedback_prompt(
        self,
        item: Dict[str, Any],
        user_response: str,
        is_correct: bool,
        user_ability: float
    ) -> str:
        """Build prompt for personalized feedback."""

        status = "correct" if is_correct else "incorrect"
        ability_desc = self._map_ability_to_description(user_ability)

        return f"""Generate brief, encouraging feedback for a learner.

Item: {item.get('stem')}
Correct Answer: {item.get('correct_answer')}
User Selected: {user_response}
Result: {status}
User Level: {ability_desc}

Generate 1-2 sentences of feedback in Korean that:
- Acknowledges the response
- {'Encourages continued practice' if is_correct else 'Explains the concept briefly without giving full answer'}
- Uses appropriate tone for the user's level

Output only the feedback text (no JSON, no labels):"""

    def _parse_item_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini's item generation response."""
        try:
            # Remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1])  # Remove first and last lines
                if response.startswith("json"):
                    response = response[4:].strip()

            item_data = json.loads(response)
            return item_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse item response: {e}\nResponse: {response}")
            raise ValueError(f"Invalid JSON response from Gemini: {e}")

    def _parse_validation_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini's validation response."""
        try:
            response = response.strip()
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1])
                if response.startswith("json"):
                    response = response[4:].strip()

            validation_data = json.loads(response)
            return validation_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse validation response: {e}")
            # Return default validation result
            return {
                "overall_score": 5.0,
                "issues": ["Failed to parse validation response"],
                "approved": False
            }

    def _map_difficulty_to_description(self, difficulty: float) -> str:
        """Map IRT difficulty to human-readable description."""
        if difficulty < -2:
            return "very easy"
        elif difficulty < -1:
            return "easy"
        elif difficulty < 0:
            return "somewhat easy"
        elif difficulty < 1:
            return "somewhat difficult"
        elif difficulty < 2:
            return "difficult"
        else:
            return "very difficult"

    def _map_discrimination_to_description(self, discrimination: float) -> str:
        """Map IRT discrimination to human-readable description."""
        if discrimination < 0.5:
            return "low discrimination (poor item quality)"
        elif discrimination < 1.0:
            return "moderate discrimination"
        elif discrimination < 1.5:
            return "good discrimination"
        else:
            return "excellent discrimination"

    def _map_ability_to_description(self, ability: float) -> str:
        """Map ability theta to description."""
        if ability < -2:
            return "Beginner (A1)"
        elif ability < -1:
            return "Elementary (A2)"
        elif ability < 0:
            return "Pre-Intermediate (A2-B1)"
        elif ability < 1:
            return "Intermediate (B1-B2)"
        elif ability < 2:
            return "Upper-Intermediate (B2-C1)"
        else:
            return "Advanced (C1-C2)"
