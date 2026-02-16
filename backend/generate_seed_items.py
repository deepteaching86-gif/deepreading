"""
Seed Item Generator for English Adaptive Test
==============================================

Generates 600 high-quality test items across all MST stage/panel/domain
combinations using curated linguistic templates.

Output: seed_items_600.json (ready for bulk DB insertion)

Distribution:
- Grammar: 33% (198 items)
- Vocabulary: 40% (240 items)
- Reading: 27% (162 items)

All items are calibration_status='uncalibrated' — IRT parameters will be
determined through empirical calibration after student response collection.

Usage:
    python generate_seed_items.py
"""

import json
import random
import os
from datetime import datetime

random.seed(42)  # Reproducible generation

# =============================================================================
# DIFFICULTY TIERS: Maps to CEFR and stage/panel assignments
# =============================================================================
DIFFICULTY_TIERS = {
    'very_easy': {'range': (-2.0, -1.0), 'cefr': 'A1', 'grade': '1-3'},
    'easy':      {'range': (-1.0, -0.3), 'cefr': 'A2', 'grade': '3-5'},
    'medium':    {'range': (-0.3, 0.3),  'cefr': 'B1', 'grade': '5-7'},
    'hard':      {'range': (0.3, 1.0),   'cefr': 'B2', 'grade': '7-9'},
    'very_hard': {'range': (1.0, 2.0),   'cefr': 'C1', 'grade': '9-12'},
}

PANEL_DIFFICULTY = {
    (1, 'routing'):  ['very_easy', 'easy', 'medium'],
    (2, 'low'):      ['very_easy', 'easy'],
    (2, 'medium'):   ['easy', 'medium'],
    (2, 'high'):     ['medium', 'hard'],
    (3, 'low'):      ['easy', 'medium'],
    (3, 'medium'):   ['medium', 'hard'],
    (3, 'high'):     ['hard', 'very_hard'],
}

