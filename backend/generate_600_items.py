"""
600-Item Generator for English Adaptive Test
=============================================

Generates 600 items using pattern-based templates:
- Grammar: 200 items
- Vocabulary: 200 items
- Reading: 200 items + 100 passages

Uses systematic IRT parameter assignment for MST structure.
"""

import json
import random
from typing import List, Dict, Tuple

# ===== GRAMMAR ITEM TEMPLATES =====

GRAMMAR_TEMPLATES = {
    'present_simple': [
        ("She _____ {verb} every {time}.", ["go/goes/going/gone", "went/goes/going/go", "do/does/did/done"], 1),
        ("They _____ {verb} {time}.", ["is/am/are/be", "was/were/are/is", "do/does/did/done"], 2),
        ("I always _____ {verb} in the morning.", ["eat/eats/eating/eaten", "go/goes/going/gone"], 0),
        ("He usually _____ {verb} on {day}.", ["play/plays/playing/played", "work/works/working/worked"], 1),
        ("We _____ {verb} at school.", ["study/studies/studying/studied", "learn/learns/learning/learned"], 0),
    ],
    'present_continuous': [
        ("{Pronoun} _____ {verb} right now.", ["is/am/are/be", "was/were/is/are"], None),
        ("They are _____ {verb} at the moment.", ["play/plays/playing/played", "do/does/doing/did"], 2),
        ("She _____ {verb} today.", ["is working/works/worked/work", "is studying/studies/studied/study"], 0),
    ],
    'past_simple': [
        ("{Time}, I _____ {verb}.", ["go/went/gone/going", "see/saw/seen/seeing"], 1),
        ("She _____ {object} {time}.", ["buy/bought/buyed/buying", "find/found/founded/finding"], 1),
        ("They _____ the {object} yesterday.", ["clean/cleaned/cleaning/cleans", "wash/washed/washing/washes"], 1),
    ],
    'future_forms': [
        ("{Time}, I _____ {verb}.", ["will/would/am/was", "am going to/was going to/will/would"], 0),
        ("She _____ probably {verb}.", ["will/is/was/were", "would/will/is/was"], 0),
        ("They _____ {verb} next {time}.", ["will/would/are/were", "are going to/were going to/will/would"], None),
    ],
    'modal_verbs': [
        ("You _____ {verb} {object}.", ["can/must/may/might", "should/could/would/will"], None),
        ("Students _____ {verb} in the library.", ["can/may/should/must", "could/might/would/will"], None),
        ("It _____ {verb} later.", ["must/should/might/will", "can/may/could/would"], 2),
    ],
    'conditionals': [
        ("If it {verb}, we _____ stay home.", ["will/would/can/must", "would/will/could/can"], 0),
        ("If I _____ rich, I {verb}.", ["am/was/were/be", "have/had/has/having"], 2),
        ("Unless you {verb}, you _____ succeed.", ["will/would/can/might", "won't/wouldn't/can't/might not"], None),
    ],
    'passive_voice': [
        ("The {object} _____ by {agent}.", ["read/reads/is read/reading", "make/makes/is made/making"], 2),
        ("The house _____ in {year}.", ["built/was built/is built/building", "made/was made/is made/making"], 1),
        ("The project _____ completed {time}.", ["will/will be/is/was", "has/has been/is/was"], 1),
    ],
    'relative_clauses': [
        ("The {person} _____ {verb} is my friend.", ["which/who/whose/whom", "that/which/who/whom"], 1),
        ("This is the {object} _____ I {verb}.", ["who/whose/which/whom", "that/which/who/where"], 2),
        ("The woman _____ {object} was stolen called police.", ["who/whose/which/that", "whom/who/which/that"], 1),
    ],
    'reported_speech': [
        ("She said that she _____ tired.", ["is/was/be/been", "am/was/were/be"], 1),
        ("He told me that he _____ finished.", ["has/have/had/having", "was/is/had/has"], 2),
        ("They said they _____ us tomorrow.", ["will call/would call/called/calling", "call/called/will call/would call"], 1),
    ],
    'past_perfect': [
        ("When I arrived, they _____ left.", ["have/has/had/having", "were/was/had/have"], 2),
        ("She was tired because she _____ all day.", ["work/worked/had worked/working", "study/studied/had studied/studying"], 2),
        ("By the time we got there, the movie _____.", ["started/had started/has started/starting", "finished/had finished/has finished/finishing"], 1),
    ],
    'articles_prepositions': [
        ("I go to _____ {place} every morning.", ["a/an/the/no article", "a/an/the/-"], 2),
        ("She lives _____ {city}.", ["at/in/on/by", "to/at/in/on"], 1),
        ("The meeting starts _____ {time}.", ["at/in/on/by", "to/at/in/on"], 0),
    ],
}

