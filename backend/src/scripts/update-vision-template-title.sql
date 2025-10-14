-- Update Vision TEST template title to be simpler
-- Remove "(시선 추적 독해력 진단)" suffix

UPDATE test_templates
SET
  title = '초등 2학년 Vision TEST',
  "updatedAt" = NOW()
WHERE "templateCode" = 'VISION_G2_2025';

-- Verify update
SELECT id, "templateCode", grade, title, "updatedAt"
FROM test_templates
WHERE "templateCode" = 'VISION_G2_2025';
