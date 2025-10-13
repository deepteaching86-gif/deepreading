-- Create Vision TEST template for Grade 2
-- Run this in Supabase SQL Editor

-- Insert template
INSERT INTO test_templates (
  id,
  template_code,
  grade,
  title,
  description,
  version,
  total_questions,
  total_points,
  passing_score,
  time_limit,
  status,
  is_active,
  template_type,
  vision_config,
  created_at
) VALUES (
  gen_random_uuid(),
  'VISION_G2_2025',
  2,
  '초등 2학년 Vision TEST (시선 추적 독해력 진단)',
  '시선 추적 기술을 활용한 독해력 진단 테스트입니다. 웹캠을 통해 읽기 패턴을 분석하여 정확한 독해력 수준을 측정합니다.',
  '1.0',
  5,
  100,
  60,
  20,
  'active',
  true,
  'vision',
  '{
    "calibrationRequired": true,
    "minCalibrationAccuracy": 0.7,
    "gazeTrackingEnabled": true,
    "saveInterval": 5000,
    "passages": [
      {
        "id": "passage1",
        "title": "아침 햇살",
        "text": "아침 햇살이 창문으로 들어왔어요. 따뜻한 햇살을 받으며 꽃들이 활짝 피었어요. 나비가 날아와 꽃 위에 앉았어요.",
        "wordCount": 28,
        "expectedReadingTime": 30
      },
      {
        "id": "passage2",
        "title": "우리 강아지",
        "text": "우리 집에는 강아지가 한 마리 있어요. 이름은 뽀삐예요. 뽀삐는 매일 아침 나를 깨워요. 꼬리를 흔들며 반갑게 인사해요.",
        "wordCount": 32,
        "expectedReadingTime": 35
      },
      {
        "id": "passage3",
        "title": "비 오는 날",
        "text": "오늘은 비가 많이 와요. 우산을 쓰고 학교에 갔어요. 길에서 개구리를 만났어요. 개구리도 비를 맞으며 뛰어다녔어요.",
        "wordCount": 30,
        "expectedReadingTime": 32
      },
      {
        "id": "passage4",
        "title": "생일 파티",
        "text": "오늘은 내 생일이에요. 친구들이 우리 집에 놀러 왔어요. 엄마가 맛있는 케이크를 준비해 주셨어요. 모두 함께 노래를 불렀어요.",
        "wordCount": 34,
        "expectedReadingTime": 38
      },
      {
        "id": "passage5",
        "title": "가을 소풍",
        "text": "학교에서 가을 소풍을 갔어요. 단풍잎이 빨갛고 노랗게 물들었어요. 친구들과 도시락을 먹으며 즐거운 시간을 보냈어요.",
        "wordCount": 31,
        "expectedReadingTime": 35
      }
    ],
    "metricsEnabled": [
      "averageSaccadeAmplitude",
      "saccadeVariability",
      "averageSaccadeVelocity",
      "optimalLandingRate",
      "returnSweepAccuracy",
      "scanPathEfficiency",
      "averageFixationDuration",
      "fixationsPerWord",
      "regressionRate",
      "vocabularyGapScore",
      "wordsPerMinute",
      "rhythmRegularity",
      "staminaScore",
      "gazeComprehensionCorrelation",
      "cognitiveLoadIndex"
    ]
  }'::jsonb,
  NOW()
) ON CONFLICT (template_code) DO NOTHING
RETURNING id, template_code, title;

-- Store template_id for questions (copy the UUID from the result above)
-- Replace 'YOUR_TEMPLATE_ID_HERE' with the actual UUID returned above