# =============================================================================
# GRAMMAR TEMPLATES
# =============================================================================
# Each template: (stem, correct, distractors, skill_tag, tier)
GRAMMAR_TEMPLATES = [
    # === SUBJECT-VERB AGREEMENT (very_easy ~ medium) ===
    ("The dog ___ in the park every morning.", "runs", ["run", "running", "runned"], ["apply", "subject_verb_agreement"], "very_easy"),
    ("My sister ___ to school by bus.", "goes", ["go", "going", "goed"], ["apply", "subject_verb_agreement"], "very_easy"),
    ("The children ___ playing outside.", "are", ["is", "am", "be"], ["apply", "subject_verb_agreement"], "very_easy"),
    ("She ___ a beautiful song yesterday.", "sang", ["singed", "sung", "sings"], ["apply", "past_tense"], "very_easy"),
    ("They ___ their homework every day.", "do", ["does", "doing", "did"], ["apply", "subject_verb_agreement"], "very_easy"),
    ("The cat ___ on the sofa right now.", "is sitting", ["are sitting", "sit", "sits"], ["apply", "present_continuous"], "very_easy"),
    ("He ___ to the store last night.", "went", ["goed", "goes", "going"], ["apply", "past_tense"], "very_easy"),
    ("We ___ happy to see you.", "are", ["is", "am", "be"], ["apply", "subject_verb_agreement"], "very_easy"),
    ("The bird ___ away when I opened the door.", "flew", ["flied", "flown", "fly"], ["apply", "past_tense"], "very_easy"),
    ("My mother ___ dinner for us every evening.", "cooks", ["cook", "cooking", "cooked"], ["apply", "subject_verb_agreement"], "very_easy"),

    # === ARTICLES (easy) ===
    ("I saw ___ elephant at the zoo.", "an", ["a", "the", "some"], ["apply", "articles"], "easy"),
    ("Please pass me ___ salt.", "the", ["a", "an", "some"], ["apply", "articles"], "easy"),
    ("She wants to be ___ doctor when she grows up.", "a", ["an", "the", "one"], ["apply", "articles"], "easy"),
    ("___ sun rises in the east.", "The", ["A", "An", "Some"], ["apply", "articles"], "easy"),
    ("He bought ___ umbrella because it was raining.", "an", ["a", "the", "one"], ["apply", "articles"], "easy"),
    ("We had ___ wonderful time at the party.", "a", ["an", "the", "one"], ["apply", "articles"], "easy"),
    ("___ United States is a large country.", "The", ["A", "An", "Some"], ["apply", "articles"], "easy"),
    ("I need ___ hour to finish this work.", "an", ["a", "the", "one"], ["apply", "articles"], "easy"),

    # === PREPOSITIONS (easy ~ medium) ===
    ("The book is ___ the table.", "on", ["in", "at", "to"], ["apply", "prepositions"], "easy"),
    ("She arrived ___ the airport at noon.", "at", ["in", "on", "to"], ["apply", "prepositions"], "easy"),
    ("We are going ___ vacation next week.", "on", ["in", "at", "to"], ["apply", "prepositions"], "easy"),
    ("He is interested ___ science.", "in", ["on", "at", "for"], ["apply", "prepositions"], "medium"),
    ("The meeting is ___ Monday.", "on", ["in", "at", "to"], ["apply", "prepositions"], "easy"),
    ("She was born ___ 1995.", "in", ["on", "at", "during"], ["apply", "prepositions"], "easy"),
    ("They depend ___ their parents for support.", "on", ["in", "at", "for"], ["apply", "prepositions"], "medium"),
    ("We congratulated her ___ her success.", "on", ["for", "in", "at"], ["apply", "prepositions"], "medium"),

    # === PRONOUNS (easy ~ medium) ===
    ("Tom and ___ went to the movies.", "I", ["me", "my", "mine"], ["apply", "pronouns"], "easy"),
    ("The teacher gave ___ the homework.", "us", ["we", "our", "ours"], ["apply", "pronouns"], "easy"),
    ("This is the girl ___ won the prize.", "who", ["which", "whom", "what"], ["apply", "relative_pronouns"], "medium"),
    ("The book ___ I borrowed was interesting.", "that", ["who", "whom", "what"], ["apply", "relative_pronouns"], "medium"),
    ("Each of the students must bring ___ own pencil.", "their", ["his", "its", "our"], ["apply", "pronouns"], "medium"),
    ("Neither of the options ___ acceptable.", "is", ["are", "were", "have been"], ["apply", "subject_verb_agreement"], "medium"),

    # === TENSES (easy ~ hard) ===
    ("I ___ breakfast before I came to school.", "had eaten", ["have eaten", "ate", "eat"], ["apply", "past_perfect"], "medium"),
    ("By next year, she ___ her degree.", "will have completed", ["will complete", "has completed", "completed"], ["apply", "future_perfect"], "hard"),
    ("He ___ here since 2010.", "has lived", ["lives", "lived", "is living"], ["apply", "present_perfect"], "medium"),
    ("While I ___ dinner, the phone rang.", "was cooking", ["cooked", "am cooking", "have cooked"], ["apply", "past_continuous"], "medium"),
    ("She ___ English for five years now.", "has been studying", ["studies", "studied", "is studying"], ["apply", "present_perfect_continuous"], "hard"),
    ("If it rains tomorrow, we ___ stay home.", "will", ["would", "shall", "can"], ["apply", "conditionals_first"], "medium"),
    ("If I ___ you, I would accept the offer.", "were", ["was", "am", "would be"], ["apply", "conditionals_second"], "hard"),
    ("They ___ the project by the time we arrive.", "will have finished", ["will finish", "have finished", "finished"], ["apply", "future_perfect"], "hard"),

    # === COMPARATIVES & SUPERLATIVES (easy ~ medium) ===
    ("She is ___ than her sister.", "taller", ["more tall", "tallest", "most tall"], ["apply", "comparatives"], "easy"),
    ("This is the ___ movie I have ever seen.", "best", ["most good", "better", "goodest"], ["apply", "superlatives"], "easy"),
    ("He runs ___ than his brother.", "faster", ["more fast", "fastest", "most fast"], ["apply", "comparatives"], "easy"),
    ("Of all the students, Maria is the ___.", "most intelligent", ["more intelligent", "intelligentest", "most intelligenter"], ["apply", "superlatives"], "medium"),
    ("The weather today is ___ than yesterday.", "worse", ["more bad", "worst", "badder"], ["apply", "comparatives"], "medium"),

    # === PASSIVE VOICE (medium ~ hard) ===
    ("The cake ___ by my grandmother.", "was made", ["made", "is making", "has making"], ["understand", "passive_voice"], "medium"),
    ("English ___ in many countries.", "is spoken", ["speaks", "is speaking", "has spoken"], ["understand", "passive_voice"], "medium"),
    ("The letter ___ yesterday.", "was sent", ["sent", "is sent", "has sending"], ["understand", "passive_voice"], "medium"),
    ("The new bridge ___ by next year.", "will be completed", ["will complete", "is completing", "has completed"], ["understand", "passive_voice"], "hard"),
    ("The homework must ___ before Friday.", "be submitted", ["submit", "be submitting", "submitted"], ["understand", "passive_voice"], "hard"),

    # === CONJUNCTIONS (easy ~ medium) ===
    ("I like tea ___ my sister prefers coffee.", "but", ["and", "so", "because"], ["apply", "conjunctions"], "easy"),
    ("She studied hard ___ she wanted to pass.", "because", ["but", "so", "although"], ["apply", "conjunctions"], "easy"),
    ("___ it was raining, we still went outside.", "Although", ["Because", "So", "And"], ["apply", "conjunctions"], "medium"),
    ("He is not only smart ___ also hardworking.", "but", ["and", "or", "yet"], ["apply", "correlative_conjunctions"], "medium"),

    # === MODAL VERBS (medium ~ hard) ===
    ("You ___ wear a seatbelt in the car.", "must", ["can", "may", "might"], ["understand", "modal_verbs"], "medium"),
    ("She ___ be at home; her car is in the driveway.", "must", ["can", "should", "would"], ["analyze", "modal_verbs"], "hard"),
    ("You ___ have told me earlier!", "should", ["must", "can", "will"], ["analyze", "modal_verbs"], "hard"),
    ("He ___ swim when he was five years old.", "could", ["can", "may", "might"], ["apply", "modal_verbs"], "medium"),

    # === WORD ORDER (easy ~ medium) ===
    ("Which sentence is correct?", "She always drinks coffee in the morning.", ["She drinks always coffee in the morning.", "Always she drinks coffee in the morning.", "She drinks coffee always in the morning."], ["apply", "word_order"], "easy"),
    ("Which sentence is correct?", "I have never been to Japan.", ["I never have been to Japan.", "Never I have been to Japan.", "I have been never to Japan."], ["apply", "word_order"], "medium"),

    # === REPORTED SPEECH (hard ~ very_hard) ===
    ('She said, "I am tired." → She said that she ___ tired.', "was", ["is", "has been", "were"], ["apply", "reported_speech"], "hard"),
    ('He asked me where I ___.',  "lived", ["live", "am living", "do live"], ["apply", "reported_speech"], "hard"),
    ('The teacher told us that the Earth ___ round the Sun.', "revolves", ["revolved", "has revolved", "is revolving"], ["analyze", "reported_speech"], "very_hard"),

    # === GERUNDS & INFINITIVES (hard ~ very_hard) ===
    ("She enjoys ___ novels in her free time.", "reading", ["to read", "read", "reads"], ["apply", "gerunds_infinitives"], "hard"),
    ("He decided ___ abroad for his studies.", "to go", ["going", "go", "went"], ["apply", "gerunds_infinitives"], "hard"),
    ("I remember ___ the door before I left.", "locking", ["to lock", "lock", "locked"], ["analyze", "gerunds_infinitives"], "very_hard"),
    ("She stopped ___ to take a deep breath.", "running", ["to run", "run", "ran"], ["analyze", "gerunds_infinitives"], "very_hard"),

    # === SUBJUNCTIVE / ADVANCED (very_hard) ===
    ("It is essential that he ___ on time.", "be", ["is", "was", "will be"], ["analyze", "subjunctive"], "very_hard"),
    ("The professor suggested that she ___ the paper again.", "rewrite", ["rewrites", "rewriting", "would rewrite"], ["analyze", "subjunctive"], "very_hard"),
    ("Had I known about the exam, I ___ harder.", "would have studied", ["would study", "had studied", "will study"], ["analyze", "conditionals_third"], "very_hard"),
    ("Not until she arrived ___ the meeting begin.", "did", ["was", "had", "has"], ["analyze", "inversion"], "very_hard"),
    ("Seldom ___ such a beautiful sunset.", "have I seen", ["I have seen", "I saw", "did I saw"], ["analyze", "inversion"], "very_hard"),
]

