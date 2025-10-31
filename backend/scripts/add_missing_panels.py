"""
Add missing items for Stage 1 routing, Stage 2 high, Stage 3 high, and Stage 3 low
Total: 15 items (3 + 2 + 2 + 8)
"""

import json
import os

# Stage 1 Routing Items (difficulty: -0.9 to -0.3)
stage1_routing_items = [
    {
        "id": "R_AI_004",
        "stage": 1,
        "panel": "routing",
        "form_id": 1,
        "domain": "reading",
        "item_type": "basic_inference",
        "stem": "John studied hard all night. The next morning, he felt very tired. Why was John tired?",
        "options": {
            "A": "He played games",
            "B": "He studied all night",
            "C": "He woke up early",
            "D": "He didn't sleep well"
        },
        "correct_answer": "B",
        "skill_tags": ["cause_and_effect", "basic_inference"],
        "difficulty": -0.9,
        "discrimination": 1.5,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_009",
        "stage": 1,
        "panel": "routing",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "verb_form",
        "stem": "She _____ her homework every evening.",
        "options": {
            "A": "do",
            "B": "does",
            "C": "did",
            "D": "doing"
        },
        "correct_answer": "B",
        "skill_tags": ["present_simple", "third_person"],
        "difficulty": -0.6,
        "discrimination": 1.6,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_007",
        "stage": 1,
        "panel": "routing",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "word_meaning",
        "stem": "To 'purchase' something means to _____ it.",
        "options": {
            "A": "sell",
            "B": "buy",
            "C": "return",
            "D": "borrow"
        },
        "correct_answer": "B",
        "skill_tags": ["synonyms", "basic_verbs"],
        "difficulty": -0.3,
        "discrimination": 1.4,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    }
]

# Stage 2 High Panel Items (difficulty: 0.6 to 0.7)
stage2_high_items = [
    {
        "id": "G_AI_010",
        "stage": 2,
        "panel": "high",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "subjunctive",
        "stem": "The teacher insisted that every student _____ the assignment on time.",
        "options": {
            "A": "submits",
            "B": "submitted",
            "C": "submit",
            "D": "will submit"
        },
        "correct_answer": "C",
        "skill_tags": ["subjunctive_mood", "mandative_verbs"],
        "difficulty": 0.7,
        "discrimination": 1.2,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_008",
        "stage": 2,
        "panel": "high",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "academic_word",
        "stem": "The research findings were _____, meaning they could not be easily dismissed.",
        "options": {
            "A": "trivial",
            "B": "substantial",
            "C": "minimal",
            "D": "irrelevant"
        },
        "correct_answer": "B",
        "skill_tags": ["academic_vocabulary", "formal_register"],
        "difficulty": 0.6,
        "discrimination": 1.3,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    }
]

# Stage 3 High Panel Items (difficulty: 1.0 to 1.2)
stage3_high_items = [
    {
        "id": "G_AI_011",
        "stage": 3,
        "panel": "high",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "inversion",
        "stem": "Rarely _____ such dedication to a cause.",
        "options": {
            "A": "we have seen",
            "B": "have we seen",
            "C": "we saw",
            "D": "did we saw"
        },
        "correct_answer": "B",
        "skill_tags": ["inversion", "negative_adverbials"],
        "difficulty": 1.2,
        "discrimination": 1.0,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "R_AI_005",
        "stage": 3,
        "panel": "high",
        "form_id": 1,
        "domain": "reading",
        "item_type": "complex_inference",
        "stem": "The author's use of irony throughout the passage suggests that the proposed solution is _____.",
        "options": {
            "A": "highly effective",
            "B": "completely adequate",
            "C": "fundamentally flawed",
            "D": "moderately successful"
        },
        "correct_answer": "C",
        "skill_tags": ["literary_devices", "author_intent", "irony"],
        "difficulty": 1.0,
        "discrimination": 1.1,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    }
]

