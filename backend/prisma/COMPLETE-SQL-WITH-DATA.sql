-- ============================================
-- English Adaptive Test - Complete Database Setup
-- ============================================
-- This script creates tables AND inserts sample data
-- Execute this ONCE in Supabase SQL Editor

-- ===== PART 1: Create Tables & Enums =====

-- Create enums
DO $$ BEGIN
  CREATE TYPE "ItemDomain" AS ENUM ('grammar', 'vocabulary', 'reading');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TextType" AS ENUM ('expository', 'argumentative', 'narrative', 'practical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ItemStatus" AS ENUM ('active', 'flagged', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Passages table
CREATE TABLE IF NOT EXISTS "passages" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "word_count" INTEGER NOT NULL,
  "lexile_score" INTEGER,
  "ar_level" DOUBLE PRECISION,
  "genre" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS "items" (
  "id" SERIAL PRIMARY KEY,
  "passage_id" INTEGER REFERENCES "passages"("id") ON DELETE SET NULL,
  "stem" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correct_answer" CHAR(1) NOT NULL,
  "domain" "ItemDomain" NOT NULL,
  "text_type" "TextType",
  "skill_tag" TEXT,
  "discrimination" DOUBLE PRECISION,
  "difficulty" DOUBLE PRECISION,
  "guessing" DOUBLE PRECISION DEFAULT 0.25,
  "stage" INTEGER NOT NULL,
  "panel" TEXT NOT NULL,
  "form_id" INTEGER DEFAULT 1,
  "exposure_count" INTEGER DEFAULT 0,
  "exposure_rate" DOUBLE PRECISION,
  "point_biserial" DOUBLE PRECISION,
  "correct_rate" DOUBLE PRECISION,
  "status" "ItemStatus" DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "calibrated_at" TIMESTAMP(3)
);

-- English Test Sessions table
CREATE TABLE IF NOT EXISTS "english_test_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'active',
  "items_completed" INTEGER DEFAULT 0,
  "current_theta" DOUBLE PRECISION,
  "current_se" DOUBLE PRECISION,
  "stage" INTEGER DEFAULT 1,
  "panel" TEXT DEFAULT 'routing',
  "final_theta" DOUBLE PRECISION,
  "standard_error" DOUBLE PRECISION,
  "proficiency_level" INTEGER,
  "lexile_score" INTEGER,
  "ar_level" DOUBLE PRECISION,
  "vocabulary_size" INTEGER,
  "vocabulary_bands" JSONB,
  "total_items" INTEGER,
  "correct_count" INTEGER,
  "accuracy_percentage" DOUBLE PRECISION,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Responses table
CREATE TABLE IF NOT EXISTS "english_test_responses" (
  "id" SERIAL PRIMARY KEY,
  "session_id" INTEGER NOT NULL REFERENCES "english_test_sessions"("id") ON DELETE CASCADE,
  "item_id" INTEGER NOT NULL REFERENCES "items"("id") ON DELETE CASCADE,
  "selected_answer" CHAR(1) NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "response_time" INTEGER,
  "theta_estimate" DOUBLE PRECISION,
  "standard_error" DOUBLE PRECISION,
  "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "unique_session_item" UNIQUE ("session_id", "item_id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_items_domain" ON "items"("domain");
CREATE INDEX IF NOT EXISTS "idx_items_status" ON "items"("status");
CREATE INDEX IF NOT EXISTS "idx_items_stage_panel" ON "items"("stage", "panel");
CREATE INDEX IF NOT EXISTS "idx_items_exposure_rate" ON "items"("exposure_rate");
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "english_test_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_status" ON "english_test_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_responses_session_id" ON "english_test_responses"("session_id");
CREATE INDEX IF NOT EXISTS "idx_responses_item_id" ON "english_test_responses"("item_id");

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_items_updated_at') THEN
    CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON "items"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON "english_test_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ===== PART 2: Insert Sample Data (40 Items) =====

-- Insert 3 Passages
INSERT INTO passages (title, content, word_count, lexile_score, ar_level, genre) VALUES
('The School Library', 'The school library is a quiet place where students can read books and study.
Mrs. Johnson is the librarian. She helps students find books they like.
The library has many kinds of books: fiction, non-fiction, and magazines.
Students must be quiet in the library so everyone can concentrate.', 52, 400, 2.5, 'informational'),

('Climate Change and Polar Bears', 'Polar bears are facing serious challenges due to climate change. As Arctic ice melts,
these magnificent animals lose their hunting grounds. Polar bears primarily hunt seals,
which they catch on sea ice. With less ice available, bears must swim longer distances,
expending more energy while finding less food. Scientists estimate that polar bear populations
could decline by 30% over the next few decades if current trends continue.', 72, 950, 6.8, 'scientific'),

('The Paradox of Choice', 'Contemporary consumer culture presents an interesting paradox: while an abundance
of choices theoretically empowers consumers, excessive options can paradoxically diminish satisfaction
and increase anxiety. Psychologist Barry Schwartz argues that when faced with too many alternatives,
individuals experience decision paralysis and subsequent regret. Moreover, the opportunity cost of
foregone options becomes more salient, leading to decreased contentment with chosen alternatives.
This phenomenon has profound implications for marketing strategies and public policy design.', 74, 1280, 11.2, 'academic')
ON CONFLICT DO NOTHING;

-- Insert 13 Grammar Items
INSERT INTO items (stem, options, correct_answer, domain, skill_tag, stage, panel, discrimination, difficulty) VALUES
-- Stage 1: Routing
('She _____ to school every day.', '{"A": "go", "B": "goes", "C": "going", "D": "gone"}', 'B', 'grammar', 'present_simple', 1, 'routing', 1.2, -1.0),
('They _____ playing soccer now.', '{"A": "is", "B": "am", "C": "are", "D": "be"}', 'C', 'grammar', 'present_continuous', 1, 'routing', 1.0, -0.8),
('I _____ my homework yesterday.', '{"A": "do", "B": "did", "C": "doing", "D": "done"}', 'B', 'grammar', 'past_simple', 1, 'routing', 1.1, -0.5),

-- Stage 2: Low Panel
('We _____ to the park last weekend.', '{"A": "go", "B": "went", "C": "gone", "D": "going"}', 'B', 'grammar', 'past_simple', 2, 'low', 0.9, -1.2),
('She is _____ than her sister.', '{"A": "tall", "B": "taller", "C": "tallest", "D": "more tall"}', 'B', 'grammar', 'comparatives', 2, 'low', 1.0, -0.9),
('There _____ many books on the shelf.', '{"A": "is", "B": "am", "C": "are", "D": "be"}', 'C', 'grammar', 'subject_verb_agreement', 2, 'low', 0.8, -1.0),
('He can _____ very fast.', '{"A": "runs", "B": "running", "C": "ran", "D": "run"}', 'D', 'grammar', 'modal_verbs', 2, 'low', 0.9, -0.7),
('My brother _____ basketball every weekend.', '{"A": "play", "B": "plays", "C": "playing", "D": "played"}', 'B', 'grammar', 'present_simple', 2, 'low', 0.95, -1.1),

-- Stage 2: Medium Panel
('If I _____ you, I would study harder.', '{"A": "am", "B": "was", "C": "were", "D": "be"}', 'C', 'grammar', 'conditionals', 2, 'med', 1.3, 0.2),
('The book _____ by millions of people.', '{"A": "reads", "B": "is read", "C": "reading", "D": "read"}', 'B', 'grammar', 'passive_voice', 2, 'med', 1.4, 0.5),

-- Stage 3: High-High Panel
('Scarcely _____ the door when the phone rang.', '{"A": "I opened", "B": "did I open", "C": "had I opened", "D": "I had opened"}', 'C', 'grammar', 'inversion', 3, 'high_high', 1.8, 1.5),
('The committee _____ to make a decision by next week.', '{"A": "need", "B": "needs", "C": "needing", "D": "have needed"}', 'B', 'grammar', 'collective_nouns', 3, 'high_high', 1.6, 1.2),
('Were it not for your help, I _____ failed.', '{"A": "would have", "B": "will have", "C": "had", "D": "have"}', 'A', 'grammar', 'subjunctive', 3, 'high_high', 1.9, 1.8)
ON CONFLICT DO NOTHING;

-- Insert 14 Vocabulary Items (VST format)
INSERT INTO items (stem, options, correct_answer, domain, skill_tag, stage, panel, discrimination, difficulty) VALUES
-- 1k-2k band
('She feels happy today.', '{"A": "joyful", "B": "angry", "C": "tired", "D": "hungry"}', 'A', 'vocabulary', '1k', 1, 'routing', 0.8, -1.5),
('The elephant is very big.', '{"A": "small", "B": "large", "C": "fast", "D": "slow"}', 'B', 'vocabulary', '1k', 1, 'routing', 0.9, -1.3),
('Let us begin the meeting.', '{"A": "end", "B": "start", "C": "continue", "D": "stop"}', 'B', 'vocabulary', '2k', 1, 'routing', 1.0, -0.9),

-- 4k-6k band
('I need to purchase a new car.', '{"A": "sell", "B": "rent", "C": "buy", "D": "borrow"}', 'C', 'vocabulary', '4k', 2, 'med', 1.2, 0.1),
('We visited ancient ruins.', '{"A": "modern", "B": "new", "C": "old", "D": "young"}', 'C', 'vocabulary', '4k', 2, 'med', 1.1, 0.0),
('Can you demonstrate how it works?', '{"A": "hide", "B": "show", "C": "break", "D": "fix"}', 'B', 'vocabulary', '6k', 2, 'med', 1.3, 0.3),

-- 8k-10k band
('The message was ambiguous.', '{"A": "clear", "B": "vague", "C": "short", "D": "long"}', 'B', 'vocabulary', '8k', 2, 'high', 1.5, 0.8),
('She is meticulous in her work.', '{"A": "careless", "B": "careful", "C": "fast", "D": "slow"}', 'B', 'vocabulary', '10k', 3, 'med_high', 1.6, 1.0),
('This technology is obsolete.', '{"A": "new", "B": "outdated", "C": "expensive", "D": "cheap"}', 'B', 'vocabulary', '10k', 3, 'med_high', 1.5, 0.9),

-- 14k band
('A new paradigm emerged.', '{"A": "model", "B": "problem", "C": "solution", "D": "question"}', 'A', 'vocabulary', '14k', 3, 'high_high', 1.7, 1.3),
('The beauty was ephemeral.', '{"A": "permanent", "B": "temporary", "C": "ugly", "D": "bright"}', 'B', 'vocabulary', '14k', 3, 'high_high', 1.8, 1.5),
('Smartphones are ubiquitous today.', '{"A": "rare", "B": "expensive", "C": "everywhere", "D": "useless"}', 'C', 'vocabulary', '14k', 3, 'high_high', 1.7, 1.4),

-- Pseudowords
('The scientist blurgled the data.', '{"A": "analyzed", "B": "deleted", "C": "created", "D": "ignored"}', 'A', 'vocabulary', 'pseudo', 2, 'med', 0.5, 0.0),
('We need to fribulate the results.', '{"A": "verify", "B": "hide", "C": "share", "D": "forget"}', 'A', 'vocabulary', 'pseudo', 2, 'high', 0.5, 0.5)
ON CONFLICT DO NOTHING;

-- Insert 13 Reading Items (using passage IDs)
INSERT INTO items (passage_id, stem, options, correct_answer, domain, text_type, skill_tag, stage, panel, discrimination, difficulty)
SELECT p.id, i.stem, i.options::jsonb, i.correct_answer, i.domain::"ItemDomain", i.text_type::"TextType", i.skill_tag, i.stage, i.panel, i.discrimination, i.difficulty
FROM passages p
CROSS JOIN LATERAL (
  VALUES
    -- Low passage items
    (1, 'What is the main purpose of the library?', '{"A": "To eat lunch", "B": "A place to read and study", "C": "To play games", "D": "To watch movies"}', 'B', 'reading', 'expository', 'main_idea', 1, 'routing', 0.9, -1.0),
    (1, 'Who is Mrs. Johnson?', '{"A": "A teacher", "B": "A student", "C": "The librarian", "D": "The principal"}', 'C', 'reading', 'expository', 'detail', 2, 'low', 0.8, -1.2),
    (1, 'Why must students be quiet?', '{"A": "So everyone can concentrate", "B": "Because the librarian said so", "C": "To save energy", "D": "To sleep"}', 'A', 'reading', 'expository', 'inference', 2, 'low', 1.0, -0.8),

    -- Medium passage items
    (2, 'What is the main challenge facing polar bears?', '{"A": "Too much ice", "B": "Climate change", "C": "Overpopulation", "D": "Lack of seals"}', 'B', 'reading', 'expository', 'main_idea', 1, 'routing', 1.1, -0.3),
    (2, 'How do polar bears primarily hunt seals?', '{"A": "On land", "B": "In the water", "C": "On sea ice", "D": "From the air"}', 'C', 'reading', 'expository', 'detail', 2, 'med', 1.2, 0.0),
    (2, 'What is the estimated population decline?', '{"A": "10%", "B": "20%", "C": "30%", "D": "50%"}', 'C', 'reading', 'expository', 'detail', 2, 'med', 1.0, 0.2),
    (2, 'What can be inferred about polar bears?', '{"A": "They can adapt easily", "B": "They are dependent on ice", "C": "They prefer warm weather", "D": "They eat only fish"}', 'B', 'reading', 'expository', 'inference', 2, 'med', 1.3, 0.5),

    -- High passage items
    (3, 'What is the central paradox discussed?', '{"A": "More choices increase satisfaction", "B": "More choices decrease satisfaction", "C": "Choices do not matter", "D": "People prefer no choices"}', 'B', 'reading', 'argumentative', 'main_idea', 1, 'routing', 1.4, 0.3),
    (3, 'Who argues about decision paralysis?', '{"A": "Barry Schwartz", "B": "Barry White", "C": "Barry Allen", "D": "Barry Manilow"}', 'A', 'reading', 'argumentative', 'detail', 2, 'high', 1.2, 0.7),
    (3, 'What becomes more salient with more options?', '{"A": "Happiness", "B": "Opportunity cost", "C": "Satisfaction", "D": "Simplicity"}', 'B', 'reading', 'argumentative', 'detail', 3, 'high_med', 1.5, 1.0),
    (3, 'What are the implications mentioned?', '{"A": "Only personal", "B": "Only business", "C": "Marketing and policy", "D": "None"}', 'C', 'reading', 'argumentative', 'inference', 3, 'high_high', 1.6, 1.2),
    (3, 'What is the tone of the passage?', '{"A": "Humorous", "B": "Analytical", "C": "Emotional", "D": "Casual"}', 'B', 'reading', 'argumentative', 'tone', 3, 'high_high', 1.7, 1.5),
    (3, 'What does "salient" most likely mean?', '{"A": "Hidden", "B": "Unimportant", "C": "Noticeable", "D": "Forgettable"}', 'C', 'reading', 'argumentative', 'vocabulary', 3, 'high_high', 1.5, 1.3)
) AS i(passage_num, stem, options, correct_answer, domain, text_type, skill_tag, stage, panel, discrimination, difficulty)
WHERE p.id = (
  SELECT id FROM passages ORDER BY id LIMIT 1 OFFSET (i.passage_num - 1)
)
ON CONFLICT DO NOTHING;

-- Done!
SELECT
  'Setup complete!' as message,
  (SELECT COUNT(*) FROM passages) as passages,
  (SELECT COUNT(*) FROM items WHERE domain = 'grammar') as grammar_items,
  (SELECT COUNT(*) FROM items WHERE domain = 'vocabulary') as vocabulary_items,
  (SELECT COUNT(*) FROM items WHERE domain = 'reading') as reading_items,
  (SELECT COUNT(*) FROM items) as total_items;
