"""
Generate Missing English Test Items
====================================

Generates 52 missing items to complete the 600-item pool:
- Stage 2 high vocabulary: 13 items
- Stage 2 low vocabulary: 10 items
- Stage 2 low reading: 14 items
- Stage 2 medium vocabulary: 13 items
- Stage 2 high grammar: 1 item
- Stage 2 low grammar: 1 item

Uses templates and variations to ensure quality and uniqueness.
"""

import json
import random

# IRT parameters by difficulty level
IRT_PARAMS = {
    'high': {
        'difficulty': (1.0, 2.5),
        'discrimination': (1.2, 2.0)
    },
    'medium': {
        'difficulty': (-0.5, 0.5),
        'discrimination': (1.0, 1.8)
    },
    'low': {
        'difficulty': (-2.5, -1.0),
        'discrimination': (0.8, 1.5)
    }
}

# Vocabulary items by frequency band
VOCABULARY_ITEMS = {
    'high': [  # 5000-10000 frequency
        {
            'word': 'analyze',
            'definition': 'to examine something in detail',
            'distractors': ['to ignore', 'to memorize', 'to celebrate']
        },
        {
            'word': 'complex',
            'definition': 'having many interconnected parts',
            'distractors': ['very simple', 'completely flat', 'extremely small']
        },
        {
            'word': 'decline',
            'definition': 'to decrease or refuse',
            'distractors': ['to increase rapidly', 'to stay the same', 'to divide equally']
        },
        {
            'word': 'diverse',
            'definition': 'showing a great deal of variety',
            'distractors': ['all the same', 'very few', 'completely empty']
        },
        {
            'word': 'enhance',
            'definition': 'to improve or increase in quality',
            'distractors': ['to worsen', 'to remain unchanged', 'to confuse']
        },
        {
            'word': 'establish',
            'definition': 'to set up or create something',
            'distractors': ['to destroy completely', 'to forget about', 'to question']
        },
        {
            'word': 'fundamental',
            'definition': 'forming a necessary base or core',
            'distractors': ['completely optional', 'very recent', 'extremely rare']
        },
        {
            'word': 'implement',
            'definition': 'to put a plan or system into effect',
            'distractors': ['to cancel', 'to delay indefinitely', 'to misunderstand']
        },
        {
            'word': 'modify',
            'definition': 'to make partial changes to something',
            'distractors': ['to keep exactly the same', 'to throw away', 'to multiply']
        },
        {
            'word': 'strategy',
            'definition': 'a plan of action to achieve a goal',
            'distractors': ['a complete failure', 'a lucky accident', 'a small mistake']
        },
        {
            'word': 'subsequent',
            'definition': 'coming after something in time',
            'distractors': ['happening before', 'at the same time', 'never occurring']
        },
        {
            'word': 'indicate',
            'definition': 'to point out or show',
            'distractors': ['to hide completely', 'to ignore', 'to confuse']
        },
        {
            'word': 'significant',
            'definition': 'important or notable',
            'distractors': ['meaningless', 'very tiny', 'extremely old']
        }
    ],
    'medium': [  # 2000-5000 frequency
        {
            'word': 'achieve',
            'definition': 'to successfully reach a goal',
            'distractors': ['to fail completely', 'to forget about', 'to delay']
        },
        {
            'word': 'benefit',
            'definition': 'an advantage or positive effect',
            'distractors': ['a serious problem', 'a small mistake', 'a wrong answer']
        },
        {
            'word': 'challenge',
            'definition': 'a difficult task or problem',
            'distractors': ['an easy solution', 'a boring topic', 'a quick break']
        },
        {
            'word': 'develop',
            'definition': 'to grow or create gradually',
            'distractors': ['to stop suddenly', 'to break apart', 'to stay the same']
        },
        {
            'word': 'evidence',
            'definition': 'information showing that something is true',
            'distractors': ['a wild guess', 'a false story', 'an old tradition']
        },
        {
            'word': 'feature',
            'definition': 'a distinctive characteristic',
            'distractors': ['a hidden secret', 'a complete copy', 'a simple mistake']
        },
        {
            'word': 'impact',
            'definition': 'a strong effect or influence',
            'distractors': ['no effect at all', 'a small decoration', 'a quiet sound']
        },
        {
            'word': 'maintain',
            'definition': 'to keep in good condition',
            'distractors': ['to destroy', 'to forget', 'to hide']
        },
        {
            'word': 'obtain',
            'definition': 'to get or acquire',
            'distractors': ['to lose', 'to give away', 'to ignore']
        },
        {
            'word': 'require',
            'definition': 'to need or demand',
            'distractors': ['to reject', 'to offer freely', 'to avoid']
        },
        {
            'word': 'resource',
            'definition': 'a supply of something useful',
            'distractors': ['a waste product', 'an empty space', 'a broken tool']
        },
        {
            'word': 'structure',
            'definition': 'the way parts are arranged or organized',
            'distractors': ['complete chaos', 'a single color', 'a loud noise']
        },
        {
            'word': 'traditional',
            'definition': 'based on customs passed down over time',
            'distractors': ['completely modern', 'totally wrong', 'very rare']
        }
    ],
    'low': [  # 1000-2000 frequency
        {
            'word': 'affect',
            'definition': 'to have an influence on',
            'distractors': ['to ignore completely', 'to copy exactly', 'to hide away']
        },
        {
            'word': 'approach',
            'definition': 'to come near or a way of doing something',
            'distractors': ['to run away from', 'to completely forget', 'to sharply criticize']
        },
        {
            'word': 'available',
            'definition': 'able to be used or obtained',
            'distractors': ['completely sold out', 'totally broken', 'permanently closed']
        },
        {
            'word': 'community',
            'definition': 'a group of people living in the same area',
            'distractors': ['one single person', 'an empty building', 'a wild animal']
        },
        {
            'word': 'create',
            'definition': 'to make or produce something',
            'distractors': ['to destroy', 'to steal', 'to forget']
        },
        {
            'word': 'environment',
            'definition': 'the surroundings or conditions',
            'distractors': ['a single person', 'a small number', 'a quick moment']
        },
        {
            'word': 'increase',
            'definition': 'to become or make greater',
            'distractors': ['to decrease', 'to stay the same', 'to disappear']
        },
        {
            'word': 'method',
            'definition': 'a particular way of doing something',
            'distractors': ['a complete accident', 'a wrong answer', 'a lucky guess']
        },
        {
            'word': 'process',
            'definition': 'a series of actions to achieve a result',
            'distractors': ['a single moment', 'a wrong direction', 'a random event']
        },
        {
            'word': 'similar',
            'definition': 'alike but not exactly the same',
            'distractors': ['completely different', 'exactly identical', 'totally opposite']
        }
    ]
}