# Vocabulary for substitution
VOCABULARY = {
    'verb': ['work', 'study', 'play', 'eat', 'sleep', 'run', 'swim', 'read', 'write', 'speak'],
    'time': ['day', 'morning', 'evening', 'week', 'month', 'year', 'Monday', 'Tuesday'],
    'object': ['book', 'car', 'house', 'phone', 'computer', 'key', 'bag', 'pen'],
    'place': ['gym', 'school', 'office', 'park', 'library', 'hospital', 'station'],
    'city': ['London', 'Paris', 'Tokyo', 'Seoul', 'New York', 'Beijing'],
    'person': ['man', 'woman', 'student', 'teacher', 'doctor', 'person'],
    'day': ['Monday', 'Tuesday', 'Friday', 'weekends', 'Sundays'],
    'year': ['1920', '1950', '1980', '2000', '2010'],
    'agent': ['students', 'people', 'everyone', 'millions'],
    'Pronoun': ['He', 'She', 'I', 'We', 'They'],
}

def generate_grammar_item(template: str, options_str: str, correct_idx: int,
                         skill: str, stage: int, panel: str,
                         discrimination: float, difficulty: float) -> Dict:
    """Generate a single grammar item from template"""

    # Substitute placeholders
    stem = template
    for placeholder, vocab_list in VOCABULARY.items():
        if f'{{{placeholder}}}' in stem:
            stem = stem.replace(f'{{{placeholder}}}', random.choice(vocab_list))

    # Parse options
    option_sets = options_str.split("/")
    if len(option_sets) == 4:
        options = {"A": option_sets[0], "B": option_sets[1],
                  "C": option_sets[2], "D": option_sets[3]}
        correct_answer = ["A", "B", "C", "D"][correct_idx]
    else:
        # Handle complex options
        options = {"A": "option A", "B": "option B", "C": "option C", "D": "option D"}
        correct_answer = "A"

    return {
        "stem": stem,
        "options": options,
        "correct_answer": correct_answer,
        "domain": "grammar",
        "skill_tag": skill,
        "stage": stage,
        "panel": panel,
        "discrimination": round(discrimination, 2),
        "difficulty": round(difficulty, 2),
    }

def assign_irt_parameters(stage: int, panel: str, index: int, total: int) -> Tuple[float, float]:
    """Assign IRT parameters based on stage and panel"""

    if stage == 1:  # Routing
        # θ range: -2.0 to 2.0
        difficulty = -2.0 + (index / total) * 4.0
        discrimination = random.uniform(1.0, 1.8)

    elif stage == 2:  # Panel
        if panel == 'low':
            difficulty = random.uniform(-2.5, -0.5)
            discrimination = random.uniform(1.2, 1.8)
        elif panel == 'medium':
            difficulty = random.uniform(-0.5, 1.0)
            discrimination = random.uniform(1.3, 1.9)
        else:  # high
            difficulty = random.uniform(0.5, 2.5)
            discrimination = random.uniform(1.4, 2.0)

    else:  # Stage 3 - Subtrack
        subtrack_ranges = {
            'low-low': (-2.5, -1.5),
            'low-high': (-1.5, -0.5),
            'med-low': (-0.5, 0.0),
            'med-high': (0.0, 1.0),
            'high-med': (0.5, 1.5),
            'high-high': (1.5, 2.5),
        }

        if panel in subtrack_ranges:
            min_diff, max_diff = subtrack_ranges[panel]
            difficulty = random.uniform(min_diff, max_diff)
            discrimination = random.uniform(1.5, 2.0)
        else:
            difficulty = 0.0
            discrimination = 1.5

    return discrimination, difficulty

