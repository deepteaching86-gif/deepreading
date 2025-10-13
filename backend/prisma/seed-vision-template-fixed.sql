-- Create Vision TEST template for Grade 2
-- Run this in Supabase SQL Editor
-- Version: Longer passages (70-95 words each) for better reading assessment

-- First, ensure the columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_templates'
    AND column_name = 'template_type'
  ) THEN
    ALTER TABLE test_templates ADD COLUMN template_type VARCHAR(20) DEFAULT 'standard' NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_test_templates_template_type ON test_templates(template_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_templates'
    AND column_name = 'vision_config'
  ) THEN
    ALTER TABLE test_templates ADD COLUMN vision_config JSONB NULL;
  END IF;
END $$;

-- Insert template with longer passages
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
  25,
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
        "text": "아침 햇살이 창문으로 들어왔어요. 따뜻한 햇살을 받으며 정원의 꽃들이 활짝 피었어요. 빨간 장미, 노란 해바라기, 하얀 백합이 예쁘게 피어 있었어요. 그때 노란 나비 한 마리가 날아와 꽃 위에 살짝 앉았어요. 나비는 꽃에서 달콤한 꿀을 먹고 있었어요. 나는 조용히 창문을 열고 나비를 지켜보았어요.",
        "wordCount": 72,
        "expectedReadingTime": 50
      },
      {
        "id": "passage2",
        "title": "우리 강아지 뽀삐",
        "text": "우리 집에는 귀여운 강아지가 한 마리 있어요. 이름은 뽀삐예요. 뽀삐는 하얀색 털을 가진 작은 강아지예요. 뽀삐는 매일 아침 나를 깨워요. 혀로 내 얼굴을 핥으며 일어나라고 말해요. 꼬리를 흔들며 반갑게 인사도 해요. 나는 뽀삐와 함께 산책을 가는 것이 정말 좋아요. 뽀삐는 나의 가장 친한 친구예요.",
        "wordCount": 78,
        "expectedReadingTime": 55
      },
      {
        "id": "passage3",
        "title": "비 오는 날",
        "text": "오늘은 비가 많이 와요. 하늘이 잔뜩 찌푸려 있어요. 나는 빨간 우산을 쓰고 노란 장화를 신고 학교에 갔어요. 길을 걷다가 작은 웅덩이를 발견했어요. 웅덩이 옆에는 초록색 개구리 한 마리가 있었어요. 개구리도 비를 맞으며 깡충깡충 뛰어다녔어요. 비 오는 날도 참 재미있어요.",
        "wordCount": 72,
        "expectedReadingTime": 50
      },
      {
        "id": "passage4",
        "title": "생일 파티",
        "text": "오늘은 내 생일이에요. 아침부터 엄마가 맛있는 음식을 준비하셨어요. 오후에는 친구들이 우리 집에 놀러 왔어요. 민수, 수지, 영희가 함께 왔어요. 엄마가 초콜릿 케이크를 준비해 주셨어요. 케이크 위에는 초가 8개 꽂혀 있었어요. 우리는 함께 생일 축하 노래를 불렀어요. 친구들이 준 선물을 열어보니 정말 기뻤어요.",
        "wordCount": 83,
        "expectedReadingTime": 58
      },
      {
        "id": "passage5",
        "title": "가을 소풍",
        "text": "오늘은 학교에서 가을 소풍을 갔어요. 우리는 큰 공원으로 갔어요. 공원에는 단풍나무가 많았어요. 단풍잎이 빨갛게, 노랗게, 주황색으로 물들어 있었어요. 선생님과 친구들은 단풍잎을 주워서 예쁜 화관을 만들었어요. 점심시간에는 엄마가 싸주신 김밥과 과일을 먹었어요. 친구들과 함께 공놀이도 하고 술래잡기도 했어요. 정말 즐거운 하루였어요.",
        "wordCount": 94,
        "expectedReadingTime": 65
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
  '정원에 피어 있던 꽃은 모두 몇 가지였나요?',
  '아침 햇살이 창문으로 들어왔어요. 따뜻한 햇살을 받으며 정원의 꽃들이 활짝 피었어요. 빨간 장미, 노란 해바라기, 하얀 백합이 예쁘게 피어 있었어요. 그때 노란 나비 한 마리가 날아와 꽃 위에 살짝 앉았어요. 나비는 꽃에서 달콤한 꿀을 먹고 있었어요. 나는 조용히 창문을 열고 나비를 지켜보았어요.',
  '[{"id": 1, "text": "2가지"}, {"id": 2, "text": "3가지"}, {"id": 3, "text": "4가지"}, {"id": 4, "text": "5가지"}]'::jsonb,
  '2',
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
  '뽀삐는 어떤 색 털을 가지고 있나요?',
  '우리 집에는 귀여운 강아지가 한 마리 있어요. 이름은 뽀삐예요. 뽀삐는 하얀색 털을 가진 작은 강아지예요. 뽀삐는 매일 아침 나를 깨워요. 혀로 내 얼굴을 핥으며 일어나라고 말해요. 꼬리를 흔들며 반갑게 인사도 해요. 나는 뽀삐와 함께 산책을 가는 것이 정말 좋아요. 뽀삐는 나의 가장 친한 친구예요.',
  '[{"id": 1, "text": "검은색"}, {"id": 2, "text": "하얀색"}, {"id": 3, "text": "갈색"}, {"id": 4, "text": "노란색"}]'::jsonb,
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
  '비 오는 날 무엇을 신고 학교에 갔나요?',
  '오늘은 비가 많이 와요. 하늘이 잔뜩 찌푸려 있어요. 나는 빨간 우산을 쓰고 노란 장화를 신고 학교에 갔어요. 길을 걷다가 작은 웅덩이를 발견했어요. 웅덩이 옆에는 초록색 개구리 한 마리가 있었어요. 개구리도 비를 맞으며 깡충깡충 뛰어다녔어요. 비 오는 날도 참 재미있어요.',
  '[{"id": 1, "text": "운동화"}, {"id": 2, "text": "슬리퍼"}, {"id": 3, "text": "노란 장화"}, {"id": 4, "text": "검은 구두"}]'::jsonb,
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
  '생일 케이크 위에 초는 몇 개 꽂혀 있었나요?',
  '오늘은 내 생일이에요. 아침부터 엄마가 맛있는 음식을 준비하셨어요. 오후에는 친구들이 우리 집에 놀러 왔어요. 민수, 수지, 영희가 함께 왔어요. 엄마가 초콜릿 케이크를 준비해 주셨어요. 케이크 위에는 초가 8개 꽂혀 있었어요. 우리는 함께 생일 축하 노래를 불렀어요. 친구들이 준 선물을 열어보니 정말 기뻤어요.',
  '[{"id": 1, "text": "6개"}, {"id": 2, "text": "7개"}, {"id": 3, "text": "8개"}, {"id": 4, "text": "9개"}]'::jsonb,
  '3',
  20,
  'medium'
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
  '소풍에서 친구들과 함께 한 놀이가 아닌 것은?',
  '오늘은 학교에서 가을 소풍을 갔어요. 우리는 큰 공원으로 갔어요. 공원에는 단풍나무가 많았어요. 단풍잎이 빨갛게, 노랗게, 주황색으로 물들어 있었어요. 선생님과 친구들은 단풍잎을 주워서 예쁜 화관을 만들었어요. 점심시간에는 엄마가 싸주신 김밥과 과일을 먹었어요. 친구들과 함께 공놀이도 하고 술래잡기도 했어요. 정말 즐거운 하루였어요.',
  '[{"id": 1, "text": "공놀이"}, {"id": 2, "text": "술래잡기"}, {"id": 3, "text": "화관 만들기"}, {"id": 4, "text": "줄넘기"}]'::jsonb,
  '4',
  20,
  'medium'
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
