-- AI CAT System Database Tables
-- Creates tables for AI-generated items and metadata

-- AI Generated Items Metadata Table
CREATE TABLE IF NOT EXISTS ai_generated_items (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    generation_params JSONB,
    validation_result JSONB,
    rationale TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    UNIQUE(item_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_items_item_id ON ai_generated_items(item_id);
CREATE INDEX IF NOT EXISTS idx_ai_items_model ON ai_generated_items(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_items_created_at ON ai_generated_items(created_at);

-- Comments for documentation
COMMENT ON TABLE ai_generated_items IS 'Metadata for AI-generated test items';
COMMENT ON COLUMN ai_generated_items.item_id IS 'Foreign key to items table';
COMMENT ON COLUMN ai_generated_items.model_name IS 'AI model used for generation (e.g., gemini-1.5-pro)';
COMMENT ON COLUMN ai_generated_items.generation_params IS 'JSON parameters used for generation';
COMMENT ON COLUMN ai_generated_items.validation_result IS 'JSON validation scores and feedback';
COMMENT ON COLUMN ai_generated_items.rationale IS 'AI explanation for item design';