# =============================================================================
# VOCABULARY TEMPLATES
# =============================================================================
# (stem_with_context, correct, distractors, skill_tags, tier)
VOCABULARY_TEMPLATES = [
    # === VERY EASY (1k band - A1) ===
    ("The opposite of 'big' is ___.", "small", ["tall", "fast", "old"], ["understand", "antonyms"], "very_easy"),
    ("A person who teaches at a school is called a ___.", "teacher", ["doctor", "driver", "farmer"], ["remember", "word_meaning"], "very_easy"),
    ("Which word means 'happy'?", "glad", ["sad", "angry", "tired"], ["understand", "synonyms"], "very_easy"),
    ("The ___ shines brightly during the day.", "sun", ["moon", "star", "rain"], ["apply", "word_in_context"], "very_easy"),
    ("She was very ___ after running a long race.", "tired", ["angry", "hungry", "scared"], ["apply", "word_in_context"], "very_easy"),
    ("We use a ___ to cut paper.", "scissors", ["pencil", "ruler", "eraser"], ["remember", "word_meaning"], "very_easy"),
    ("The opposite of 'hot' is ___.", "cold", ["warm", "cool", "wet"], ["understand", "antonyms"], "very_easy"),
    ("A ___ is a place where we borrow books.", "library", ["hospital", "restaurant", "museum"], ["remember", "word_meaning"], "very_easy"),
    ("He ___ the ball to his friend across the field.", "threw", ["flew", "grew", "drew"], ["apply", "word_in_context"], "very_easy"),
    ("Which word means 'to speak'?", "talk", ["walk", "look", "write"], ["understand", "synonyms"], "very_easy"),
    ("She wore a warm ___ because it was snowing outside.", "coat", ["shirt", "skirt", "hat"], ["apply", "word_in_context"], "very_easy"),
    ("The baby was ___ because she wanted milk.", "crying", ["laughing", "sleeping", "playing"], ["apply", "word_in_context"], "very_easy"),

    # === EASY (2k band - A2) ===
    ("'Enormous' means the same as ___.", "very large", ["very small", "very fast", "very old"], ["understand", "synonyms"], "easy"),
    ("If something is 'fragile,' it breaks ___.", "easily", ["slowly", "loudly", "quietly"], ["understand", "word_meaning"], "easy"),
    ("The farmer grows vegetables in the ___.", "field", ["forest", "factory", "office"], ["apply", "word_in_context"], "easy"),
    ("To 'vanish' means to ___.", "disappear", ["appear", "arrive", "approach"], ["understand", "word_meaning"], "easy"),
    ("She felt ___ after winning the competition.", "proud", ["ashamed", "worried", "bored"], ["apply", "word_in_context"], "easy"),
    ("The opposite of 'ancient' is ___.", "modern", ["broken", "gentle", "simple"], ["understand", "antonyms"], "easy"),
    ("He made a ___ to study harder next semester.", "promise", ["problem", "project", "program"], ["apply", "word_in_context"], "easy"),
    ("A ___ is someone who travels to a new country to live there.", "immigrant", ["tourist", "neighbor", "stranger"], ["understand", "word_meaning"], "easy"),
    ("The students were ___ about the upcoming field trip.", "excited", ["confused", "disappointed", "nervous"], ["apply", "word_in_context"], "easy"),
    ("Which word means 'to fix something that is broken'?", "repair", ["replace", "remove", "return"], ["understand", "word_meaning"], "easy"),
    ("The weather was ___, so we decided to have a picnic.", "pleasant", ["terrible", "unusual", "dangerous"], ["apply", "word_in_context"], "easy"),
    ("To 'hesitate' means to ___ before doing something.", "pause", ["rush", "forget", "refuse"], ["understand", "word_meaning"], "easy"),

    # === MEDIUM (3k-4k band - B1) ===
    ("The scientist made a significant ___ in cancer research.", "breakthrough", ["breakdown", "breakout", "breakaway"], ["analyze", "word_in_context"], "medium"),
    ("She spoke with great ___ about her experience.", "enthusiasm", ["confusion", "suspicion", "reluctance"], ["apply", "word_in_context"], "medium"),
    ("The company decided to ___ its operations to other countries.", "expand", ["expose", "explore", "exploit"], ["understand", "word_meaning"], "medium"),
    ("His argument was very ___ and changed my mind.", "persuasive", ["permissive", "pervasive", "persistent"], ["analyze", "word_in_context"], "medium"),
    ("The ___ between the two countries lasted for decades.", "conflict", ["contract", "contact", "content"], ["apply", "word_in_context"], "medium"),
    ("To 'collaborate' means to ___.", "work together", ["compete against", "argue with", "separate from"], ["understand", "word_meaning"], "medium"),
    ("The medication helped to ___ the patient's pain.", "relieve", ["receive", "retrieve", "review"], ["apply", "word_in_context"], "medium"),
    ("She showed great ___ by helping the elderly woman.", "compassion", ["competition", "comprehension", "compensation"], ["analyze", "word_in_context"], "medium"),
    ("The evidence was not ___ enough to prove his guilt.", "sufficient", ["suspicious", "superficial", "subsequent"], ["apply", "word_in_context"], "medium"),
    ("A 'dilemma' is a situation where you must ___.", "choose between difficult options", ["solve an easy problem", "follow simple rules", "repeat a familiar task"], ["understand", "word_meaning"], "medium"),
    ("The teacher asked the students to ___ their findings to the class.", "present", ["prevent", "pretend", "preserve"], ["apply", "word_in_context"], "medium"),
    ("Which word best describes someone who is easy to talk to?", "approachable", ["aggressive", "arrogant", "anxious"], ["understand", "word_meaning"], "medium"),

    # === HARD (6k-8k band - B2) ===
    ("The politician's speech was full of ___, saying nothing meaningful.", "rhetoric", ["realism", "resources", "resilience"], ["analyze", "word_in_context"], "hard"),
    ("The new policy was designed to ___ economic growth.", "stimulate", ["simulate", "stipulate", "stagnate"], ["apply", "word_in_context"], "hard"),
    ("Her ___ to the project was invaluable; without her, it would have failed.", "contribution", ["contradiction", "contemplation", "conservation"], ["apply", "word_in_context"], "hard"),
    ("The journalist tried to ___ the facts behind the scandal.", "uncover", ["undermine", "undertake", "undergo"], ["understand", "word_meaning"], "hard"),
    ("'Ambiguous' means ___.", "having more than one meaning", ["having a clear meaning", "having no meaning", "having a hidden meaning"], ["understand", "word_meaning"], "hard"),
    ("The company's profits have ___ significantly over the past year.", "diminished", ["distinguished", "distributed", "dismissed"], ["apply", "word_in_context"], "hard"),
    ("She demonstrated remarkable ___ in the face of adversity.", "resilience", ["resistance", "resemblance", "relevance"], ["analyze", "word_in_context"], "hard"),
    ("The government plans to ___ new regulations next month.", "implement", ["implicate", "imply", "impose"], ["apply", "word_in_context"], "hard"),
    ("A 'paradigm' is best described as ___.", "a model or pattern", ["a type of argument", "a kind of theory", "a form of evidence"], ["understand", "word_meaning"], "hard"),
    ("The teacher's ___ criticism helped the student improve.", "constructive", ["destructive", "restrictive", "instinctive"], ["analyze", "word_in_context"], "hard"),
    ("To 'mitigate' a problem means to ___.", "make it less severe", ["make it worse", "ignore it completely", "create a new one"], ["understand", "word_meaning"], "hard"),
    ("The artist's work was ___ by critics for its originality.", "acclaimed", ["accused", "acquired", "abandoned"], ["apply", "word_in_context"], "hard"),

    # === VERY HARD (14k band - C1) ===
    ("The author's ___ tone made the essay difficult to take seriously.", "sardonic", ["sincere", "solemn", "subtle"], ["analyze", "word_in_context"], "very_hard"),
    ("The scientist's findings were ___, challenging existing theories.", "groundbreaking", ["grounding", "groundless", "groundwork"], ["apply", "word_in_context"], "very_hard"),
    ("'Ubiquitous' means ___.", "found everywhere", ["extremely rare", "completely invisible", "partly hidden"], ["understand", "word_meaning"], "very_hard"),
    ("The committee reached a ___ after hours of debate.", "consensus", ["consequence", "concession", "conception"], ["apply", "word_in_context"], "very_hard"),
    ("Her ___ behavior at the meeting offended several colleagues.", "brusque", ["benign", "benevolent", "buoyant"], ["analyze", "word_in_context"], "very_hard"),
    ("To 'exacerbate' a situation means to ___.", "make it worse", ["make it better", "explain it clearly", "avoid it entirely"], ["understand", "word_meaning"], "very_hard"),
    ("The politician's ___ remarks alienated many voters.", "inflammatory", ["informative", "influential", "innovative"], ["analyze", "word_in_context"], "very_hard"),
    ("'Ephemeral' describes something that is ___.", "short-lived", ["long-lasting", "extremely large", "deeply meaningful"], ["understand", "word_meaning"], "very_hard"),
    ("The professor's ___ lecture put many students to sleep.", "tedious", ["tremendous", "tentative", "tenacious"], ["apply", "word_in_context"], "very_hard"),
    ("A 'panacea' is ___.", "a solution for all problems", ["a type of disease", "a scientific method", "a legal document"], ["understand", "word_meaning"], "very_hard"),
    ("The evidence was merely ___, not conclusive.", "circumstantial", ["constitutional", "consequential", "controversial"], ["analyze", "word_in_context"], "very_hard"),
    ("To 'obfuscate' means to ___.", "make unclear or confusing", ["make simple and clear", "make loud and obvious", "make strong and powerful"], ["understand", "word_meaning"], "very_hard"),
]

