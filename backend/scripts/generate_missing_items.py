"""
Generate missing English test items for Stage 2 Low and Stage 3 Medium panels
"""

import json
import os

# Stage 2 Low Panel Items (difficulty: -0.8 to -1.5)
stage2_low_items = [
    {
        "id": "G_AI_001",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "article",
        "stem": "I saw _____ elephant at the zoo yesterday.",
        "options": {
            "A": "a",
            "B": "an",
            "C": "the",
            "D": "some"
        },
        "correct_answer": "B",
        "skill_tags": ["articles", "vowel_sound"],
        "difficulty": -1.2,
        "discrimination": 1.5,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_002",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "simple_tense",
        "stem": "She _____ to school every day.",
        "options": {
            "A": "go",
            "B": "goes",
            "C": "going",
            "D": "went"
        },
        "correct_answer": "B",
        "skill_tags": ["simple_present", "third_person_singular"],
        "difficulty": -1.0,
        "discrimination": 1.6,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_001",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "basic_vocabulary",
        "stem": "The opposite of 'hot' is _____.",
        "options": {
            "A": "warm",
            "B": "cool",
            "C": "cold",
            "D": "freeze"
        },
        "correct_answer": "C",
        "skill_tags": ["antonyms", "basic_adjectives"],
        "difficulty": -1.3,
        "discrimination": 1.4,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_002",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "basic_vocabulary",
        "stem": "A person who teaches students is a _____.",
        "options": {
            "A": "doctor",
            "B": "teacher",
            "C": "student",
            "D": "worker"
        },
        "correct_answer": "B",
        "skill_tags": ["professions", "basic_nouns"],
        "difficulty": -1.4,
        "discrimination": 1.7,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_003",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "plural",
        "stem": "There are three _____ on the table.",
        "options": {
            "A": "book",
            "B": "books",
            "C": "bookes",
            "D": "a book"
        },
        "correct_answer": "B",
        "skill_tags": ["plurals", "countable_nouns"],
        "difficulty": -1.1,
        "discrimination": 1.5,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "R_AI_001",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "reading",
        "item_type": "basic_comprehension",
        "stem": "The cat sat on the mat. Where was the cat?",
        "options": {
            "A": "Under the mat",
            "B": "On the mat",
            "C": "Near the mat",
            "D": "Behind the mat"
        },
        "correct_answer": "B",
        "skill_tags": ["literal_comprehension", "prepositions"],
        "difficulty": -1.5,
        "discrimination": 1.8,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_004",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "pronoun",
        "stem": "This is my book. It is _____.",
        "options": {
            "A": "my",
            "B": "mine",
            "C": "me",
            "D": "I"
        },
        "correct_answer": "B",
        "skill_tags": ["possessive_pronouns"],
        "difficulty": -0.9,
        "discrimination": 1.3,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_003",
        "stage": 2,
        "panel": "low",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "basic_vocabulary",
        "stem": "We use a _____ to write on paper.",
        "options": {
            "A": "pen",
            "B": "book",
            "C": "table",
            "D": "chair"
        },
        "correct_answer": "A",
        "skill_tags": ["school_objects", "basic_nouns"],
        "difficulty": -1.2,
        "discrimination": 1.6,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    }
]

# Stage 3 Medium Panel Items (difficulty: 0.0 to 0.5)
stage3_medium_items = [
    {
        "id": "G_AI_005",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "conditional",
        "stem": "If I _____ more time, I would travel around the world.",
        "options": {
            "A": "have",
            "B": "had",
            "C": "will have",
            "D": "would have"
        },
        "correct_answer": "B",
        "skill_tags": ["second_conditional", "hypothetical"],
        "difficulty": 0.3,
        "discrimination": 1.4,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_004",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "synonym",
        "stem": "The word 'brief' is closest in meaning to _____.",
        "options": {
            "A": "long",
            "B": "short",
            "C": "detailed",
            "D": "complex"
        },
        "correct_answer": "B",
        "skill_tags": ["synonyms", "academic_vocabulary"],
        "difficulty": 0.2,
        "discrimination": 1.3,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "R_AI_002",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "reading",
        "item_type": "inference",
        "stem": "Sarah checked her watch nervously and quickened her pace. She was likely _____.",
        "options": {
            "A": "tired",
            "B": "late",
            "C": "early",
            "D": "relaxed"
        },
        "correct_answer": "B",
        "skill_tags": ["inference", "context_clues"],
        "difficulty": 0.1,
        "discrimination": 1.5,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_006",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "passive_voice",
        "stem": "The book _____ by millions of people every year.",
        "options": {
            "A": "reads",
            "B": "is read",
            "C": "was read",
            "D": "has read"
        },
        "correct_answer": "B",
        "skill_tags": ["passive_voice", "present_simple_passive"],
        "difficulty": 0.4,
        "discrimination": 1.2,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_005",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "context_meaning",
        "stem": "The company aims to _____ its market share by introducing new products.",
        "options": {
            "A": "reduce",
            "B": "expand",
            "C": "maintain",
            "D": "ignore"
        },
        "correct_answer": "B",
        "skill_tags": ["business_vocabulary", "context"],
        "difficulty": 0.3,
        "discrimination": 1.4,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_007",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "relative_clause",
        "stem": "The person _____ I met yesterday was very helpful.",
        "options": {
            "A": "which",
            "B": "whose",
            "C": "whom",
            "D": "what"
        },
        "correct_answer": "C",
        "skill_tags": ["relative_pronouns", "object_pronoun"],
        "difficulty": 0.5,
        "discrimination": 1.1,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "R_AI_003",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "reading",
        "item_type": "main_idea",
        "stem": "Despite initial setbacks, the team persevered and ultimately succeeded. The main theme is _____.",
        "options": {
            "A": "failure",
            "B": "persistence",
            "C": "luck",
            "D": "teamwork"
        },
        "correct_answer": "B",
        "skill_tags": ["main_idea", "theme_identification"],
        "difficulty": 0.2,
        "discrimination": 1.3,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_006",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "collocations",
        "stem": "She has a strong _____ in environmental protection.",
        "options": {
            "A": "believe",
            "B": "belief",
            "C": "believer",
            "D": "believing"
        },
        "correct_answer": "B",
        "skill_tags": ["collocations", "noun_forms"],
        "difficulty": 0.4,
        "discrimination": 1.2,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_008",
        "stage": 3,
        "panel": "medium",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "perfect_tense",
        "stem": "By next month, I _____ here for five years.",
        "options": {
            "A": "work",
            "B": "worked",
            "C": "will have worked",
            "D": "have worked"
        },
        "correct_answer": "C",
        "skill_tags": ["future_perfect", "time_expressions"],
        "difficulty": 0.5,
        "discrimination": 1.1,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    }
]

def add_items_to_json(json_path: str):
    """Add generated items to existing JSON file"""

    # Read existing data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add new items
    all_new_items = stage2_low_items + stage3_medium_items
    data['items'].extend(all_new_items)

    # Write back
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Added {len(all_new_items)} items to {json_path}")
    print(f"   - Stage 2 Low: {len(stage2_low_items)} items")
    print(f"   - Stage 3 Medium: {len(stage3_medium_items)} items")
    print(f"   - Total items now: {len(data['items'])}")

    return data

if __name__ == '__main__':
    json_path = os.path.join(os.path.dirname(__file__), '..', 'complete_40_items.json')
    json_path = os.path.abspath(json_path)

    print(f"Adding items to: {json_path}")
    add_items_to_json(json_path)
    print("\n[OK] Done! Run cleanup API to update database.")