# Reading passages by difficulty
READING_PASSAGES = {
    'low': [
        {
            'title': 'Making a Sandwich',
            'content': '''Making a sandwich is easy. First, get two pieces of bread. Next, add your favorite things like cheese, meat, or vegetables. You can also add mustard or mayonnaise. Finally, put the other piece of bread on top. Now you have a delicious sandwich to eat!''',
            'questions': [
                {
                    'stem': 'What is the first step in making a sandwich?',
                    'options': {
                        'A': 'Get two pieces of bread',
                        'B': 'Add cheese and meat',
                        'C': 'Put bread on top',
                        'D': 'Add mustard'
                    },
                    'correct': 'A'
                },
                {
                    'stem': 'What can you add to a sandwich?',
                    'options': {
                        'A': 'Only cheese',
                        'B': 'Cheese, meat, or vegetables',
                        'C': 'Only mustard',
                        'D': 'Nothing at all'
                    },
                    'correct': 'B'
                }
            ]
        },
        {
            'title': 'My Pet Dog',
            'content': '''I have a pet dog named Max. Max is brown and white. He is three years old. Every morning, I take Max for a walk in the park. He likes to run and play with other dogs. Max is a very friendly dog. He makes me happy every day.''',
            'questions': [
                {
                    'stem': 'What is the name of the dog?',
                    'options': {
                        'A': 'Max',
                        'B': 'Brown',
                        'C': 'Park',
                        'D': 'Happy'
                    },
                    'correct': 'A'
                },
                {
                    'stem': 'Where does the writer take Max?',
                    'options': {
                        'A': 'To school',
                        'B': 'To the park',
                        'C': 'To a store',
                        'D': 'To a hospital'
                    },
                    'correct': 'B'
                }
            ]
        },
        {
            'title': 'Going to the Beach',
            'content': '''Last summer, my family went to the beach. The weather was sunny and warm. We swam in the ocean and built sandcastles. My sister found many beautiful shells. We had a picnic lunch on the beach. It was a perfect day. I can't wait to go back next year.''',
            'questions': [
                {
                    'stem': 'When did the family go to the beach?',
                    'options': {
                        'A': 'Last winter',
                        'B': 'Last summer',
                        'C': 'Next year',
                        'D': 'Yesterday'
                    },
                    'correct': 'B'
                },
                {
                    'stem': 'What did they build on the beach?',
                    'options': {
                        'A': 'A house',
                        'B': 'A boat',
                        'C': 'Sandcastles',
                        'D': 'A fire'
                    },
                    'correct': 'C'
                }
            ]
        },
        {
            'title': 'Learning to Ride a Bike',
            'content': '''Tom wanted to learn how to ride a bike. His father helped him. At first, Tom fell down many times. But he did not give up. He practiced every day after school. After two weeks, Tom could ride his bike without help. He was very proud of himself.''',
            'questions': [
                {
                    'stem': 'Who helped Tom learn to ride a bike?',
                    'options': {
                        'A': 'His mother',
                        'B': 'His teacher',
                        'C': 'His father',
                        'D': 'His friend'
                    },
                    'correct': 'C'
                },
                {
                    'stem': 'How long did it take Tom to learn?',
                    'options': {
                        'A': 'One day',
                        'B': 'Two weeks',
                        'C': 'One month',
                        'D': 'One year'
                    },
                    'correct': 'B'
                }
            ]
        },
        {
            'title': 'The School Library',
            'content': '''Our school library is a quiet place. Students can borrow books for two weeks. The library has books about many topics like science, history, and stories. Mrs. Johnson is the librarian. She helps students find the books they need. The library also has computers for research.''',
            'questions': [
                {
                    'stem': 'How long can students borrow books?',
                    'options': {
                        'A': 'One day',
                        'B': 'One week',
                        'C': 'Two weeks',
                        'D': 'One month'
                    },
                    'correct': 'C'
                },
                {
                    'stem': 'Who is the librarian?',
                    'options': {
                        'A': 'Mrs. Johnson',
                        'B': 'Mrs. Smith',
                        'C': 'Mr. Brown',
                        'D': 'Ms. Davis'
                    },
                    'correct': 'A'
                }
            ]
        },
        {
            'title': 'Planting a Garden',
            'content': '''In spring, we planted a vegetable garden. We grew tomatoes, carrots, and lettuce. Every day, we watered the plants. We also pulled out the weeds. In summer, the vegetables were ready to eat. They tasted much better than vegetables from the store. Gardening is hard work but very rewarding.''',
            'questions': [
                {
                    'stem': 'When did they plant the garden?',
                    'options': {
                        'A': 'In spring',
                        'B': 'In summer',
                        'C': 'In fall',
                        'D': 'In winter'
                    },
                    'correct': 'A'
                },
                {
                    'stem': 'What did they grow in the garden?',
                    'options': {
                        'A': 'Only tomatoes',
                        'B': 'Tomatoes, carrots, and lettuce',
                        'C': 'Only flowers',
                        'D': 'Only weeds'
                    },
                    'correct': 'B'
                }
            ]
        },
        {
            'title': 'A Birthday Party',
            'content': '''Yesterday was Emily's birthday. She invited her friends to a party. They played games and ate cake. The cake was chocolate with vanilla frosting. Emily's favorite present was a new book. Everyone sang "Happy Birthday" to Emily. She had a wonderful time celebrating with her friends.''',
            'questions': [
                {
                    'stem': 'Whose birthday was it?',
                    'options': {
                        'A': 'Emily's',
                        'B': 'Her friend's',
                        'C': 'Her mother's',
                        'D': 'Her teacher's'
                    },
                    'correct': 'A'
                },
                {
                    'stem': 'What was Emily's favorite present?',
                    'options': {
                        'A': 'A toy',
                        'B': 'A cake',
                        'C': 'A new book',
                        'D': 'A game'
                    },
                    'correct': 'C'
                }
            ]
        }
    ]
}