-- Question 1
INSERT INTO questions (
  id, template_id, question_number, category, question_type,
  question_text, passage, options, correct_answer, points, difficulty
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM test_templates WHERE template_code = 'VISION_G2_2025'),
  1,
  'reading',
  'choice',
  '아침 햇살을 받으며 무엇이 피었나요?',
  '아침 햇살이 창문으로 들어왔어요. 따뜻한 햇살을 받으며 꽃들이 활짝 피었어요. 나비가 날아와 꽃 위에 앉았어요.',
  '[{"id": 1, "text": "꽃"}, {"id": 2, "text": "나무"}, {"id": 3, "text": "풀"}, {"id": 4, "text": "버섯"}]'::jsonb,
  '1',
  20,
  'easy'
);

-- Question 2
INSERT INTO questions (
  id, template_id, question_number, category, question_type,
  question_text, passage, options, correct_answer, points, difficulty
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM test_templates WHERE template_code = 'VISION_G2_2025'),
  2,
  'reading',
  'choice',
  '강아지 뽀삐는 언제 나를 깨우나요?',
  '우리 집에는 강아지가 한 마리 있어요. 이름은 뽀삐예요. 뽀삐는 매일 아침 나를 깨워요. 꼬리를 흔들며 반갑게 인사해요.',
  '[{"id": 1, "text": "저녁마다"}, {"id": 2, "text": "매일 아침"}, {"id": 3, "text": "점심시간"}, {"id": 4, "text": "밤마다"}]'::jsonb,
  '2',
  20,
  'easy'
);

-- Question 3
INSERT INTO questions (
  id, template_id, question_number, category, question_type,
  question_text, passage, options, correct_answer, points, difficulty
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM test_templates WHERE template_code = 'VISION_G2_2025'),
  3,
  'reading',
  'choice',
  '비 오는 날 길에서 무엇을 만났나요?',
  '오늘은 비가 많이 와요. 우산을 쓰고 학교에 갔어요. 길에서 개구리를 만났어요. 개구리도 비를 맞으며 뛰어다녔어요.',
  '[{"id": 1, "text": "고양이"}, {"id": 2, "text": "강아지"}, {"id": 3, "text": "개구리"}, {"id": 4, "text": "새"}]'::jsonb,
  '3',
  20,
  'easy'
);

-- Question 4
INSERT INTO questions (
  id, template_id, question_number, category, question_type,
  question_text, passage, options, correct_answer, points, difficulty
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM test_templates WHERE template_code = 'VISION_G2_2025'),
  4,
  'reading',
  'choice',
  '생일 파티에서 엄마가 준비해 주신 것은?',
  '오늘은 내 생일이에요. 친구들이 우리 집에 놀러 왔어요. 엄마가 맛있는 케이크를 준비해 주셨어요. 모두 함께 노래를 불렀어요.',
  '[{"id": 1, "text": "피자"}, {"id": 2, "text": "케이크"}, {"id": 3, "text": "과일"}, {"id": 4, "text": "사탕"}]'::jsonb,
  '2',
  20,
  'easy'
);

-- Question 5
INSERT INTO questions (
  id, template_id, question_number, category, question_type,
  question_text, passage, options, correct_answer, points, difficulty
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM test_templates WHERE template_code = 'VISION_G2_2025'),
  5,
  'reading',
  'choice',
  '가을 소풍에서 단풍잎은 무슨 색이었나요?',
  '학교에서 가을 소풍을 갔어요. 단풍잎이 빨갛고 노랗게 물들었어요. 친구들과 도시락을 먹으며 즐거운 시간을 보냈어요.',
  '[{"id": 1, "text": "파랗고 초록색"}, {"id": 2, "text": "빨갛고 노란색"}, {"id": 3, "text": "하얗고 검은색"}, {"id": 4, "text": "보라색과 분홍색"}]'::jsonb,
  '2',
  20,
  'easy'
);

-- Verify the template was created
SELECT
  template_code,
  grade,
  title,
  total_questions,
  time_limit,
  template_type,
  is_active
FROM test_templates
WHERE template_code = 'VISION_G2_2025';

-- Verify questions were created
SELECT
  question_number,
  question_text,
  category
FROM questions
WHERE template_id = (SELECT id FROM test_templates WHERE template_code = 'VISION_G2_2025')
ORDER BY question_number;