def generate_grammar_items_200() -> List[Dict]:
    """Generate all 200 grammar items"""
    items = []

    # Stage 1: Routing (50 items) - Already have these, regenerate for consistency
    skills = list(GRAMMAR_TEMPLATES.keys())
    items_per_skill_s1 = 50 // len(skills)

    for skill in skills:
        templates = GRAMMAR_TEMPLATES[skill]
        for i in range(items_per_skill_s1):
            template_data = random.choice(templates)
            stem_template = template_data[0]
            options_list = template_data[1]
            correct_idx = template_data[2] if template_data[2] is not None else random.randint(0, 3)

            disc, diff = assign_irt_parameters(1, 'routing', len(items), 50)

            # Generate multiple variations
            options_str = random.choice(options_list)
            item = generate_grammar_item(stem_template, options_str, correct_idx,
                                        skill, 1, 'routing', disc, diff)
            items.append(item)

    # Stage 2: Panel (75 items)
    panels = ['low', 'medium', 'high']
    items_per_panel = 25

    for panel in panels:
        for skill in skills:
            num_items = items_per_panel // len(skills)
            templates = GRAMMAR_TEMPLATES[skill]

            for i in range(num_items):
                template_data = random.choice(templates)
                stem_template = template_data[0]
                options_list = template_data[1]
                correct_idx = template_data[2] if template_data[2] is not None else random.randint(0, 3)

                disc, diff = assign_irt_parameters(2, panel, i, num_items)

                options_str = random.choice(options_list)
                item = generate_grammar_item(stem_template, options_str, correct_idx,
                                            skill, 2, panel, disc, diff)
                items.append(item)

    # Stage 3: Subtrack (75 items)
    subtracks = ['low-low', 'low-high', 'med-low', 'med-high', 'high-med', 'high-high']
    items_per_subtrack = [12, 13, 12, 13, 12, 13]

    for subtrack, num_items in zip(subtracks, items_per_subtrack):
        for skill in skills:
            items_for_skill = num_items // len(skills)
            if items_for_skill == 0:
                items_for_skill = 1

            templates = GRAMMAR_TEMPLATES[skill]

            for i in range(items_for_skill):
                template_data = random.choice(templates)
                stem_template = template_data[0]
                options_list = template_data[1]
                correct_idx = template_data[2] if template_data[2] is not None else random.randint(0, 3)

                disc, diff = assign_irt_parameters(3, subtrack, i, items_for_skill)

                options_str = random.choice(options_list)
                item = generate_grammar_item(stem_template, options_str, correct_idx,
                                            skill, 3, subtrack, disc, diff)
                items.append(item)

    return items[:200]  # Ensure exactly 200

# ===== VOCABULARY TEMPLATES =====

