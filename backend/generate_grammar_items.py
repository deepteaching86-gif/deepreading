"""
Grammar Items Generator
======================

Generates 200 grammar items with IRT parameters for English Adaptive Test.

Structure:
- Stage 1 (Routing): 50 items
- Stage 2 (Panel): 75 items (Low: 25, Medium: 25, High: 25)
- Stage 3 (Subtrack): 75 items (6 subtracks × 12-13 items)
"""

import json
import random
from typing import List, Dict

# Grammar skills distribution
GRAMMAR_SKILLS = {
    'present_simple': 30,
    'present_continuous': 30,
    'past_simple': 30,
    'past_perfect': 30,
    'future_forms': 25,
    'modal_verbs': 25,
    'conditionals': 20,
    'passive_voice': 20,
    'relative_clauses': 20,
    'reported_speech': 15,
    'articles_prepositions': 15,
}

# Stage 1: Routing items (50 items)
# Difficulty range: -2.0 to 2.0
STAGE1_ROUTING = [
    # Present Simple - Easy (θ = -2.0 to -1.0)
    {
        "stem": "She _____ to school every day.",
        "options": {"A": "go", "B": "goes", "C": "going", "D": "gone"},
        "correct_answer": "B",
        "skill_tag": "present_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.2,
        "difficulty": -1.5,
    },
    {
        "stem": "They _____ playing soccer now.",
        "options": {"A": "is", "B": "am", "C": "are", "D": "be"},
        "correct_answer": "C",
        "skill_tag": "present_continuous",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.1,
        "difficulty": -1.3,
    },
    {
        "stem": "I _____ breakfast at 7 AM every morning.",
        "options": {"A": "eat", "B": "eats", "C": "eating", "D": "eaten"},
        "correct_answer": "A",
        "skill_tag": "present_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.0,
        "difficulty": -1.8,
    },
    {
        "stem": "He _____ his homework right now.",
        "options": {"A": "do", "B": "does", "C": "is doing", "D": "did"},
        "correct_answer": "C",
        "skill_tag": "present_continuous",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.1,
        "difficulty": -1.4,
    },
    {
        "stem": "We _____ English at school.",
        "options": {"A": "studies", "B": "study", "C": "studying", "D": "studied"},
        "correct_answer": "B",
        "skill_tag": "present_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.2,
        "difficulty": -1.6,
    },

    # Past Simple - Easy to Medium (θ = -1.5 to -0.5)
    {
        "stem": "Yesterday, I _____ to the park.",
        "options": {"A": "go", "B": "goes", "C": "went", "D": "gone"},
        "correct_answer": "C",
        "skill_tag": "past_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.3,
        "difficulty": -1.0,
    },
    {
        "stem": "She _____ her keys last night.",
        "options": {"A": "lose", "B": "lost", "C": "losed", "D": "losing"},
        "correct_answer": "B",
        "skill_tag": "past_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.2,
        "difficulty": -0.9,
    },
    {
        "stem": "They _____ the movie last weekend.",
        "options": {"A": "watch", "B": "watched", "C": "watching", "D": "watches"},
        "correct_answer": "B",
        "skill_tag": "past_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.1,
        "difficulty": -1.2,
    },
    {
        "stem": "He _____ a new car two months ago.",
        "options": {"A": "buy", "B": "buys", "C": "bought", "D": "buying"},
        "correct_answer": "C",
        "skill_tag": "past_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.3,
        "difficulty": -0.8,
    },
    {
        "stem": "We _____ our homework before dinner yesterday.",
        "options": {"A": "finish", "B": "finished", "C": "finishing", "D": "finishes"},
        "correct_answer": "B",
        "skill_tag": "past_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.2,
        "difficulty": -1.1,
    },

    # Future Forms - Medium (θ = -0.5 to 0.5)
    {
        "stem": "Tomorrow, I _____ visit my grandparents.",
        "options": {"A": "will", "B": "would", "C": "am", "D": "was"},
        "correct_answer": "A",
        "skill_tag": "future_forms",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.4,
        "difficulty": -0.3,
    },
    {
        "stem": "They _____ going to start a new project next month.",
        "options": {"A": "is", "B": "am", "C": "are", "D": "be"},
        "correct_answer": "C",
        "skill_tag": "future_forms",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.3,
        "difficulty": -0.2,
    },
    {
        "stem": "She _____ probably arrive late.",
        "options": {"A": "will", "B": "is", "C": "was", "D": "were"},
        "correct_answer": "A",
        "skill_tag": "future_forms",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.4,
        "difficulty": 0.0,
    },
    {
        "stem": "We _____ having a party next Saturday.",
        "options": {"A": "will", "B": "are", "C": "is", "D": "were"},
        "correct_answer": "B",
        "skill_tag": "future_forms",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.3,
        "difficulty": 0.1,
    },
    {
        "stem": "The train _____ at 9 PM tonight.",
        "options": {"A": "leave", "B": "leaves", "C": "leaving", "D": "left"},
        "correct_answer": "B",
        "skill_tag": "present_simple",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.5,
        "difficulty": 0.2,
    },

    # Modal Verbs - Medium (θ = -0.3 to 0.5)
    {
        "stem": "You _____ wear a helmet when riding a bike.",
        "options": {"A": "can", "B": "must", "C": "may", "D": "might"},
        "correct_answer": "B",
        "skill_tag": "modal_verbs",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.5,
        "difficulty": -0.1,
    },
    {
        "stem": "She _____ speak three languages fluently.",
        "options": {"A": "can", "B": "must", "C": "should", "D": "would"},
        "correct_answer": "A",
        "skill_tag": "modal_verbs",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.4,
        "difficulty": 0.0,
    },
    {
        "stem": "Students _____ be quiet in the library.",
        "options": {"A": "can", "B": "may", "C": "should", "D": "could"},
        "correct_answer": "C",
        "skill_tag": "modal_verbs",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.5,
        "difficulty": 0.1,
    },
    {
        "stem": "It _____ rain later, so bring an umbrella.",
        "options": {"A": "must", "B": "should", "C": "might", "D": "will"},
        "correct_answer": "C",
        "skill_tag": "modal_verbs",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.6,
        "difficulty": 0.3,
    },
    {
        "stem": "You _____ have called me earlier.",
        "options": {"A": "can", "B": "should", "C": "may", "D": "will"},
        "correct_answer": "B",
        "skill_tag": "modal_verbs",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.5,
        "difficulty": 0.4,
    },

    # Conditionals - Medium to Hard (θ = 0.3 to 1.0)
    {
        "stem": "If it rains, we _____ stay at home.",
        "options": {"A": "will", "B": "would", "C": "can", "D": "must"},
        "correct_answer": "A",
        "skill_tag": "conditionals",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.6,
        "difficulty": 0.4,
    },
    {
        "stem": "If I _____ rich, I would travel the world.",
        "options": {"A": "am", "B": "was", "C": "were", "D": "be"},
        "correct_answer": "C",
        "skill_tag": "conditionals",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.7,
        "difficulty": 0.6,
    },
    {
        "stem": "If she had studied harder, she _____ the exam.",
        "options": {"A": "pass", "B": "passed", "C": "would pass", "D": "would have passed"},
        "correct_answer": "D",
        "skill_tag": "conditionals",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 0.9,
    },
    {
        "stem": "Unless you hurry, you _____ the bus.",
        "options": {"A": "miss", "B": "will miss", "C": "missed", "D": "missing"},
        "correct_answer": "B",
        "skill_tag": "conditionals",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.6,
        "difficulty": 0.5,
    },
    {
        "stem": "Provided that you finish on time, you _____ leave early.",
        "options": {"A": "can", "B": "must", "C": "should", "D": "would"},
        "correct_answer": "A",
        "skill_tag": "conditionals",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.7,
        "difficulty": 0.8,
    },

    # Passive Voice - Medium to Hard (θ = 0.4 to 1.2)
    {
        "stem": "The book _____ by millions of people.",
        "options": {"A": "read", "B": "reads", "C": "is read", "D": "reading"},
        "correct_answer": "C",
        "skill_tag": "passive_voice",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.6,
        "difficulty": 0.5,
    },
    {
        "stem": "The house _____ in 1920.",
        "options": {"A": "built", "B": "was built", "C": "is built", "D": "building"},
        "correct_answer": "B",
        "skill_tag": "passive_voice",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.7,
        "difficulty": 0.7,
    },
    {
        "stem": "The project _____ completed by next Friday.",
        "options": {"A": "will", "B": "will be", "C": "is", "D": "was"},
        "correct_answer": "B",
        "skill_tag": "passive_voice",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 0.9,
    },
    {
        "stem": "The letters _____ delivered yesterday.",
        "options": {"A": "are", "B": "were", "C": "have been", "D": "will be"},
        "correct_answer": "B",
        "skill_tag": "passive_voice",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.6,
        "difficulty": 0.6,
    },
    {
        "stem": "The decision _____ made yet.",
        "options": {"A": "isn't", "B": "wasn't", "C": "hasn't been", "D": "won't be"},
        "correct_answer": "C",
        "skill_tag": "passive_voice",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.1,
    },

    # Relative Clauses - Hard (θ = 0.8 to 1.5)
    {
        "stem": "The man _____ lives next door is a doctor.",
        "options": {"A": "which", "B": "who", "C": "whose", "D": "whom"},
        "correct_answer": "B",
        "skill_tag": "relative_clauses",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.7,
        "difficulty": 0.9,
    },
    {
        "stem": "This is the book _____ I was talking about.",
        "options": {"A": "who", "B": "whose", "C": "which", "D": "whom"},
        "correct_answer": "C",
        "skill_tag": "relative_clauses",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.0,
    },
    {
        "stem": "The woman _____ car was stolen called the police.",
        "options": {"A": "who", "B": "whose", "C": "which", "D": "that"},
        "correct_answer": "B",
        "skill_tag": "relative_clauses",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.9,
        "difficulty": 1.3,
    },
    {
        "stem": "I met someone _____ knew your brother.",
        "options": {"A": "which", "B": "whose", "C": "who", "D": "whom"},
        "correct_answer": "C",
        "skill_tag": "relative_clauses",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.7,
        "difficulty": 1.0,
    },
    {
        "stem": "That's the restaurant _____ we had dinner last week.",
        "options": {"A": "which", "B": "where", "C": "who", "D": "whose"},
        "correct_answer": "B",
        "skill_tag": "relative_clauses",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.2,
    },

    # Reported Speech - Hard (θ = 1.0 to 1.8)
    {
        "stem": "She said that she _____ tired.",
        "options": {"A": "is", "B": "was", "C": "be", "D": "been"},
        "correct_answer": "B",
        "skill_tag": "reported_speech",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.1,
    },
    {
        "stem": "He told me that he _____ already finished.",
        "options": {"A": "has", "B": "have", "C": "had", "D": "having"},
        "correct_answer": "C",
        "skill_tag": "reported_speech",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.9,
        "difficulty": 1.4,
    },
    {
        "stem": "They said they _____ us the next day.",
        "options": {"A": "will call", "B": "would call", "C": "called", "D": "calling"},
        "correct_answer": "B",
        "skill_tag": "reported_speech",
        "stage": 1,
        "panel": "routing",
        "discrimination": 2.0,
        "difficulty": 1.6,
    },
    {
        "stem": "She asked me where I _____.",
        "options": {"A": "live", "B": "lives", "C": "lived", "D": "living"},
        "correct_answer": "C",
        "skill_tag": "reported_speech",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.3,
    },
    {
        "stem": "He wondered whether I _____ to the party.",
        "options": {"A": "come", "B": "came", "C": "would come", "D": "coming"},
        "correct_answer": "C",
        "skill_tag": "reported_speech",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.9,
        "difficulty": 1.5,
    },

    # Articles & Prepositions - Medium to Hard (θ = 0.3 to 1.5)
    {
        "stem": "I go to _____ gym every morning.",
        "options": {"A": "a", "B": "an", "C": "the", "D": "no article"},
        "correct_answer": "C",
        "skill_tag": "articles_prepositions",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.5,
        "difficulty": 0.4,
    },
    {
        "stem": "She lives _____ London.",
        "options": {"A": "at", "B": "in", "C": "on", "D": "by"},
        "correct_answer": "B",
        "skill_tag": "articles_prepositions",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.4,
        "difficulty": 0.3,
    },
    {
        "stem": "The meeting starts _____ 3 o'clock.",
        "options": {"A": "at", "B": "in", "C": "on", "D": "by"},
        "correct_answer": "A",
        "skill_tag": "articles_prepositions",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.5,
        "difficulty": 0.5,
    },
    {
        "stem": "We went to _____ Netherlands last summer.",
        "options": {"A": "a", "B": "an", "C": "the", "D": "no article"},
        "correct_answer": "C",
        "skill_tag": "articles_prepositions",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.7,
        "difficulty": 1.0,
    },
    {
        "stem": "He succeeded _____ spite of many difficulties.",
        "options": {"A": "at", "B": "in", "C": "on", "D": "by"},
        "correct_answer": "B",
        "skill_tag": "articles_prepositions",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.3,
    },

    # Past Perfect - Hard (θ = 1.0 to 1.8)
    {
        "stem": "When I arrived, they _____ already left.",
        "options": {"A": "have", "B": "has", "C": "had", "D": "having"},
        "correct_answer": "C",
        "skill_tag": "past_perfect",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.2,
    },
    {
        "stem": "She was tired because she _____ all day.",
        "options": {"A": "work", "B": "worked", "C": "had worked", "D": "working"},
        "correct_answer": "C",
        "skill_tag": "past_perfect",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.9,
        "difficulty": 1.4,
    },
    {
        "stem": "By the time we got there, the movie _____.",
        "options": {"A": "started", "B": "had started", "C": "has started", "D": "starting"},
        "correct_answer": "B",
        "skill_tag": "past_perfect",
        "stage": 1,
        "panel": "routing",
        "discrimination": 2.0,
        "difficulty": 1.7,
    },
    {
        "stem": "I realized I _____ my keys at home.",
        "options": {"A": "left", "B": "had left", "C": "have left", "D": "leaving"},
        "correct_answer": "B",
        "skill_tag": "past_perfect",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.8,
        "difficulty": 1.3,
    },
    {
        "stem": "They _____ never seen such a beautiful sunset before.",
        "options": {"A": "have", "B": "has", "C": "had", "D": "having"},
        "correct_answer": "C",
        "skill_tag": "past_perfect",
        "stage": 1,
        "panel": "routing",
        "discrimination": 1.9,
        "difficulty": 1.6,
    },
]

def generate_stage2_items() -> List[Dict]:
    """Generate Stage 2 Panel items (75 items)"""
    items = []

    # Low Panel (25 items): θ = -2.5 to -0.5
    # Medium Panel (25 items): θ = -0.5 to 1.0
    # High Panel (25 items): θ = 0.5 to 2.5

    # TODO: Generate programmatically
    # For now, return empty list - will be filled later

    return items

def generate_stage3_items() -> List[Dict]:
    """Generate Stage 3 Subtrack items (75 items)"""
    items = []

    # 6 subtracks × 12-13 items each
    # TODO: Generate programmatically

    return items

def save_items_to_json(filename: str):
    """Save all grammar items to JSON file"""
    all_items = STAGE1_ROUTING  # + stage2 + stage3

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, indent=2, ensure_ascii=False)

    print(f"[OK] {len(all_items)} grammar items saved to {filename}")
    print(f"   - Stage 1 (Routing): {len(STAGE1_ROUTING)} items")

if __name__ == "__main__":
    save_items_to_json("grammar_items_stage1.json")
    print("\n[Stats] Grammar Items Statistics:")
    print(f"   Total generated: {len(STAGE1_ROUTING)}")
    print(f"   Remaining: 150 items (Stage 2 & 3)")
