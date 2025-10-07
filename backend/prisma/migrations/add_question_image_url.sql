-- Add imageUrl column to Question table
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(500);
