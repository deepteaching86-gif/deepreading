-- Add VST (Vocabulary Size Test) fields to items table
-- These fields are only used for vocabulary domain items (FR-004)

-- Add frequency band field (1k, 2k, 4k, 6k, 8k, 10k, 14k, pseudoword)
ALTER TABLE items
ADD COLUMN IF NOT EXISTS frequency_band VARCHAR(20);

-- Add target word field
ALTER TABLE items
ADD COLUMN IF NOT EXISTS target_word VARCHAR(100);

-- Add pseudoword flag (for detecting overestimation)
ALTER TABLE items
ADD COLUMN IF NOT EXISTS is_pseudoword BOOLEAN DEFAULT FALSE;

-- Add band size field (1000, 2000, 4000, etc.)
ALTER TABLE items
ADD COLUMN IF NOT EXISTS band_size INTEGER;

-- Add source field to track item origin ('manual' or 'ai_generated')
ALTER TABLE items
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add comments
COMMENT ON COLUMN items.frequency_band IS 'VST frequency band (1k-14k, pseudoword) - FR-004';
COMMENT ON COLUMN items.target_word IS 'Target vocabulary word for VST items - FR-004';
COMMENT ON COLUMN items.is_pseudoword IS 'Flag for pseudoword items used to detect overestimation - FR-004';
COMMENT ON COLUMN items.band_size IS 'Word count in frequency band (e.g., 1000 for 1k band) - FR-004';
COMMENT ON COLUMN items.source IS 'Item origin: manual (verified) or ai_generated';

-- Create index for VST queries
CREATE INDEX IF NOT EXISTS idx_items_frequency_band ON items(frequency_band) WHERE domain = 'vocabulary';
CREATE INDEX IF NOT EXISTS idx_items_pseudoword ON items(is_pseudoword) WHERE domain = 'vocabulary';
