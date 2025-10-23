#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
English Adaptive Test - Python Data Seeding
============================================

Seeds 40 sample items for initial testing using psycopg2 directly.
"""
import sys
import os
import io
import json

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("[ERROR] psycopg2 not installed. Installing...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2
    from psycopg2.extras import RealDictCursor


def seed_data():
    """Seed English test sample data"""

    # URL-encoded password
    conn_string = "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres"

    print("[*] Connecting to Supabase PostgreSQL...")

    try:
        conn = psycopg2.connect(conn_string)
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        print("[+] Connected successfully\n")
        print("[*] Seeding English Adaptive Test sample data...")

        # ===== 1. Create Sample Passages =====
        print("\n[*] Creating passages...")

        passages = [
            {
                'title': 'The School Library',
                'content': """The school library is a quiet place where students can read books and study.
Mrs. Johnson is the librarian. She helps students find books they like.
The library has many kinds of books: fiction, non-fiction, and magazines.
Students must be quiet in the library so everyone can concentrate.""",
                'word_count': 52,
                'lexile_score': 400,
                'ar_level': 2.5,
                'genre': 'informational'
            },
            {
                'title': 'Climate Change and Polar Bears',
                'content': """Polar bears are facing serious challenges due to climate change. As Arctic ice melts,
these magnificent animals lose their hunting grounds. Polar bears primarily hunt seals,
which they catch on sea ice. With less ice available, bears must swim longer distances,
expending more energy while finding less food. Scientists estimate that polar bear populations
could decline by 30% over the next few decades if current trends continue.""",
                'word_count': 72,
                'lexile_score': 950,
                'ar_level': 6.8,
                'genre': 'scientific'
            },
            {
                'title': 'The Paradox of Choice',
                'content': """Contemporary consumer culture presents an interesting paradox: while an abundance