def generate_vocabulary_item(word_data, panel, form_id=1):
    """Generate a vocabulary test item"""
    difficulty_range = IRT_PARAMS[panel]['difficulty']
    discrimination_range = IRT_PARAMS[panel]['discrimination']

    # Shuffle options
    options = [word_data['definition']] + word_data['distractors']
    random.shuffle(options)

    correct_index = options.index(word_data['definition'])
    correct_letter = chr(65 + correct_index)  # A, B, C, D

    return {
        'stem': f"What is the meaning of '{word_data['word']}'?",
        'options': {
            'A': options[0],
            'B': options[1],
            'C': options[2],
            'D': options[3]
        },
        'correct_answer': correct_letter,
        'domain': 'vocabulary',
        'skill_tag': f"{word_data['word']}_meaning",
        'stage': 2,
        'panel': panel,
        'form_id': form_id,
        'discrimination': round(random.uniform(*discrimination_range), 2),
        'difficulty': round(random.uniform(*difficulty_range), 2)
    }

def generate_reading_item(passage_data, question_data, panel, passage_id, form_id=1):
    """Generate a reading test item"""
    difficulty_range = IRT_PARAMS[panel]['difficulty']
    discrimination_range = IRT_PARAMS[panel]['discrimination']

    return {
        'passage_id': passage_id,
        'stem': question_data['stem'],
        'options': question_data['options'],
        'correct_answer': question_data['correct'],
        'domain': 'reading',
        'skill_tag': 'reading_comprehension',
        'stage': 2,
        'panel': panel,
        'form_id': form_id,
        'discrimination': round(random.uniform(*discrimination_range), 2),
        'difficulty': round(random.uniform(*difficulty_range), 2)
    }

