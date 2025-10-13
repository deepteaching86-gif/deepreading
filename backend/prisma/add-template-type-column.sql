-- Add template_type column to test_templates if it doesn't exist
-- Run this FIRST in Supabase SQL Editor before running the seed script

-- Check if column exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_templates'
    AND column_name = 'template_type'
  ) THEN
    ALTER TABLE test_templates
    ADD COLUMN template_type VARCHAR(20) DEFAULT 'standard' NOT NULL;

    -- Create index on template_type
    CREATE INDEX IF NOT EXISTS idx_test_templates_template_type
    ON test_templates(template_type);

    RAISE NOTICE 'Column template_type added successfully';
  ELSE
    RAISE NOTICE 'Column template_type already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_templates'
    AND column_name = 'vision_config'
  ) THEN
    ALTER TABLE test_templates
    ADD COLUMN vision_config JSONB NULL;

    RAISE NOTICE 'Column vision_config added successfully';
  ELSE
    RAISE NOTICE 'Column vision_config already exists';
  END IF;
END $$;

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'test_templates'
AND column_name IN ('template_type', 'vision_config')
ORDER BY column_name;