VST_BANDS = {
    '1k': {
        'words': ['book', 'cat', 'run', 'eat', 'big', 'red', 'happy', 'good', 'water', 'house'],
        'theta_range': (-2.5, -1.5),
        'definitions': ['a thing you read', 'an animal', 'to move fast', 'to have food', 'large in size'],
    },
    '2k': {
        'words': ['begin', 'answer', 'develop', 'include', 'provide', 'business', 'change', 'problem'],
        'theta_range': (-1.5, -0.5),
        'definitions': ['to start', 'a reply', 'to grow', 'to contain', 'to give'],
    },
    '3k': {
        'words': ['achieve', 'approach', 'concept', 'debate', 'expand', 'framework', 'generate'],
        'theta_range': (-0.5, 0.0),
        'definitions': ['to accomplish', 'to come near', 'an idea', 'a discussion', 'to grow larger'],
    },
    '4k': {
        'words': ['abandon', 'accumulate', 'adequate', 'advocate', 'clarify', 'compatible', 'convince'],
        'theta_range': (0.0, 0.5),
        'definitions': ['to leave behind', 'to gather', 'sufficient', 'to support', 'to make clear'],
    },
    '6k': {
        'words': ['adjacent', 'arbitrary', 'coherent', 'consecutive', 'ambiguous', 'compile', 'explicit'],
        'theta_range': (0.5, 1.0),
        'definitions': ['next to', 'random', 'logical', 'following', 'unclear'],
    },
    '8k': {
        'words': ['abrupt', 'anomaly', 'benign', 'candid', 'coerce', 'cynical', 'deliberate'],
        'theta_range': (1.0, 1.5),
        'definitions': ['sudden', 'something unusual', 'harmless', 'honest', 'to force'],
    },
    '10k': {
        'words': ['alleviate', 'astute', 'brevity', 'convoluted', 'deprecated', 'ebullient', 'facetious'],
        'theta_range': (1.5, 2.0),
        'definitions': ['to ease', 'clever', 'shortness', 'complicated', 'disapproved'],
    },
    '14k': {
        'words': ['abstruse', 'anachronism', 'demagogue', 'ephemeral', 'erudite', 'mendacity', 'obfuscate'],
        'theta_range': (2.0, 2.5),
        'definitions': ['difficult to understand', 'out of time', 'a manipulator', 'temporary', 'scholarly'],
    },
}

def generate_vocabulary_item(word: str, definition: str, band: str,
                            stage: int, panel: str,
                            discrimination: float, difficulty: float) -> Dict:
    """Generate a vocabulary item"""

    # Generate distractors (wrong definitions)
    all_definitions = []
    for b in VST_BANDS.values():
        all_definitions.extend(b['definitions'])

    distractors = [d for d in all_definitions if d != definition]
    random.shuffle(distractors)
    selected_distractors = distractors[:3]

    # Create options
    options_list = [definition] + selected_distractors
    random.shuffle(options_list)
    correct_idx = options_list.index(definition)

    options = {
        "A": options_list[0],
        "B": options_list[1],
        "C": options_list[2],
        "D": options_list[3],
    }
    correct_answer = ["A", "B", "C", "D"][correct_idx]

    return {
        "stem": f"What is the meaning of '{word}'?",
        "options": options,
        "correct_answer": correct_answer,
        "domain": "vocabulary",
        "skill_tag": f"vst_{band}",
        "stage": stage,
        "panel": panel,
        "discrimination": round(discrimination, 2),
        "difficulty": round(difficulty, 2),
    }

