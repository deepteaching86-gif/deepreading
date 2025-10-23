-- English Adaptive Test Tables
-- Migration for MST (Multistage Testing) with IRT 3PL Model

-- 1. Passages Table
CREATE TABLE IF NOT EXISTS passages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    -- Text complexity metrics
    lexile_score INT,
    ar_level FLOAT,
    flesch_kincaid FLOAT,
    word_count INT NOT NULL,

    -- Categorization
    genre VARCHAR(50),
    topic VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Items Table (Questions)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    passage_id INT REFERENCES passages(id) ON DELETE CASCADE,

    -- Question content
    stem TEXT NOT NULL,
    options JSONB NOT NULL, -- {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

    -- IRT 3PL Parameters
    discrimination FLOAT NOT NULL, -- a parameter (0.5 ~ 2.5)
    difficulty FLOAT NOT NULL,     -- b parameter (-3 ~ 3)
    guessing FLOAT DEFAULT 0.25,   -- c parameter (0.0 ~ 0.35)

    -- MST Configuration
    stage INT NOT NULL CHECK (stage IN (1, 2, 3)),
    panel VARCHAR(30) NOT NULL, -- 'routing', 'low', 'medium', 'high', 'L1', 'L2', 'L3', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3'
    form_id INT NOT NULL,       -- Item rotation group

    -- Metadata
    skill_tag VARCHAR(100),     -- 'grammar', 'vocabulary', 'inference', 'main_idea', etc.
    exposure_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_panel CHECK (
        (stage = 1 AND panel = 'routing') OR
        (stage = 2 AND panel IN ('low', 'medium', 'high')) OR
        (stage = 3 AND panel IN ('L1', 'L2', 'L3', 'M1', 'M2', 'M3', 'H1', 'H2', 'H3'))
    )
);

-- 3. Vocabulary Items Table
CREATE TABLE IF NOT EXISTS vocabulary_items (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL UNIQUE,

    -- Frequency band (1k, 2k, 4k, 6k, 8k, 10k, 14k)
    frequency_band VARCHAR(10) NOT NULL,
    frequency_rank INT,

    -- VST structure
    target_word VARCHAR(100) NOT NULL,
    options JSONB NOT NULL, -- {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

    -- Pseudo-word flag
    is_pseudo BOOLEAN DEFAULT FALSE,

    -- IRT Parameters
    discrimination FLOAT,
    difficulty FLOAT,
    guessing FLOAT DEFAULT 0.25,

    form_id INT NOT NULL,
    exposure_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Test Sessions Table
CREATE TABLE IF NOT EXISTS english_test_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,

    -- Session metadata
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- MST routing results
    stage1_theta FLOAT,
    stage2_panel VARCHAR(30),
    stage3_panel VARCHAR(30),

    -- Final results
    final_theta FLOAT,
    standard_error FLOAT,
    proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 10),

    -- Lexile/AR scores
    lexile_score INT,
    ar_level FLOAT,

    -- Vocabulary results
    vocabulary_size INT,
    vocabulary_bands JSONB, -- {"1k": 950, "2k": 820, ...}

    -- Performance metadata
    total_items INT DEFAULT 40,
    correct_count INT,
    response_time_avg FLOAT, -- seconds

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- 5. Item Responses Table
CREATE TABLE IF NOT EXISTS english_item_responses (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES english_test_sessions(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id),

    -- Response data
    stage INT NOT NULL,
    item_order INT NOT NULL, -- Position in test (1-40)
    selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,

    -- Timing
    response_time INT, -- milliseconds

    -- IRT estimation at time of response
    theta_estimate FLOAT,
    se_estimate FLOAT,

    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Vocabulary Responses Table
CREATE TABLE IF NOT EXISTS vocabulary_responses (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES english_test_sessions(id) ON DELETE CASCADE,
    vocab_item_id INT REFERENCES vocabulary_items(id),

    selected_answer CHAR(1),
    is_correct BOOLEAN NOT NULL,
    response_time INT,

    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Lexile Calibration Data Table (for ML model training)
CREATE TABLE IF NOT EXISTS lexile_calibration_data (
    id SERIAL PRIMARY KEY,
    passage_id INT REFERENCES passages(id) ON DELETE CASCADE,

    -- Text features (12 features)
    mean_sentence_length FLOAT,
    mean_zipf_frequency FLOAT,
    flesch_kincaid_grade FLOAT,
    gunning_fog FLOAT,
    smog_index FLOAT,
    coleman_liau FLOAT,
    ari_index FLOAT,
    unique_word_ratio FLOAT,
    academic_word_ratio FLOAT,
    complex_word_ratio FLOAT,
    syllable_per_word FLOAT,
    dependency_depth FLOAT,

    -- Target variables
    lexile_score INT NOT NULL,
    ar_level FLOAT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_items_stage_panel ON items(stage, panel);
CREATE INDEX IF NOT EXISTS idx_items_difficulty ON items(difficulty);
CREATE INDEX IF NOT EXISTS idx_items_skill_tag ON items(skill_tag);
CREATE INDEX IF NOT EXISTS idx_vocab_frequency_band ON vocabulary_items(frequency_band);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON english_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON english_test_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON english_item_responses(session_id);

-- Views for reporting

-- View 1: Session Summary with all metrics
CREATE OR REPLACE VIEW english_test_results AS
SELECT
    s.id AS session_id,
    s.user_id,
    s.completed_at,
    s.final_theta,
    s.standard_error,
    s.proficiency_level,
    s.lexile_score,
    s.ar_level,
    s.vocabulary_size,
    s.vocabulary_bands,
    s.total_items,
    s.correct_count,
    ROUND((s.correct_count::FLOAT / s.total_items) * 100, 2) AS accuracy_percentage,
    s.response_time_avg,
    s.stage2_panel,
    s.stage3_panel
FROM english_test_sessions s
WHERE s.status = 'completed';

-- View 2: Item statistics for exposure control
CREATE OR REPLACE VIEW item_statistics AS
SELECT
    i.id,
    i.stage,
    i.panel,
    i.skill_tag,
    i.difficulty,
    i.discrimination,
    i.exposure_count,
    COUNT(r.id) AS total_responses,
    SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) AS correct_responses,
    ROUND(
        SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(r.id), 0),
        3
    ) AS empirical_p_value
FROM items i
LEFT JOIN english_item_responses r ON i.id = r.item_id
GROUP BY i.id;

-- Comments
COMMENT ON TABLE passages IS 'Reading comprehension passages with text complexity metrics';
COMMENT ON TABLE items IS 'Test items with IRT 3PL parameters and MST panel assignments';
COMMENT ON TABLE vocabulary_items IS 'Vocabulary Size Test items with frequency bands';
COMMENT ON TABLE english_test_sessions IS 'User test sessions with final theta, Lexile, and vocabulary estimates';
COMMENT ON TABLE english_item_responses IS 'Individual item responses with timing and IRT estimates';
COMMENT ON TABLE vocabulary_responses IS 'Vocabulary test responses for VST estimation';
COMMENT ON TABLE lexile_calibration_data IS 'Training data for Lexile/AR prediction ML model';
