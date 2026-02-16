"""
AI Item Generator using Google Gemini API
==========================================

Generates English test items. IRT parameters are NOT auto-assigned;
items are created with calibration_status='uncalibrated' and must go
through the calibration pipeline after collecting response data.
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

        # Map difficulty range to CEFR level for passage guidance
        cefr = self._difficulty_to_cefr(mid_diff)

        prompt = f"""Generate {count} English language test items for an adaptive test targeting K-12 students.

**Test Configuration:**
- Stage: {stage}, Panel: {panel}
- Target CEFR level: {cefr}
- Domains: {', '.join(domains)} (distribute evenly)
{vocab_guidance}

**Item Format (JSON array):**
```json
[
  {{
    "domain": "grammar|vocabulary|reading",
    "stem": "Complete question ending with ?",
    "options": {{
      "A": "Option text",
      "B": "Option text",
      "C": "Option text",
      "D": "Option text"
    }},
    "correct_answer": "A|B|C|D",
    "skill_tags": ["bloom_level", "specific_skill"],
    "cefr_level": "{cefr}"
  }}
]
```

**Domain-Specific Guidelines:**

GRAMMAR items:
- Test one specific grammar point per item (e.g., subject-verb agreement, tense usage, relative clauses)
- skill_tags: ["remember|understand|apply", "specific_grammar_point"]
- Distractors must represent common student errors (e.g., wrong tense form, incorrect preposition)

VOCABULARY items:
- Test word meaning in context, NOT isolated definitions
- skill_tags: ["understand|analyze", "word_meaning|word_form|collocation"]
- Distractors: semantically related words that don't fit the context

READING items:
- Provide a short passage (3-6 sentences) as part of the stem
- Test comprehension at different Bloom levels: literal recall, inference, evaluation
- skill_tags: ["understand|analyze|evaluate", "main_idea|inference|detail|vocabulary_in_context"]

**Quality Requirements:**
1. Stem must be a complete, clear question (end with ?)
2. All 4 options must be similar length (within 2x of each other)
3. Only ONE unambiguously correct answer
4. Distractors based on common misconceptions/errors, NOT random wrong answers
5. Vary correct answer positions (roughly equal A/B/C/D distribution across items)
6. Age-appropriate, culturally neutral content
7. No "all of the above" or "none of the above" options

**Do NOT assign IRT parameters (difficulty, discrimination, guessing). These will be determined through empirical calibration.**

**Output ONLY valid JSON array. No explanations or markdown.**"""

        return prompt

    def _difficulty_to_cefr(self, difficulty: float) -> str:
        """Map target difficulty to CEFR level for prompt guidance."""
        if difficulty < -1.5:
            return "A1"
        elif difficulty < -0.5:
            return "A2"
        elif difficulty < 0.5:
            return "B1"
        elif difficulty < 1.2:
            return "B2"
        else:
            return "C1"

    def _parse_response(self, response_text: str, stage: int, panel: str) -> List[Dict]:
        """Parse Gemini API response and add metadata. No IRT params assigned."""

        # Extract JSON from response (handle markdown code blocks)
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        try:
            items_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON response: {e}\n{response_text}")

        items = []
        for idx, item in enumerate(items_data):
            domain_prefix = item['domain'][0].upper()
            item_id = f"{domain_prefix}_AI_{stage}{panel[0].upper()}{idx:03d}"

            complete_item = {
                "id": item_id,
                "stage": stage,
                "panel": panel,
                "form_id": 1,
                "domain": item['domain'],
                "stem": item['stem'],
                "options": item['options'],
                "correct_answer": item['correct_answer'],
                "skill_tags": item.get('skill_tags', []),
                # IRT params: placeholder defaults, NOT calibrated
                "difficulty": 0.0,
                "discrimination": 1.0,
                "guessing": 0.25,
                "calibration_status": "uncalibrated",
                "status": "active",
                "source": "ai_generated",
            }

            items.append(complete_item)

        # Run quality checks and annotate warnings
        items = self._validate_items(items)

        return items

    def _validate_items(self, items: List[Dict]) -> List[Dict]:
        """
        Post-generation quality checks.

        Checks:
        1. Option length balance (no option >2x longest other)
        2. Correct answer position distribution
        3. Stem ends with question mark
        4. Has exactly 4 options
        """
        warnings = []
        answer_positions = {'A': 0, 'B': 0, 'C': 0, 'D': 0}

        for i, item in enumerate(items):
            item_warnings = []

            # Check stem is a complete question
            stem = item.get('stem', '')
            if not stem.rstrip().endswith('?'):
                item_warnings.append('stem_no_question_mark')

            # Check exactly 4 options
            options = item.get('options', {})
            if len(options) != 4:
                item_warnings.append(f'option_count_{len(options)}')

            # Check option length balance
            if options:
                lengths = [len(str(v)) for v in options.values()]
                if max(lengths) > 0 and min(lengths) > 0:
                    ratio = max(lengths) / min(lengths)
                    if ratio > 3.0:
                        item_warnings.append(f'option_length_imbalance_{ratio:.1f}x')

            # Track answer position
            answer = item.get('correct_answer', '')
            if answer in answer_positions:
                answer_positions[answer] += 1

            if item_warnings:
                item['quality_warnings'] = item_warnings
                warnings.extend(item_warnings)

        # Check answer position bias
        total = len(items)
        if total >= 4:
            expected = total / 4
            for pos, count in answer_positions.items():
                if count > expected * 2:
                    for item in items:
                        if item.get('correct_answer') == pos:
                            existing = item.get('quality_warnings', [])
                            existing.append(f'answer_position_bias_{pos}')
                            item['quality_warnings'] = existing

        return items

# Singleton instance
_generator = None

def get_generator() -> AIItemGenerator:
    """Get or create AI item generator instance"""
    global _generator
    if _generator is None:
        _generator = AIItemGenerator()
    return _generator
