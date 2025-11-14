"""
AI Item Generator using Google Gemini API
==========================================

Automatically generates English test items with IRT parameters.
"""

import os
import json
import random
import google.generativeai as genai
from typing import Dict, List, Optional

class AIItemGenerator:
    """Generate English test items using Gemini API"""

    def __init__(self):
        """Initialize Gemini API client and load vocabulary lists"""
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

        # Load vocabulary lists for reference
        self.vocab_lists = self._load_vocabulary_lists()

    def generate_items(
        self,
        stage: int,
        panel: str,
        count: int = 5,
        domains: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Generate test items using Gemini API.

        Args:
            stage: MST stage (1, 2, 3)
            panel: Panel name (routing, low, medium, high)
            count: Number of items to generate
            domains: List of domains (grammar, vocabulary, reading) or None for balanced

        Returns:
            List of generated items
        """
        # Determine difficulty range based on stage and panel
        difficulty_range = self._get_difficulty_range(stage, panel)

        # Default to balanced domains
        if not domains:
            domains = ['grammar', 'vocabulary', 'reading']

        # Build prompt
        prompt = self._build_prompt(stage, panel, count, domains, difficulty_range)

        # Call Gemini API
        response = self.model.generate_content(prompt)

        # Parse JSON response
        items = self._parse_response(response.text, stage, panel)

        return items[:count]  # Ensure we return exactly count items

    def _load_vocabulary_lists(self) -> Dict:
        """Load vocabulary lists from JSON files"""
        vocab_dir = os.path.join(os.path.dirname(__file__), '../../vocabulary_lists')

        try:
            # Load VST bands
            vst_path = os.path.join(vocab_dir, 'vst_bands.json')
            with open(vst_path, 'r', encoding='utf-8') as f:
                vst_bands = json.load(f)

            print(f"✅ Loaded vocabulary lists from {vocab_dir}")
            return vst_bands

        except FileNotFoundError:
            print(f"⚠️ Vocabulary lists not found at {vocab_dir}")
            print(f"⚠️ Using AI generation without word list reference")
            return {}
        except Exception as e:
            print(f"⚠️ Error loading vocabulary lists: {e}")
            return {}

    def _get_frequency_band_for_difficulty(self, difficulty: float) -> str:
        """Map IRT difficulty to VST frequency band"""
        # Difficulty ranges → Frequency bands
        # Very Easy (-2.0 to -1.0) → 1k band (most frequent)
        # Easy (-1.0 to 0.0) → 2k band
        # Medium (0.0 to 1.0) → 3k-6k bands
        # Hard (1.0 to 2.0) → 8k-14k bands (academic)

        if difficulty < -1.0:
            return "1k"
        elif difficulty < -0.3:
            return "2k"
        elif difficulty < 0.3:
            return "3k"
        elif difficulty < 0.7:
            return "4k"
        elif difficulty < 1.0:
            return "6k"
        elif difficulty < 1.3:
            return "8k"
        else:
            return "14k"  # Academic vocabulary

    def _get_vocabulary_examples(self, difficulty: float, count: int = 10) -> List[str]:
        """Get vocabulary examples for given difficulty level"""
        if not self.vocab_lists:
            return []

        frequency_band = self._get_frequency_band_for_difficulty(difficulty)

        # Get words from appropriate band
        band_data = self.vocab_lists.get(frequency_band, {})
        words = band_data.get('words', [])

        if not words:
            return []

        # Return random sample
        sample_size = min(count, len(words))
        return random.sample(words, sample_size)

    def _get_difficulty_range(self, stage: int, panel: str) -> tuple:
        """Get difficulty range for stage/panel combination"""
        ranges = {
            (1, 'routing'): (-1.8, 0.0),
            (2, 'low'): (-1.5, -0.6),
            (2, 'medium'): (-0.8, 0.1),
            (2, 'high'): (0.0, 0.8),
            (3, 'low'): (-0.2, 0.1),
            (3, 'medium'): (0.1, 0.5),
            (3, 'high'): (0.8, 1.3),
        }
        return ranges.get((stage, panel), (-1.0, 1.0))

    def _build_prompt(
        self,
        stage: int,
        panel: str,
        count: int,
        domains: List[str],
        difficulty_range: tuple
    ) -> str:
        """Build prompt for Gemini API"""

        min_diff, max_diff = difficulty_range
        mid_diff = (min_diff + max_diff) / 2

        # Get vocabulary examples for this difficulty level
        vocab_examples = self._get_vocabulary_examples(mid_diff, count=15)
        vocab_guidance = ""
        if vocab_examples and 'vocabulary' in domains:
            vocab_guidance = f"\n\n**Vocabulary Reference (use these or similar words):**\n"
            vocab_guidance += f"Frequency band: {self._get_frequency_band_for_difficulty(mid_diff)}\n"
            vocab_guidance += f"Example words: {', '.join(vocab_examples[:10])}\n"
            vocab_guidance += f"These words are appropriate for difficulty {mid_diff:.2f}. Use these or similar words from the same frequency level."

        prompt = f"""Generate {count} English language test items for adaptive testing.

**Requirements:**
- Stage: {stage} (1=routing, 2=adaptive, 3=final)
- Panel: {panel} (difficulty level)
- Difficulty range: {min_diff:.1f} to {max_diff:.1f} (IRT 3PL model)
- Domains: {', '.join(domains)}
- Distribute items evenly across domains{vocab_guidance}

**Item Format (JSON array):**
```json
[
  {{
    "domain": "grammar|vocabulary|reading",
    "item_type": "specific_grammar_point|word_type|comprehension_skill",
    "stem": "Question text here",
    "options": {{
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    }},
    "correct_answer": "A|B|C|D",
    "skill_tags": ["tag1", "tag2"],
    "difficulty": {min_diff + (max_diff - min_diff) / 2:.2f}
  }}
]
```

**Difficulty Guidelines:**
- Very Easy (-2.0 to -1.0): Basic vocabulary, simple grammar, literal comprehension
- Easy (-1.0 to 0.0): Common words, standard grammar, straightforward inference
- Medium (0.0 to 1.0): Academic vocabulary, complex grammar, moderate inference
- Hard (1.0 to 2.0): Advanced vocabulary, sophisticated grammar, deep analysis

**Quality Standards:**
1. All options must be plausible
2. Only one clearly correct answer
3. No ambiguity or trick questions
4. Age-appropriate content (K-12 students)
5. Diverse topics and contexts
6. Discrimination: 1.1-1.8 (higher for easier items)
7. Guessing: Always 0.25 (4 options)

**Output only valid JSON array. No explanations.**"""

        return prompt

    def _parse_response(self, response_text: str, stage: int, panel: str) -> List[Dict]:
        """Parse Gemini API response and add metadata"""

        # Extract JSON from response (handle markdown code blocks)
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON
        try:
            items_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON response: {e}\n{response_text}")

        # Add metadata
        items = []
        for idx, item in enumerate(items_data):
            # Auto-generate ID
            domain_prefix = item['domain'][0].upper()
            item_id = f"{domain_prefix}_AI_{stage}{panel[0].upper()}{idx:03d}"

            # Set discrimination based on difficulty
            difficulty = item.get('difficulty', 0.0)
            if difficulty < -1.0:
                discrimination = 1.6
            elif difficulty < 0.0:
                discrimination = 1.4
            elif difficulty < 1.0:
                discrimination = 1.2
            else:
                discrimination = 1.0

            # Build complete item
            complete_item = {
                "id": item_id,
                "stage": stage,
                "panel": panel,
                "form_id": 1,
                "domain": item['domain'],
                "item_type": item['item_type'],
                "stem": item['stem'],
                "options": item['options'],
                "correct_answer": item['correct_answer'],
                "skill_tags": item.get('skill_tags', []),
                "difficulty": item.get('difficulty', 0.0),
                "discrimination": discrimination,
                "guessing": 0.25,
                "status": "active",
                "source": "ai_generated"
            }

            items.append(complete_item)

        return items

# Singleton instance
_generator = None

def get_generator() -> AIItemGenerator:
    """Get or create AI item generator instance"""
    global _generator
    if _generator is None:
        _generator = AIItemGenerator()
    return _generator
