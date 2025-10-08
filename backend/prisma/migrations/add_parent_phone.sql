-- Add parent_phone column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20);

-- Add comment
COMMENT ON COLUMN students.parent_phone IS 'Parent contact phone number';