def generate_grammar_item(panel, form_id=1):
    """Generate a grammar test item"""
    difficulty_range = IRT_PARAMS[panel]['difficulty']
    discrimination_range = IRT_PARAMS[panel]['discrimination']

    templates = {
        'high': [
            {
                'stem': 'Had I known about the meeting, I _____ attended.',
                'options': {'A': 'would have', 'B': 'will have', 'C': 'would', 'D': 'will'},
                'correct': 'A',
                'skill': 'conditional_perfect'
            }
        ],
        'low': [
            {
                'stem': 'She _____ to the park every Sunday.',
                'options': {'A': 'goes', 'B': 'go', 'C': 'going', 'D': 'gone'},
                'correct': 'A',
                'skill': 'present_simple'
            }
        ]
    }

    template = random.choice(templates.get(panel, templates['high']))

    return {
        'stem': template['stem'],
        'options': template['options'],
        'correct_answer': template['correct'],
        'domain': 'grammar',
        'skill_tag': template['skill'],
        'stage': 2,
        'panel': panel,
        'form_id': form_id,
        'discrimination': round(random.uniform(*discrimination_range), 2),
        'difficulty': round(random.uniform(*difficulty_range), 2)
    }

def main():
    """Generate all missing items"""

    all_items = []
    passage_counter = 101  # Start after existing passages

    print("Generating missing items...")
    print("=" * 80)

    # Stage 2 high vocabulary: 13 items
    print("\n1. Generating Stage 2 HIGH vocabulary items (13)...")
    vocab_high = VOCABULARY_ITEMS['high'][:13]
    for word_data in vocab_high:
        item = generate_vocabulary_item(word_data, 'high')
        all_items.append(item)
    print(f"   Generated {len(vocab_high)} items")

    # Stage 2 low vocabulary: 10 items
    print("\n2. Generating Stage 2 LOW vocabulary items (10)...")
    vocab_low = VOCABULARY_ITEMS['low'][:10]
    for word_data in vocab_low:
        item = generate_vocabulary_item(word_data, 'low')
        all_items.append(item)
    print(f"   Generated {len(vocab_low)} items")

    # Stage 2 medium vocabulary: 13 items
    print("\n3. Generating Stage 2 MEDIUM vocabulary items (13)...")
    vocab_medium = VOCABULARY_ITEMS['medium'][:13]
    for word_data in vocab_medium:
        item = generate_vocabulary_item(word_data, 'medium')
        all_items.append(item)
    print(f"   Generated {len(vocab_medium)} items")

    # Stage 2 low reading: 14 items (7 passages × 2 questions each)
    print("\n4. Generating Stage 2 LOW reading items (14)...")
    reading_low = READING_PASSAGES['low'][:7]
    passages_to_insert = []

    for passage_data in reading_low:
        # Store passage info
        passages_to_insert.append({
            'id': passage_counter,
            'title': passage_data['title'],
            'content': passage_data['content'],
            'word_count': len(passage_data['content'].split())
        })

        # Generate items for this passage
        for question_data in passage_data['questions']:
            item = generate_reading_item(passage_data, question_data, 'low', passage_counter)
            all_items.append(item)

        passage_counter += 1
    print(f"   Generated {len(reading_low) * 2} items from {len(reading_low)} passages")

    # Grammar items
    print("\n5. Generating grammar items (2)...")
    item_high_grammar = generate_grammar_item('high')
    item_low_grammar = generate_grammar_item('low')
    all_items.append(item_high_grammar)
    all_items.append(item_low_grammar)
    print(f"   Generated 2 items")

    # Save to JSON
    output_file = 'generated_52_items.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'items': all_items,
            'passages': passages_to_insert
        }, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print(f"GENERATION COMPLETE!")
    print(f"Total items generated: {len(all_items)}")
    print(f"Total passages created: {len(passages_to_insert)}")
    print(f"Output file: {output_file}")
    print("=" * 80)

    # Summary by domain and panel
    print("\nSummary:")
    for domain in ['vocabulary', 'reading', 'grammar']:
        count = len([i for i in all_items if i['domain'] == domain])
        print(f"  {domain}: {count} items")

    print("\nBy panel:")
    for panel in ['high', 'medium', 'low']:
        count = len([i for i in all_items if i['panel'] == panel])
        print(f"  {panel}: {count} items")

if __name__ == '__main__':
    main()