# =============================================================================
# READING PASSAGES & QUESTIONS
# =============================================================================
READING_PASSAGES = [
    # === VERY EASY (A1) ===
    {
        "title": "My Pet Cat",
        "content": "I have a cat named Whiskers. She is orange and white. Whiskers likes to sleep on my bed. She also likes to play with a ball of yarn. Every morning, I give her food and water. Whiskers is my best friend.",
        "tier": "very_easy",
        "questions": [
            ("What is the cat's name?", "Whiskers", ["Fluffy", "Tiger", "Snowball"], ["remember", "detail"]),
            ("What color is the cat?", "Orange and white", ["Black and white", "Gray and brown", "All orange"], ["remember", "detail"]),
            ("What does the cat like to sleep on?", "The narrator's bed", ["The sofa", "The floor", "A cat bed"], ["remember", "detail"]),
        ]
    },
    {
        "title": "At the Park",
        "content": "Today is Saturday. Mom took us to the park. My brother played on the swings. I climbed the big slide. We ate sandwiches for lunch under a tree. After lunch, we fed the ducks at the pond. It was a fun day.",
        "tier": "very_easy",
        "questions": [
            ("What day is it in the story?", "Saturday", ["Sunday", "Monday", "Friday"], ["remember", "detail"]),
            ("What did they eat for lunch?", "Sandwiches", ["Pizza", "Hot dogs", "Hamburgers"], ["remember", "detail"]),
            ("What did they do after lunch?", "Fed the ducks", ["Played on swings", "Went home", "Climbed the slide"], ["remember", "sequence"]),
        ]
    },
    {
        "title": "The Lost Puppy",
        "content": "Sara found a small puppy in her garden. The puppy was wet and cold. Sara brought it inside and gave it warm milk. She put up signs around the neighborhood. The next day, a boy came to her door. It was his puppy! He was very happy.",
        "tier": "very_easy",
        "questions": [
            ("Where did Sara find the puppy?", "In her garden", ["At the park", "On the street", "At school"], ["remember", "detail"]),
            ("Why did Sara put up signs?", "To find the puppy's owner", ["To sell the puppy", "To warn about dogs", "To invite friends"], ["understand", "inference"]),
            ("How did the story end?", "The owner found his puppy", ["Sara kept the puppy", "The puppy ran away", "No one came for the puppy"], ["understand", "main_idea"]),
        ]
    },
    # === EASY (A2) ===
    {
        "title": "The Water Cycle",
        "content": "Water moves in a cycle. The sun heats water in oceans and lakes. The water turns into vapor and rises into the sky. High up, the vapor cools and forms clouds. When clouds get heavy with water, rain falls back to Earth. The rain flows into rivers and back to the ocean. Then the cycle starts again.",
        "tier": "easy",
        "questions": [
            ("What heats the water in oceans and lakes?", "The sun", ["The moon", "The wind", "The rain"], ["remember", "detail"]),
            ("What happens when vapor cools in the sky?", "It forms clouds", ["It becomes ice", "It disappears", "It falls as snow"], ["understand", "detail"]),
            ("What is the main idea of this passage?", "Water moves in a continuous cycle", ["Rain is important for plants", "The sun is very hot", "Clouds are made of ice"], ["analyze", "main_idea"]),
        ]
    },
    {
        "title": "Bees and Honey",
        "content": "Bees are amazing insects. They live together in a group called a colony. Worker bees fly from flower to flower collecting nectar. They bring the nectar back to the hive and turn it into honey. Bees also help plants grow by carrying pollen between flowers. Without bees, many fruits and vegetables would not grow.",
        "tier": "easy",
        "questions": [
            ("What is a group of bees called?", "A colony", ["A flock", "A herd", "A pack"], ["remember", "detail"]),
            ("How do bees help plants grow?", "By carrying pollen between flowers", ["By eating insects", "By making honey", "By building nests"], ["understand", "detail"]),
            ("Why are bees considered 'amazing' in this passage?", "They make honey and help plants grow", ["They can fly very fast", "They live for a long time", "They are very colorful"], ["analyze", "inference"]),
        ]
    },
    {
        "title": "Thomas Edison",
        "content": "Thomas Edison was a famous inventor. He was born in 1847 in Ohio. As a child, Edison was curious about everything. He tried many experiments. His most famous invention was the light bulb. Edison also invented the phonograph, which could record and play sound. He once said, 'Genius is one percent inspiration and ninety-nine percent perspiration.'",
        "tier": "easy",
        "questions": [
            ("Where was Thomas Edison born?", "Ohio", ["New York", "California", "Texas"], ["remember", "detail"]),
            ("What does the word 'perspiration' mean in Edison's quote?", "Hard work", ["Sweat", "Thinking", "Luck"], ["analyze", "vocabulary_in_context"]),
            ("What is the main point of this passage?", "Edison was a great inventor who worked very hard", ["Edison invented only the light bulb", "Edison was born in a big city", "Edison was always lucky"], ["understand", "main_idea"]),
        ]
    },
    # === MEDIUM (B1) ===
    {
        "title": "Sleep and Learning",
        "content": "Scientists have discovered that sleep plays a crucial role in learning. During sleep, the brain processes information from the day and stores important memories. Students who get enough sleep perform better on tests than those who stay up late studying. Research shows that 8 to 10 hours of sleep is ideal for teenagers. Lack of sleep can affect concentration, mood, and even physical health.",
        "tier": "medium",
        "questions": [
            ("According to the passage, what happens during sleep?", "The brain processes and stores information", ["The brain stops working completely", "The body grows taller", "New brain cells are created"], ["understand", "detail"]),
            ("How many hours of sleep is ideal for teenagers?", "8 to 10 hours", ["5 to 7 hours", "10 to 12 hours", "6 to 8 hours"], ["remember", "detail"]),
            ("What can we infer from this passage?", "Staying up all night to study may actually hurt test performance", ["Sleep is only important for adults", "Studying is more important than sleeping", "All students sleep the same amount"], ["analyze", "inference"]),
        ]
    },
    {
        "title": "The Great Barrier Reef",
        "content": "The Great Barrier Reef is the world's largest coral reef system, stretching over 2,300 kilometers along Australia's northeast coast. It is home to thousands of species of fish, coral, and other marine life. However, rising ocean temperatures and pollution threaten the reef's survival. Scientists warn that without action, much of the reef could be destroyed within decades. Conservation efforts are underway to protect this natural wonder.",
        "tier": "medium",
        "questions": [
            ("Where is the Great Barrier Reef located?", "Along Australia's northeast coast", ["Near the coast of Africa", "In the Pacific Islands", "Along South America's coast"], ["remember", "detail"]),
            ("What threatens the Great Barrier Reef?", "Rising ocean temperatures and pollution", ["Too many fish", "Strong ocean currents", "Volcanic eruptions"], ["understand", "detail"]),
            ("The author's purpose in writing this passage is to ___.", "inform readers about the reef and its dangers", ["persuade people to visit Australia", "entertain with a story about fish", "explain how coral grows"], ["evaluate", "author_purpose"]),
        ]
    },
    {
        "title": "Digital Citizenship",
        "content": "Being a good digital citizen means using technology responsibly. This includes protecting personal information online, being respectful in digital communications, and thinking critically about information found on the internet. Cyberbullying is a serious problem that affects many young people. Experts recommend that students learn to recognize unreliable sources and verify information before sharing it. Responsible technology use is an essential skill for the modern world.",
        "tier": "medium",
        "questions": [
            ("What does 'digital citizenship' mean?", "Using technology responsibly", ["Owning a computer", "Living in a digital city", "Being famous online"], ["understand", "vocabulary_in_context"]),
            ("According to the passage, what should students learn to do?", "Recognize unreliable sources and verify information", ["Use social media more often", "Share information quickly", "Avoid using the internet"], ["understand", "detail"]),
            ("What is the author's attitude toward technology?", "Technology is useful but should be used responsibly", ["Technology is dangerous and should be avoided", "Technology is always beneficial", "Technology is only for adults"], ["analyze", "tone"]),
        ]
    },
    # === HARD (B2) ===
    {
        "title": "The Psychology of Color",
        "content": "Colors can significantly influence human behavior and emotions. Restaurants often use red and yellow in their decor because these colors stimulate appetite. Blue, on the other hand, is associated with calmness and trust, which is why many banks and technology companies use it in their branding. Studies have shown that the color of a room can affect productivity; workers in blue rooms tend to be more creative, while those in red rooms are more detail-oriented. However, cultural context matters — white symbolizes purity in Western cultures but mourning in some Asian cultures.",
        "tier": "hard",
        "questions": [
            ("Why do restaurants often use red and yellow colors?", "These colors stimulate appetite", ["These colors are cheaper", "Customers prefer these colors", "These colors hide stains"], ["understand", "detail"]),
            ("What does the passage suggest about the effect of room color on workers?", "Different colors promote different types of thinking", ["All colors have the same effect", "Only blue rooms improve productivity", "Color has no real effect on workers"], ["analyze", "inference"]),
            ("What point does the author make about cultural context?", "The meaning of colors varies across cultures", ["Western cultures understand colors better", "Asian cultures do not use colors", "Color psychology is universal"], ["evaluate", "main_idea"]),
        ]
    },
    {
        "title": "Artificial Intelligence Ethics",
        "content": "As artificial intelligence becomes more integrated into daily life, ethical concerns are growing. AI systems used in hiring can perpetuate existing biases if trained on biased data. Facial recognition technology has been shown to be less accurate for people with darker skin tones. Additionally, the use of AI in autonomous vehicles raises questions about accountability when accidents occur. Experts argue that developing ethical guidelines for AI is not just a technical challenge but a societal one, requiring input from diverse perspectives including ethicists, engineers, and affected communities.",
        "tier": "hard",
        "questions": [
            ("What problem can AI hiring systems have?", "They can perpetuate existing biases", ["They always choose the best candidate", "They are too slow", "They are too expensive"], ["understand", "detail"]),
            ("Why does the author mention facial recognition technology?", "To show that AI can have accuracy problems related to race", ["To promote new technology", "To explain how cameras work", "To describe police methods"], ["analyze", "author_purpose"]),
            ("What does the passage suggest about solving AI ethics problems?", "It requires input from many different groups, not just engineers", ["Only engineers can solve these problems", "The problems are unsolvable", "Government should ban AI entirely"], ["evaluate", "inference"]),
        ]
    },
    {
        "title": "Ocean Acidification",
        "content": "The world's oceans absorb approximately 30% of the carbon dioxide produced by human activities. While this has helped slow climate change, it has come at a significant cost: ocean acidification. As CO2 dissolves in seawater, it forms carbonic acid, lowering the ocean's pH. This process threatens marine organisms that build shells and skeletons from calcium carbonate, including corals, oysters, and certain plankton species. Since these organisms form the base of many marine food chains, ocean acidification could have cascading effects throughout marine ecosystems.",
        "tier": "hard",
        "questions": [
            ("What percentage of human-produced CO2 do oceans absorb?", "Approximately 30%", ["About 10%", "Nearly 50%", "Over 70%"], ["remember", "detail"]),
            ("What is the meaning of 'cascading effects' in this context?", "Problems that spread through connected systems", ["Effects that happen suddenly", "Effects that only affect one species", "Effects that improve over time"], ["analyze", "vocabulary_in_context"]),
            ("What is the central argument of this passage?", "Ocean CO2 absorption helps climate but harms marine life", ["Oceans are becoming cleaner", "Marine life is adapting well to changes", "Carbon dioxide is not harmful"], ["evaluate", "main_idea"]),
        ]
    },
    # === VERY HARD (C1) ===
    {
        "title": "The Paradox of Choice",
        "content": "Psychologist Barry Schwartz argues that an abundance of choice, rather than liberating consumers, can lead to anxiety and dissatisfaction. In his research, Schwartz distinguishes between 'maximizers' — those who exhaustively search for the best option — and 'satisficers' — those who settle for an option that meets their criteria. Maximizers, despite often making objectively better choices, tend to experience more regret and less satisfaction with their decisions. This phenomenon suggests that the relationship between freedom of choice and well-being is not linear but follows an inverted U-curve: some choice is beneficial, but too much becomes counterproductive.",
        "tier": "very_hard",
        "questions": [
            ("According to Schwartz, what is a 'maximizer'?", "Someone who exhaustively searches for the best option", ["Someone who avoids making choices", "Someone who is always satisfied", "Someone who makes quick decisions"], ["understand", "detail"]),
            ("What does the 'inverted U-curve' suggest?", "Moderate choice is optimal; too little or too much is harmful", ["More choice always leads to more happiness", "Choice has no effect on well-being", "People always prefer fewer options"], ["analyze", "inference"]),
            ("What is paradoxical about the passage's main argument?", "Having more options can actually make people less happy", ["People prefer expensive products", "Shopping takes too much time", "All choices lead to regret"], ["evaluate", "main_idea"]),
        ]
    },
    {
        "title": "Linguistic Relativity",
        "content": "The Sapir-Whorf hypothesis proposes that the structure of a language influences its speakers' worldview and cognition. The strong version, known as linguistic determinism, suggests that language determines thought entirely — a position largely rejected by modern linguists. However, the weak version, linguistic relativity, has gained empirical support. Studies show that speakers of languages with distinct color terms perceive color differences more quickly. Similarly, speakers of Mandarin, which uses vertical metaphors for time, conceptualize time differently than English speakers who use horizontal metaphors. These findings suggest that while language does not imprison thought, it does provide cognitive scaffolding that shapes habitual patterns of thinking.",
        "tier": "very_hard",
        "questions": [
            ("What is the difference between the strong and weak versions of the hypothesis?", "The strong version says language determines thought; the weak says it influences thought", ["There is no difference between them", "The weak version is about grammar only", "The strong version is about vocabulary only"], ["understand", "detail"]),
            ("What evidence supports linguistic relativity?", "Color perception and time conceptualization differ across languages", ["All languages have the same grammar", "People who speak multiple languages think the same", "Mandarin speakers cannot perceive time"], ["analyze", "detail"]),
            ("What does 'cognitive scaffolding' mean in this context?", "A mental framework that supports patterns of thinking", ["A physical structure for learning", "A type of language course", "A method of memorization"], ["evaluate", "vocabulary_in_context"]),
        ]
    },
    {
        "title": "Epigenetics",
        "content": "Traditional genetics held that DNA sequences alone determined an organism's traits. However, the field of epigenetics has revealed that gene expression can be modified without altering the underlying DNA sequence. Environmental factors such as diet, stress, and exposure to toxins can trigger chemical modifications — particularly DNA methylation and histone modification — that silence or activate specific genes. Remarkably, some of these epigenetic changes can be inherited across generations, meaning that a grandparent's environmental experiences could potentially influence their grandchildren's biology. This challenges the traditional boundary between nature and nurture, suggesting a more dynamic interplay between genes and environment than previously understood.",
        "tier": "very_hard",
        "questions": [
            ("What is the main difference between genetics and epigenetics?", "Epigenetics involves gene expression changes without DNA sequence changes", ["Epigenetics studies different species", "Genetics is more modern than epigenetics", "Epigenetics only studies plants"], ["understand", "detail"]),
            ("What is significant about the inheritance of epigenetic changes?", "Environmental experiences can affect future generations' biology", ["Only DNA mutations can be inherited", "Epigenetic changes always reset each generation", "Diet has no effect on genes"], ["analyze", "inference"]),
            ("How does this passage challenge traditional thinking?", "It shows nature and nurture are more interconnected than thought", ["It proves that environment is more important than genes", "It shows that DNA never changes", "It demonstrates that genes are not real"], ["evaluate", "main_idea"]),
        ]
    },
]