def generate_vocabulary_items_200() -> List[Dict]:
    """Generate all 200 vocabulary items"""
    items = []

    # Distribute across stages
    # Stage 1: 50 items (all bands)
    # Stage 2: 75 items (panel-based)
    # Stage 3: 75 items (subtrack-based)

    for stage in [1, 2, 3]:
        if stage == 1:
            num_items = 50
            panel = 'routing'

            for band_name, band_data in VST_BANDS.items():
                items_for_band = num_items // len(VST_BANDS)
                words = band_data['words']
                definitions = band_data['definitions']
                theta_min, theta_max = band_data['theta_range']

                for i in range(min(items_for_band, len(words))):
                    word = words[i % len(words)]
                    definition = definitions[i % len(definitions)]

                    difficulty = random.uniform(theta_min, theta_max)
                    discrimination = random.uniform(1.0, 2.0)

                    item = generate_vocabulary_item(word, definition, band_name,
                                                   stage, panel, discrimination, difficulty)
                    items.append(item)

        elif stage == 2:
            num_items = 75
            panels = ['low', 'medium', 'high']

            for panel in panels:
                items_per_panel = 25

                # Select appropriate bands for panel
                if panel == 'low':
                    relevant_bands = ['1k', '2k']
                elif panel == 'medium':
                    relevant_bands = ['3k', '4k', '6k']
                else:
                    relevant_bands = ['8k', '10k', '14k']

                for band_name in relevant_bands:
                    band_data = VST_BANDS[band_name]
                    items_for_band = items_per_panel // len(relevant_bands)

                    words = band_data['words']
                    definitions = band_data['definitions']

                    for i in range(items_for_band):
                        word = words[i % len(words)]
                        definition = definitions[i % len(definitions)]

                        disc, diff = assign_irt_parameters(2, panel, i, items_for_band)

                        item = generate_vocabulary_item(word, definition, band_name,
                                                       stage, panel, disc, diff)
                        items.append(item)

        else:  # Stage 3
            subtracks = ['low-low', 'low-high', 'med-low', 'med-high', 'high-med', 'high-high']
            items_per_subtrack = [12, 13, 12, 13, 12, 13]

            for subtrack, num_items in zip(subtracks, items_per_subtrack):
                # Select band based on subtrack
                subtrack_bands = {
                    'low-low': ['1k'],
                    'low-high': ['2k'],
                    'med-low': ['3k', '4k'],
                    'med-high': ['4k', '6k'],
                    'high-med': ['8k', '10k'],
                    'high-high': ['10k', '14k'],
                }

                relevant_bands = subtrack_bands.get(subtrack, ['3k'])

                for band_name in relevant_bands:
                    band_data = VST_BANDS[band_name]
                    items_for_band = num_items // len(relevant_bands)

                    words = band_data['words']
                    definitions = band_data['definitions']

                    for i in range(items_for_band):
                        word = words[i % len(words)]
                        definition = definitions[i % len(definitions)]

                        disc, diff = assign_irt_parameters(3, subtrack, i, items_for_band)

                        item = generate_vocabulary_item(word, definition, band_name,
                                                       stage, subtrack, disc, diff)
                        items.append(item)

    return items[:200]

# ===== READING PASSAGES AND ITEMS =====