of choices theoretically empowers consumers, excessive options can paradoxically diminish satisfaction
and increase anxiety. Psychologist Barry Schwartz argues that when faced with too many alternatives,
individuals experience decision paralysis and subsequent regret. Moreover, the opportunity cost of
foregone options becomes more salient, leading to decreased contentment with chosen alternatives.
This phenomenon has profound implications for marketing strategies and public policy design.""",
                'word_count': 74,
                'lexile_score': 1280,
                'ar_level': 11.2,
                'genre': 'academic'
            }
        ]

        passage_ids = []
        for p in passages:
            cursor.execute("""
                INSERT INTO passages (title, content, word_count, lexile_score, ar_level, genre)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (p['title'], p['content'], p['word_count'], p['lexile_score'], p['ar_level'], p['genre']))

            passage_ids.append(cursor.fetchone()['id'])

        print(f"[+] Created {len(passage_ids)} passages")

        # ===== 2. Create Grammar Items (13 items) =====
        print("\n[*] Creating grammar items...")

        grammar_items = [
            # Stage 1: Routing (3 items)
            {'stem': 'She _____ to school every day.', 'options': {'A': 'go', 'B': 'goes', 'C': 'going', 'D': 'gone'}, 'correct': 'B', 'stage': 1, 'panel': 'routing', 'skill': 'present_simple', 'a': 1.2, 'b': -1.0},
            {'stem': 'They _____ playing soccer now.', 'options': {'A': 'is', 'B': 'am', 'C': 'are', 'D': 'be'}, 'correct': 'C', 'stage': 1, 'panel': 'routing', 'skill': 'present_continuous', 'a': 1.0, 'b': -0.8},
            {'stem': 'I _____ my homework yesterday.', 'options': {'A': 'do', 'B': 'did', 'C': 'doing', 'D': 'done'}, 'correct': 'B', 'stage': 1, 'panel': 'routing', 'skill': 'past_simple', 'a': 1.1, 'b': -0.5},

            # Stage 2: Low Panel (5 items)
            {'stem': 'We _____ to the park last weekend.', 'options': {'A': 'go', 'B': 'went', 'C': 'gone', 'D': 'going'}, 'correct': 'B', 'stage': 2, 'panel': 'low', 'skill': 'past_simple', 'a': 0.9, 'b': -1.2},
            {'stem': 'She is _____ than her sister.', 'options': {'A': 'tall', 'B': 'taller', 'C': 'tallest', 'D': 'more tall'}, 'correct': 'B', 'stage': 2, 'panel': 'low', 'skill': 'comparatives', 'a': 1.0, 'b': -0.9},
            {'stem': 'There _____ many books on the shelf.', 'options': {'A': 'is', 'B': 'am', 'C': 'are', 'D': 'be'}, 'correct': 'C', 'stage': 2, 'panel': 'low', 'skill': 'subject_verb_agreement', 'a': 0.8, 'b': -1.0},
            {'stem': 'He can _____ very fast.', 'options': {'A': 'runs', 'B': 'running', 'C': 'ran', 'D': 'run'}, 'correct': 'D', 'stage': 2, 'panel': 'low', 'skill': 'modal_verbs', 'a': 0.9, 'b': -0.7},
            {'stem': 'My brother _____ basketball every weekend.', 'options': {'A': 'play', 'B': 'plays', 'C': 'playing', 'D': 'played'}, 'correct': 'B', 'stage': 2, 'panel': 'low', 'skill': 'present_simple', 'a': 0.95, 'b': -1.1},

            # Stage 2: Medium Panel (2 items)
            {'stem': 'If I _____ you, I would study harder.', 'options': {'A': 'am', 'B': 'was', 'C': 'were', 'D': 'be'}, 'correct': 'C', 'stage': 2, 'panel': 'med', 'skill': 'conditionals', 'a': 1.3, 'b': 0.2},
            {'stem': 'The book _____ by millions of people.', 'options': {'A': 'reads', 'B': 'is read', 'C': 'reading', 'D': 'read'}, 'correct': 'B', 'stage': 2, 'panel': 'med', 'skill': 'passive_voice', 'a': 1.4, 'b': 0.5},

            # Stage 3: High-High Panel (3 items)
            {'stem': 'Scarcely _____ the door when the phone rang.', 'options': {'A': 'I opened', 'B': 'did I open', 'C': 'had I opened', 'D': 'I had opened'}, 'correct': 'C', 'stage': 3, 'panel': 'high_high', 'skill': 'inversion', 'a': 1.8, 'b': 1.5},
            {'stem': 'The committee _____ to make a decision by next week.', 'options': {'A': 'need', 'B': 'needs', 'C': 'needing', 'D': 'have needed'}, 'correct': 'B', 'stage': 3, 'panel': 'high_high', 'skill': 'collective_nouns', 'a': 1.6, 'b': 1.2},
            {'stem': 'Were it not for your help, I _____ failed.', 'options': {'A': 'would have', 'B': 'will have', 'C': 'had', 'D': 'have'}, 'correct': 'A', 'stage': 3, 'panel': 'high_high', 'skill': 'subjunctive', 'a': 1.9, 'b': 1.8},
        ]

        for item in grammar_items:
            cursor.execute("""
                INSERT INTO items (
                    stem, options, correct_answer, domain, skill_tag,
                    stage, panel, discrimination, difficulty, guessing
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0.25)
                RETURNING id;
            """, (
                item['stem'],
                json.dumps(item['options']),
                item['correct'],
                'grammar',
                item['skill'],
                item['stage'],
                item['panel'],
                item['a'],
                item['b']
            ))

        print(f"[+] Created {len(grammar_items)} grammar items")

        # ===== 3. Create Vocabulary Items (14 items) =====
        print("\n[*] Creating vocabulary items...")

        vocab_items = [
            # VST format: word in context, select synonym
            {'word': 'happy', 'stem': 'She feels happy today.', 'options': {'A': 'joyful', 'B': 'angry', 'C': 'tired', 'D': 'hungry'}, 'correct': 'A', 'band': '1k', 'stage': 1, 'panel': 'routing', 'a': 0.8, 'b': -1.5},
            {'word': 'big', 'stem': 'The elephant is very big.', 'options': {'A': 'small', 'B': 'large', 'C': 'fast', 'D': 'slow'}, 'correct': 'B', 'band': '1k', 'stage': 1, 'panel': 'routing', 'a': 0.9, 'b': -1.3},
            {'word': 'begin', 'stem': 'Let us begin the meeting.', 'options': {'A': 'end', 'B': 'start', 'C': 'continue', 'D': 'stop'}, 'correct': 'B', 'band': '2k', 'stage': 1, 'panel': 'routing', 'a': 1.0, 'b': -0.9},

            {'word': 'purchase', 'stem': 'I need to purchase a new car.', 'options': {'A': 'sell', 'B': 'rent', 'C': 'buy', 'D': 'borrow'}, 'correct': 'C', 'band': '4k', 'stage': 2, 'panel': 'med', 'a': 1.2, 'b': 0.1},
            {'word': 'ancient', 'stem': 'We visited ancient ruins.', 'options': {'A': 'modern', 'B': 'new', 'C': 'old', 'D': 'young'}, 'correct': 'C', 'band': '4k', 'stage': 2, 'panel': 'med', 'a': 1.1, 'b': 0.0},
            {'word': 'demonstrate', 'stem': 'Can you demonstrate how it works?', 'options': {'A': 'hide', 'B': 'show', 'C': 'break', 'D': 'fix'}, 'correct': 'B', 'band': '6k', 'stage': 2, 'panel': 'med', 'a': 1.3, 'b': 0.3},

            {'word': 'ambiguous', 'stem': 'The message was ambiguous.', 'options': {'A': 'clear', 'B': 'vague', 'C': 'short', 'D': 'long'}, 'correct': 'B', 'band': '8k', 'stage': 2, 'panel': 'high', 'a': 1.5, 'b': 0.8},
            {'word': 'meticulous', 'stem': 'She is meticulous in her work.', 'options': {'A': 'careless', 'B': 'careful', 'C': 'fast', 'D': 'slow'}, 'correct': 'B', 'band': '10k', 'stage': 3, 'panel': 'med_high', 'a': 1.6, 'b': 1.0},
            {'word': 'obsolete', 'stem': 'This technology is obsolete.', 'options': {'A': 'new', 'B': 'outdated', 'C': 'expensive', 'D': 'cheap'}, 'correct': 'B', 'band': '10k', 'stage': 3, 'panel': 'med_high', 'a': 1.5, 'b': 0.9},

            {'word': 'paradigm', 'stem': 'A new paradigm emerged.', 'options': {'A': 'model', 'B': 'problem', 'C': 'solution', 'D': 'question'}, 'correct': 'A', 'band': '14k', 'stage': 3, 'panel': 'high_high', 'a': 1.7, 'b': 1.3},
            {'word': 'ephemeral', 'stem': 'The beauty was ephemeral.', 'options': {'A': 'permanent', 'B': 'temporary', 'C': 'ugly', 'D': 'bright'}, 'correct': 'B', 'band': '14k', 'stage': 3, 'panel': 'high_high', 'a': 1.8, 'b': 1.5},
            {'word': 'ubiquitous', 'stem': 'Smartphones are ubiquitous today.', 'options': {'A': 'rare', 'B': 'expensive', 'C': 'everywhere', 'D': 'useless'}, 'correct': 'C', 'band': '14k', 'stage': 3, 'panel': 'high_high', 'a': 1.7, 'b': 1.4},

            # Pseudoword (for detecting over-claiming)
            {'word': 'blurgle', 'stem': 'The scientist blurgled the data.', 'options': {'A': 'analyzed', 'B': 'deleted', 'C': 'created', 'D': 'ignored'}, 'correct': 'A', 'band': 'pseudo', 'stage': 2, 'panel': 'med', 'a': 0.5, 'b': 0.0},
            {'word': 'fribulate', 'stem': 'We need to fribulate the results.', 'options': {'A': 'verify', 'B': 'hide', 'C': 'share', 'D': 'forget'}, 'correct': 'A', 'band': 'pseudo', 'stage': 2, 'panel': 'high', 'a': 0.5, 'b': 0.5},
        ]

        for item in vocab_items:
            cursor.execute("""
                INSERT INTO items (
                    stem, options, correct_answer, domain, skill_tag,
                    stage, panel, discrimination, difficulty, guessing
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0.25)
                RETURNING id;
            """, (
                item['stem'],
                json.dumps(item['options']),
                item['correct'],
                'vocabulary',
                item['band'],
                item['stage'],
                item['panel'],
                item['a'],
                item['b']
            ))

        print(f"[+] Created {len(vocab_items)} vocabulary items")

        # ===== 4. Create Reading Items (13 items) =====
        print("\n[*] Creating reading items...")

        reading_items = [
            # Low passage (id: passage_ids[0])
            {'passage_id': passage_ids[0], 'stem': 'What is the main purpose of the library?', 'options': {'A': 'To eat lunch', 'B': 'A place to read and study', 'C': 'To play games', 'D': 'To watch movies'}, 'correct': 'B', 'text_type': 'expository', 'stage': 1, 'panel': 'routing', 'skill': 'main_idea', 'a': 0.9, 'b': -1.0},
            {'passage_id': passage_ids[0], 'stem': 'Who is Mrs. Johnson?', 'options': {'A': 'A teacher', 'B': 'A student', 'C': 'The librarian', 'D': 'The principal'}, 'correct': 'C', 'text_type': 'expository', 'stage': 2, 'panel': 'low', 'skill': 'detail', 'a': 0.8, 'b': -1.2},
            {'passage_id': passage_ids[0], 'stem': 'Why must students be quiet?', 'options': {'A': 'So everyone can concentrate', 'B': 'Because the librarian said so', 'C': 'To save energy', 'D': 'To sleep'}, 'correct': 'A', 'text_type': 'expository', 'stage': 2, 'panel': 'low', 'skill': 'inference', 'a': 1.0, 'b': -0.8},

            # Medium passage (id: passage_ids[1])
            {'passage_id': passage_ids[1], 'stem': 'What is the main challenge facing polar bears?', 'options': {'A': 'Too much ice', 'B': 'Climate change', 'C': 'Overpopulation', 'D': 'Lack of seals'}, 'correct': 'B', 'text_type': 'expository', 'stage': 1, 'panel': 'routing', 'skill': 'main_idea', 'a': 1.1, 'b': -0.3},
            {'passage_id': passage_ids[1], 'stem': 'How do polar bears primarily hunt seals?', 'options': {'A': 'On land', 'B': 'In the water', 'C': 'On sea ice', 'D': 'From the air'}, 'correct': 'C', 'text_type': 'expository', 'stage': 2, 'panel': 'med', 'skill': 'detail', 'a': 1.2, 'b': 0.0},
            {'passage_id': passage_ids[1], 'stem': 'What is the estimated population decline?', 'options': {'A': '10%', 'B': '20%', 'C': '30%', 'D': '50%'}, 'correct': 'C', 'text_type': 'expository', 'stage': 2, 'panel': 'med', 'skill': 'detail', 'a': 1.0, 'b': 0.2},
            {'passage_id': passage_ids[1], 'stem': 'What can be inferred about polar bears?', 'options': {'A': 'They can adapt easily', 'B': 'They are dependent on ice', 'C': 'They prefer warm weather', 'D': 'They eat only fish'}, 'correct': 'B', 'text_type': 'expository', 'stage': 2, 'panel': 'med', 'skill': 'inference', 'a': 1.3, 'b': 0.5},

            # High passage (id: passage_ids[2])
            {'passage_id': passage_ids[2], 'stem': 'What is the central paradox discussed?', 'options': {'A': 'More choices increase satisfaction', 'B': 'More choices decrease satisfaction', 'C': 'Choices do not matter', 'D': 'People prefer no choices'}, 'correct': 'B', 'text_type': 'argumentative', 'stage': 1, 'panel': 'routing', 'skill': 'main_idea', 'a': 1.4, 'b': 0.3},
            {'passage_id': passage_ids[2], 'stem': 'Who argues about decision paralysis?', 'options': {'A': 'Barry Schwartz', 'B': 'Barry White', 'C': 'Barry Allen', 'D': 'Barry Manilow'}, 'correct': 'A', 'text_type': 'argumentative', 'stage': 2, 'panel': 'high', 'skill': 'detail', 'a': 1.2, 'b': 0.7},
            {'passage_id': passage_ids[2], 'stem': 'What becomes more salient with more options?', 'options': {'A': 'Happiness', 'B': 'Opportunity cost', 'C': 'Satisfaction', 'D': 'Simplicity'}, 'correct': 'B', 'text_type': 'argumentative', 'stage': 3, 'panel': 'high_med', 'skill': 'detail', 'a': 1.5, 'b': 1.0},
            {'passage_id': passage_ids[2], 'stem': 'What are the implications mentioned?', 'options': {'A': 'Only personal', 'B': 'Only business', 'C': 'Marketing and policy', 'D': 'None'}, 'correct': 'C', 'text_type': 'argumentative', 'stage': 3, 'panel': 'high_high', 'skill': 'inference', 'a': 1.6, 'b': 1.2},
            {'passage_id': passage_ids[2], 'stem': 'What is the tone of the passage?', 'options': {'A': 'Humorous', 'B': 'Analytical', 'C': 'Emotional', 'D': 'Casual'}, 'correct': 'B', 'text_type': 'argumentative', 'stage': 3, 'panel': 'high_high', 'skill': 'tone', 'a': 1.7, 'b': 1.5},
            {'passage_id': passage_ids[2], 'stem': 'What does "salient" most likely mean?', 'options': {'A': 'Hidden', 'B': 'Unimportant', 'C': 'Noticeable', 'D': 'Forgettable'}, 'correct': 'C', 'text_type': 'argumentative', 'stage': 3, 'panel': 'high_high', 'skill': 'vocabulary', 'a': 1.5, 'b': 1.3},
        ]

        for item in reading_items:
            cursor.execute("""
                INSERT INTO items (
                    passage_id, stem, options, correct_answer, domain, text_type, skill_tag,
                    stage, panel, discrimination, difficulty, guessing
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0.25)
                RETURNING id;
            """, (
                item['passage_id'],
                item['stem'],
                json.dumps(item['options']),
                item['correct'],
                'reading',
                item['text_type'],
                item['skill'],
                item['stage'],
                item['panel'],
                item['a'],
                item['b']
            ))

        print(f"[+] Created {len(reading_items)} reading items")

        # Commit all changes
        conn.commit()

        print("\n" + "="*60)
        print("[SUCCESS] Sample data seeding complete!")
        print(f"[+] Total: {len(passages)} passages + {len(grammar_items) + len(vocab_items) + len(reading_items)} items")
        print(f"    - Grammar: {len(grammar_items)}")
        print(f"    - Vocabulary: {len(vocab_items)}")
        print(f"    - Reading: {len(reading_items)}")
        print("="*60)

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"\n[ERROR] Seeding failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = seed_data()
    sys.exit(0 if success else 1)