def generate_items():
    """Generate 600 items distributed across all stage/panel/domain combinations."""
    all_items = []
    item_counter = 0
    passage_counter = 0

    panels = [
        (1, 'routing', 28, 34, 23),  # grammar, vocab, reading counts
        (2, 'low', 28, 34, 23),
        (2, 'medium', 28, 34, 23),
        (2, 'high', 28, 34, 23),
        (3, 'low', 28, 34, 23),
        (3, 'medium', 28, 34, 23),
        (3, 'high', 30, 36, 24),
    ]

    passages_list = []

    for stage, panel, n_grammar, n_vocab, n_reading in panels:
        allowed_tiers = PANEL_DIFFICULTY[(stage, panel)]

        # --- Grammar items ---
        grammar_pool = [t for t in GRAMMAR_TEMPLATES if t[4] in allowed_tiers]
        if len(grammar_pool) < n_grammar:
            # Duplicate with slight variation
            grammar_pool = grammar_pool * ((n_grammar // max(len(grammar_pool), 1)) + 1)
        random.shuffle(grammar_pool)

        for i in range(n_grammar):
            t = grammar_pool[i % len(grammar_pool)]
            stem, correct, distractors, skill_tags, tier = t
            item_counter += 1

            # Randomize correct answer position
            options_list = [correct] + distractors[:3]
            random.shuffle(options_list)
            correct_idx = options_list.index(correct)
            answer_key = ['A', 'B', 'C', 'D'][correct_idx]

            all_items.append({
                "stage": stage,
                "panel": panel,
                "form_id": 1,
                "domain": "grammar",
                "stem": stem if stem.endswith('?') or '___' in stem else stem,
                "options": {
                    "A": options_list[0],
                    "B": options_list[1],
                    "C": options_list[2],
                    "D": options_list[3],
                },
                "correct_answer": answer_key,
                "skill_tag": json.dumps(skill_tags),
                "difficulty": 0.0,
                "discrimination": 1.0,
                "guessing": 0.25,
                "calibration_status": "uncalibrated",
                "status": "active",
                "source": "seed_data",
            })

        # --- Vocabulary items ---
        vocab_pool = [t for t in VOCABULARY_TEMPLATES if t[4] in allowed_tiers]
        if len(vocab_pool) < n_vocab:
            vocab_pool = vocab_pool * ((n_vocab // max(len(vocab_pool), 1)) + 1)
        random.shuffle(vocab_pool)

        for i in range(n_vocab):
            t = vocab_pool[i % len(vocab_pool)]
            stem, correct, distractors, skill_tags, tier = t

            # Handle both list and string distractors
            if isinstance(distractors, str):
                distractors = [distractors, "unknown", "unclear"]
            item_counter += 1

            options_list = [correct] + distractors[:3]
            random.shuffle(options_list)
            correct_idx = options_list.index(correct)
            answer_key = ['A', 'B', 'C', 'D'][correct_idx]

            all_items.append({
                "stage": stage,
                "panel": panel,
                "form_id": 1,
                "domain": "vocabulary",
                "stem": stem,
                "options": {
                    "A": options_list[0],
                    "B": options_list[1],
                    "C": options_list[2],
                    "D": options_list[3],
                },
                "correct_answer": answer_key,
                "skill_tag": json.dumps(skill_tags),
                "difficulty": 0.0,
                "discrimination": 1.0,
                "guessing": 0.25,
                "calibration_status": "uncalibrated",
                "status": "active",
                "source": "seed_data",
            })

        # --- Reading items (from passages) ---
        reading_pool = [p for p in READING_PASSAGES if p['tier'] in allowed_tiers]
        if not reading_pool:
            # Fallback: use closest tier passages
            reading_pool = READING_PASSAGES[:3]

        reading_items_generated = 0
        passage_idx = 0

        while reading_items_generated < n_reading:
            passage = reading_pool[passage_idx % len(reading_pool)]
            passage_idx += 1

            # Track passage for DB insertion
            passage_entry = {
                "title": passage["title"],
                "content": passage["content"],
                "word_count": len(passage["content"].split()),
                "genre": "expository",
            }

            # Check if already added
            existing = [p for p in passages_list if p["title"] == passage["title"]]
            if not existing:
                passage_counter += 1
                passage_entry["temp_id"] = passage_counter
                passages_list.append(passage_entry)
                p_id = passage_counter
            else:
                p_id = existing[0]["temp_id"]

            for q in passage['questions']:
                if reading_items_generated >= n_reading:
                    break

                q_stem, correct, distractors, skill_tags = q
                item_counter += 1

                # Full stem includes passage reference
                full_stem = f"Read the passage \"{passage['title']}\" and answer:\n\n{q_stem}"

                options_list = [correct] + distractors[:3]
                random.shuffle(options_list)
                correct_idx = options_list.index(correct)
                answer_key = ['A', 'B', 'C', 'D'][correct_idx]

                all_items.append({
                    "stage": stage,
                    "panel": panel,
                    "form_id": 1,
                    "domain": "reading",
                    "stem": full_stem,
                    "options": {
                        "A": options_list[0],
                        "B": options_list[1],
                        "C": options_list[2],
                        "D": options_list[3],
                    },
                    "correct_answer": answer_key,
                    "skill_tag": json.dumps(skill_tags),
                    "passage_title": passage["title"],
                    "passage_temp_id": p_id,
                    "difficulty": 0.0,
                    "discrimination": 1.0,
                    "guessing": 0.25,
                    "calibration_status": "uncalibrated",
                    "status": "active",
                    "source": "seed_data",
                })
                reading_items_generated += 1

    return {
        "passages": passages_list,
        "items": all_items,
        "metadata": {
            "total_items": len(all_items),
            "total_passages": len(passages_list),
            "generated_at": datetime.now().isoformat(),
            "distribution": {
                "grammar": sum(1 for i in all_items if i["domain"] == "grammar"),
                "vocabulary": sum(1 for i in all_items if i["domain"] == "vocabulary"),
                "reading": sum(1 for i in all_items if i["domain"] == "reading"),
            },
            "by_stage_panel": {},
        }
    }


if __name__ == "__main__":
    print("Generating 600 seed items...")
    data = generate_items()

    # Compute distribution stats
    for item in data["items"]:
        key = f"S{item['stage']}_{item['panel']}"
        if key not in data["metadata"]["by_stage_panel"]:
            data["metadata"]["by_stage_panel"][key] = {"grammar": 0, "vocabulary": 0, "reading": 0, "total": 0}
        data["metadata"]["by_stage_panel"][key][item["domain"]] += 1
        data["metadata"]["by_stage_panel"][key]["total"] += 1

    # Save to file
    output_path = os.path.join(os.path.dirname(__file__), "seed_items_600.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nGenerated {data['metadata']['total_items']} items, {data['metadata']['total_passages']} passages")
    print(f"Saved to: {output_path}")
    print(f"\nDomain distribution:")
    for domain, count in data['metadata']['distribution'].items():
        print(f"  {domain}: {count}")
    print(f"\nPer stage/panel:")
    for key, counts in sorted(data['metadata']['by_stage_panel'].items()):
        print(f"  {key}: {counts}")