# Stage 3 Low Panel Items (difficulty: -0.2 to 0.1)
# 이 panel은 Stage 2보다 어렵고 Stage 3 medium보다 쉬움
stage3_low_items = [
    {
        "id": "G_AI_012",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "gerund_infinitive",
        "stem": "She enjoys _____ in her free time.",
        "options": {
            "A": "to read",
            "B": "reading",
            "C": "read",
            "D": "reads"
        },
        "correct_answer": "B",
        "skill_tags": ["gerunds", "verb_patterns"],
        "difficulty": -0.2,
        "discrimination": 1.4,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_009",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "phrasal_verb",
        "stem": "The meeting was _____ until next week.",
        "options": {
            "A": "put off",
            "B": "put on",
            "C": "put up",
            "D": "put down"
        },
        "correct_answer": "A",
        "skill_tags": ["phrasal_verbs", "postpone"],
        "difficulty": -0.1,
        "discrimination": 1.5,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "R_AI_006",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "reading",
        "item_type": "detail_comprehension",
        "stem": "According to the passage, the main reason for the policy change was _____.",
        "options": {
            "A": "public demand",
            "B": "financial constraints",
            "C": "legal requirements",
            "D": "environmental concerns"
        },
        "correct_answer": "B",
        "skill_tags": ["detail_comprehension", "scanning"],
        "difficulty": 0.0,
        "discrimination": 1.3,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_013",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "present_perfect",
        "stem": "I _____ to Paris three times.",
        "options": {
            "A": "go",
            "B": "went",
            "C": "have been",
            "D": "was"
        },
        "correct_answer": "C",
        "skill_tags": ["present_perfect", "experience"],
        "difficulty": -0.1,
        "discrimination": 1.6,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_010",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "preposition_collocation",
        "stem": "She is good _____ mathematics.",
        "options": {
            "A": "in",
            "B": "at",
            "C": "on",
            "D": "with"
        },
        "correct_answer": "B",
        "skill_tags": ["adjective_prepositions", "collocations"],
        "difficulty": 0.0,
        "discrimination": 1.4,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "G_AI_014",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "grammar",
        "item_type": "comparison",
        "stem": "This book is _____ than the one I read last week.",
        "options": {
            "A": "more interesting",
            "B": "most interesting",
            "C": "interestinger",
            "D": "interestingest"
        },
        "correct_answer": "A",
        "skill_tags": ["comparatives", "adjectives"],
        "difficulty": -0.2,
        "discrimination": 1.7,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "R_AI_007",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "reading",
        "item_type": "pronoun_reference",
        "stem": "In the sentence 'Mary called Sarah, but she was not home,' 'she' most likely refers to _____.",
        "options": {
            "A": "Mary",
            "B": "Sarah",
            "C": "Both Mary and Sarah",
            "D": "Neither Mary nor Sarah"
        },
        "correct_answer": "B",
        "skill_tags": ["pronoun_reference", "context_clues"],
        "difficulty": 0.1,
        "discrimination": 1.2,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    },
    {
        "id": "V_AI_011",
        "stage": 3,
        "panel": "low",
        "form_id": 1,
        "domain": "vocabulary",
        "item_type": "word_form",
        "stem": "The _____ of the building took two years.",
        "options": {
            "A": "construct",
            "B": "construction",
            "C": "constructive",
            "D": "constructor"
        },
        "correct_answer": "B",
        "skill_tags": ["word_forms", "nouns"],
        "difficulty": 0.0,
        "discrimination": 1.5,
        "guessing": 0.25,
        "status": "active",
        "source": "ai_generated"
    }
]

def add_items_to_json(json_path: str):
    """Add missing panel items to JSON"""

    # Read existing data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add new items
    all_new_items = (
        stage1_routing_items +
        stage2_high_items +
        stage3_high_items +
        stage3_low_items
    )

    data['items'].extend(all_new_items)

    # Write back
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Added {len(all_new_items)} items to {json_path}")
    print(f"   - Stage 1 routing: {len(stage1_routing_items)} items")
    print(f"   - Stage 2 high: {len(stage2_high_items)} items")
    print(f"   - Stage 3 high: {len(stage3_high_items)} items")
    print(f"   - Stage 3 low: {len(stage3_low_items)} items")
    print(f"   - Total items now: {len(data['items'])}")

    return data

if __name__ == '__main__':
    json_path = os.path.join(os.path.dirname(__file__), '..', 'complete_40_items.json')
    json_path = os.path.abspath(json_path)

    print(f"Adding missing panel items to: {json_path}")
    add_items_to_json(json_path)
    print("\n[OK] Done! Total 15 items added. Run cleanup API to update database.")