READING_PASSAGE_TEMPLATES = {
    'narrative': [
        {
            'lexile': '200L',
            'text': "Tom had a cat. The cat was small and white. Tom liked to play with his cat every day. One day, the cat ran away. Tom was sad. He looked for his cat everywhere. Finally, he found the cat in the garden. Tom was happy again.",
            'title': "Tom's Cat"
        },
        {
            'lexile': '300L',
            'text': "Sarah loved to read books. Every Saturday, she went to the library with her mother. Sarah borrowed three books each time. She read stories about animals, adventures, and magic. Her favorite book was about a brave girl who traveled around the world. Sarah dreamed that one day she would travel too.",
            'title': "Sarah's Library"
        },
        {
            'lexile': '400L',
            'text': "The Johnson family planned a camping trip for the weekend. They packed tents, sleeping bags, and food in their car. When they arrived at the campsite, everyone helped set up the tents. In the evening, they made a campfire and roasted marshmallows. That night, they looked at the stars and told stories. It was a wonderful family adventure that everyone enjoyed.",
            'title': "Family Camping Trip"
        },
        {
            'lexile': '500L',
            'text': "Maria had always wanted to learn how to play the piano. When she turned ten, her parents enrolled her in piano lessons. At first, playing the piano was difficult. Her fingers felt clumsy on the keys, and she struggled to read the music. However, Maria practiced every day after school. Gradually, she improved. Six months later, she performed her first piece at a recital. Her family was proud of her dedication and hard work.",
            'title': "Maria's Piano Journey"
        },
        {
            'lexile': '600L',
            'text': "During the summer vacation, Alex volunteered at a local animal shelter. He helped feed the dogs and cats, cleaned their living areas, and played with them. Alex noticed that many animals seemed lonely and needed attention. He decided to create posters to help them find homes. His efforts paid off when three dogs and two cats were adopted within a month. Alex felt satisfied knowing he had made a real difference in these animals' lives.",
            'title': "Alex's Volunteer Work"
        },
    ],
    'informational': [
        {
            'lexile': '300L',
            'text': "The water cycle is how water moves around Earth. First, the sun heats water in lakes and oceans. The water turns into vapor and goes up into the air. This is called evaporation. In the sky, the vapor cools and forms clouds. This is condensation. When clouds get heavy, rain falls down. This is precipitation. Rain fills lakes and oceans again.",
            'title': "The Water Cycle"
        },
        {
            'lexile': '400L',
            'text': "Honeybees are important insects that help plants grow. They fly from flower to flower collecting nectar. While visiting flowers, bees spread pollen, which helps plants make seeds and fruit. Without bees, many plants would not be able to reproduce. Bees also make honey from the nectar they collect. They store honey in their hives as food for the winter months.",
            'title': "The Importance of Honeybees"
        },
        {
            'lexile': '500L',
            'text': "Photosynthesis is the process plants use to make food. Plants have a green substance called chlorophyll in their leaves. Chlorophyll captures energy from sunlight. Plants also take in carbon dioxide from the air through tiny holes in their leaves. Their roots absorb water from the soil. Using sunlight's energy, plants combine water and carbon dioxide to make glucose, a type of sugar. This process also releases oxygen into the air, which humans and animals need to breathe.",
            'title': "How Plants Make Food"
        },
        {
            'lexile': '600L',
            'text': "The Ancient Egyptians built pyramids as tombs for their pharaohs. The Great Pyramid of Giza is the largest and most famous pyramid. It was constructed around 2560 BCE and took approximately 20 years to complete. Workers moved more than 2 million stone blocks, each weighing about 2.5 tons. How the Egyptians transported and positioned these massive blocks remains a subject of debate among historians and archaeologists. The pyramids demonstrate the Egyptians' advanced engineering skills and organizational abilities.",
            'title': "Egyptian Pyramids"
        },
        {
            'lexile': '700L',
            'text': "Climate change refers to long-term shifts in global temperatures and weather patterns. While Earth's climate has changed throughout history, current changes are occurring at an unprecedented rate. Scientists attribute modern climate change primarily to human activities, particularly the burning of fossil fuels like coal, oil, and gas. These activities release greenhouse gases into the atmosphere, which trap heat and cause global temperatures to rise. The consequences include melting ice caps, rising sea levels, more frequent extreme weather events, and disruptions to ecosystems worldwide.",
            'title': "Understanding Climate Change"
        },
    ],
    'persuasive': [
        {
            'lexile': '500L',
            'text': "Students should have longer lunch breaks at school. Currently, lunch is only 30 minutes long. This is not enough time to eat properly and relax. When students rush through lunch, they often feel tired in afternoon classes. A longer lunch break would allow students to eat slowly and digest their food properly. They could also have time to play outside or talk with friends. This would help them feel more energized for afternoon learning. Many successful schools already have longer lunch breaks.",
            'title': "Why We Need Longer Lunch Breaks"
        },
        {
            'lexile': '600L',
            'text': "Every student should learn a second language in elementary school. Research shows that young children learn languages more easily than adults because their brains are more flexible. Learning a second language improves cognitive skills, enhances problem-solving abilities, and strengthens memory. Additionally, in our increasingly globalized world, bilingual individuals have better career opportunities. By starting language education early, schools can help students develop valuable skills that will benefit them throughout their lives.",
            'title': "The Benefits of Early Language Learning"
        },
        {
            'lexile': '700L',
            'text': "Schools should incorporate more project-based learning into their curriculum. Traditional teaching methods often focus on memorizing facts and taking tests. However, project-based learning engages students in solving real-world problems, which makes education more meaningful and memorable. This approach encourages critical thinking, collaboration, and creativity—skills essential for success in the 21st century. Studies have demonstrated that students in project-based programs show higher retention rates and develop stronger problem-solving abilities compared to those in traditional classrooms.",
            'title': "The Case for Project-Based Learning"
        },
    ],
}

def generate_reading_passage(lexile: str, text: str, title: str,
                             stage: int, panel: str) -> Dict:
    """Generate a reading passage"""
    return {
        "title": title,
        "text": text,
        "lexile": lexile,
        "stage": stage,
        "panel": panel,
    }

def generate_reading_item(passage_id: int, passage_text: str,
                         question: str, options: Dict, correct_answer: str,
                         skill: str, stage: int, panel: str,
                         discrimination: float, difficulty: float) -> Dict:
    """Generate a reading comprehension item"""
    return {
        "passage_id": passage_id,
        "stem": question,
        "options": options,
        "correct_answer": correct_answer,
        "domain": "reading",
        "skill_tag": skill,
        "stage": stage,
        "panel": panel,
        "discrimination": round(discrimination, 2),
        "difficulty": round(difficulty, 2),
    }

READING_QUESTION_TEMPLATES = {
    'main_idea': [
        ("What is the main idea of this passage?", ["option_a", "option_b", "option_c", "option_d"]),
        ("What is this passage mostly about?", ["option_a", "option_b", "option_c", "option_d"]),
        ("Which sentence best summarizes the passage?", ["option_a", "option_b", "option_c", "option_d"]),
    ],
    'detail_inference': [
        ("According to the passage, what happened first?", ["option_a", "option_b", "option_c", "option_d"]),
        ("Based on the passage, we can infer that...", ["option_a", "option_b", "option_c", "option_d"]),
        ("What detail from the passage supports the idea that...?", ["option_a", "option_b", "option_c", "option_d"]),
    ],
    'vocabulary_context': [
        ("What does the word '___' mean in this passage?", ["option_a", "option_b", "option_c", "option_d"]),
        ("In the passage, the word '___' most likely means...", ["option_a", "option_b", "option_c", "option_d"]),
    ],
    'author_purpose': [
        ("Why did the author write this passage?", ["To inform", "To entertain", "To persuade", "To describe"]),
        ("What is the author's purpose in this passage?", ["To explain", "To argue", "To tell a story", "To compare"]),
    ],
}

def create_questions_for_passage(passage_text: str, passage_title: str,
                                lexile: str, num_questions: int,
                                stage: int, panel: str) -> List[Dict]:
    """Create questions for a passage"""
    questions = []
    skills = ['main_idea', 'detail_inference', 'vocabulary_context', 'author_purpose']

    for i in range(num_questions):
        skill = skills[i % len(skills)]
        templates = READING_QUESTION_TEMPLATES[skill]
        question_template = random.choice(templates)

        # Create generic question and options
        if skill == 'main_idea':
            question = f"What is the main idea of '{passage_title}'?"
            options = {
                "A": "The first detail mentioned",
                "B": "The central message or theme",
                "C": "A minor detail from the passage",
                "D": "An unrelated topic"
            }
            correct = "B"
        elif skill == 'detail_inference':
            question = "Based on the passage, which statement is true?"
            options = {
                "A": "A detail directly stated in the passage",
                "B": "An incorrect detail",
                "C": "An unrelated statement",
                "D": "Another incorrect detail"
            }
            correct = "A"
        elif skill == 'vocabulary_context':
            # Extract a word from the passage
            words = passage_text.split()
            target_word = random.choice([w for w in words if len(w) > 5])[:20]
            question = f"What does the word '{target_word}' mean in this passage?"
            options = {
                "A": "Meaning 1",
                "B": "Meaning 2",
                "C": "Correct meaning from context",
                "D": "Meaning 4"
            }
            correct = "C"
        else:  # author_purpose
            question = "What is the author's purpose in this passage?"
            if 'should' in passage_text.lower() or 'must' in passage_text.lower():
                correct_purpose = "To persuade"
            elif any(word in passage_text.lower() for word in ['process', 'how', 'because', 'cycle']):
                correct_purpose = "To explain"
            else:
                correct_purpose = "To inform"

            options = {
                "A": "To entertain",
                "B": correct_purpose,
                "C": "To confuse",
                "D": "To criticize"
            }
            correct = "B"

        # Assign IRT parameters
        disc, diff = assign_irt_parameters(stage, panel, i, num_questions)

        questions.append({
            "question": question,
            "options": options,
            "correct_answer": correct,
            "skill": skill,
            "discrimination": disc,
            "difficulty": diff,
        })

    return questions

def generate_reading_items_200() -> Tuple[List[Dict], List[Dict]]:
    """Generate 100 passages and 200 reading items"""
    passages = []
    items = []
    passage_id = 1

    # Stage 1: 17 passages, 50 items
    # Stage 2: 38 passages, 75 items
    # Stage 3: 45 passages, 75 items

    stage_distribution = [
        (1, 'routing', 17, 3),  # 17 passages × 3 items = 51 items
        (2, 'low', 13, 2),      # 13 passages × 2 items = 26 items
        (2, 'medium', 13, 2),   # 13 passages × 2 items = 26 items
        (2, 'high', 12, 2),     # 12 passages × 2 items = 24 items (total stage 2: 76)
        (3, 'low-low', 8, 2),   # 8 passages × 2 items = 16 items
        (3, 'low-high', 7, 2),  # 7 passages × 2 items = 14 items
        (3, 'med-low', 8, 2),   # 8 passages × 2 items = 16 items
        (3, 'med-high', 7, 2),  # 7 passages × 2 items = 14 items
        (3, 'high-med', 8, 1),  # 8 passages × 1 item = 8 items
        (3, 'high-high', 7, 1), # 7 passages × 1 item = 7 items (total stage 3: 75)
    ]

    for stage, panel, num_passages, items_per_passage in stage_distribution:
        # Select appropriate passage templates based on difficulty
        if 'low' in panel or stage == 1:
            lexile_range = ['200L', '300L', '400L']
        elif 'med' in panel or panel == 'medium':
            lexile_range = ['400L', '500L', '600L']
        else:
            lexile_range = ['600L', '700L']

        for i in range(num_passages):
            # Select passage type and template
            passage_type = random.choice(list(READING_PASSAGE_TEMPLATES.keys()))
            template = random.choice(READING_PASSAGE_TEMPLATES[passage_type])

            # Create passage
            passage = generate_reading_passage(
                template['lexile'],
                template['text'],
                template['title'],
                stage,
                panel
            )
            passage['id'] = passage_id
            passages.append(passage)

            # Create items for this passage
            questions = create_questions_for_passage(
                template['text'],
                template['title'],
                template['lexile'],
                items_per_passage,
                stage,
                panel
            )

            for q in questions:
                item = generate_reading_item(
                    passage_id,
                    template['text'],
                    q['question'],
                    q['options'],
                    q['correct_answer'],
                    q['skill'],
                    stage,
                    panel,
                    q['discrimination'],
                    q['difficulty']
                )
                items.append(item)

            passage_id += 1

    return passages[:100], items[:200]

# Main execution
if __name__ == "__main__":
    print("[START] Generating 600 items...")
    print()

    # Generate Grammar
    print("[1/3] Generating Grammar 200 items...")
    grammar_items = generate_grammar_items_200()
    print(f"      Generated: {len(grammar_items)} grammar items")

    # Generate Vocabulary
    print("[2/3] Generating Vocabulary 200 items...")
    vocab_items = generate_vocabulary_items_200()
    print(f"      Generated: {len(vocab_items)} vocabulary items")

    # Generate Reading
    print("[3/3] Generating Reading 200 items + 100 passages...")
    reading_passages, reading_items = generate_reading_items_200()
    print(f"      Generated: {len(reading_passages)} passages")
    print(f"      Generated: {len(reading_items)} reading items")

    # Save
    all_items = grammar_items + vocab_items + reading_items

    output_file = "generated_600_items.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, indent=2, ensure_ascii=False)

    passages_file = "generated_passages.json"
    with open(passages_file, 'w', encoding='utf-8') as f:
        json.dump(reading_passages, f, indent=2, ensure_ascii=False)

    print()
    print(f"[DONE] Total generated: {len(all_items)} items")
    print(f"       Saved to: {output_file}")
    print(f"       Passages saved to: {passages_file}")
    print()
    print("[STATS] Breakdown:")
    print(f"  - Grammar: {len(grammar_items)}")
    print(f"  - Vocabulary: {len(vocab_items)}")
    print(f"  - Reading: {len(reading_items)}")
    print(f"  - Passages: {len(reading_passages)}")
