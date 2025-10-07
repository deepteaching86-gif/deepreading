-- 독서 습관 및 환경 설문 문항 (초등 1-6학년용)
-- 템플릿 ID는 실제 데이터베이스의 template_code='ELEM_1'인 템플릿 ID로 교체 필요

-- 읽기 동기 (reading_motivation) - 5문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 101, 'reading_motivation', 'likert_scale', '나는 책 읽는 것이 즐겁다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 102, 'reading_motivation', 'likert_scale', '책을 읽을 때 새로운 것을 배우는 것이 좋다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 103, 'reading_motivation', 'likert_scale', '재미있는 책을 발견하면 끝까지 읽고 싶다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 104, 'reading_motivation', 'likert_scale', '친구들과 읽은 책에 대해 이야기하는 것이 좋다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 105, 'reading_motivation', 'likert_scale', '나는 스스로 읽을 책을 선택하는 것이 좋다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null);

-- 독서 환경 (reading_environment) - 4문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 106, 'reading_environment', 'likert_scale', '집에 내가 읽을 수 있는 책이 많이 있다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 107, 'reading_environment', 'likert_scale', '우리 집에는 조용히 책을 읽을 수 있는 공간이 있다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 108, 'reading_environment', 'likert_scale', '부모님이나 가족이 나에게 책을 읽어주거나 함께 읽는다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 109, 'reading_environment', 'likert_scale', '학교나 동네 도서관을 자주 이용한다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null);

-- 독서 습관 (reading_habit) - 4문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 110, 'reading_habit', 'choice', '하루에 책을 읽는 시간은 얼마나 되나요?', '[{"id": 1, "text": "거의 읽지 않음"}, {"id": 2, "text": "10분 이하"}, {"id": 3, "text": "10~30분"}, {"id": 4, "text": "30분~1시간"}, {"id": 5, "text": "1시간 이상"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 111, 'reading_habit', 'choice', '한 달에 몇 권의 책을 읽나요?', '[{"id": 1, "text": "0권"}, {"id": 2, "text": "1~2권"}, {"id": 3, "text": "3~5권"}, {"id": 4, "text": "6~10권"}, {"id": 5, "text": "10권 이상"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 112, 'reading_habit', 'choice', '주로 언제 책을 읽나요?', '[{"id": 1, "text": "아침 시간"}, {"id": 2, "text": "학교 쉬는 시간"}, {"id": 3, "text": "방과 후"}, {"id": 4, "text": "저녁 시간"}, {"id": 5, "text": "자기 전"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 113, 'reading_habit', 'choice', '어떤 방법으로 책을 읽나요?', '[{"id": 1, "text": "종이책만 읽음"}, {"id": 2, "text": "주로 종이책, 가끔 전자책"}, {"id": 3, "text": "종이책과 전자책 반반"}, {"id": 4, "text": "주로 전자책, 가끔 종이책"}, {"id": 5, "text": "전자책만 읽음"}]', '3', 0, null);

-- 글쓰기 동기 (writing_motivation) - 3문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 114, 'writing_motivation', 'likert_scale', '나는 내 생각을 글로 쓰는 것이 좋다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 115, 'writing_motivation', 'likert_scale', '읽은 책에 대한 독서 감상문을 쓰는 것이 재미있다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 116, 'writing_motivation', 'likert_scale', '다른 사람에게 내가 쓴 글을 보여주고 싶다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null);

-- 선호 장르 (reading_preference) - 1문항 (다중선택)
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 117, 'reading_preference', 'choice', '가장 좋아하는 책의 종류는 무엇인가요? (여러 개 선택 가능)', '[{"id": 1, "text": "동화/우화"}, {"id": 2, "text": "과학/자연"}, {"id": 3, "text": "역사/인물"}, {"id": 4, "text": "만화/그림책"}, {"id": 5, "text": "모험/판타지"}, {"id": 6, "text": "시/수필"}, {"id": 7, "text": "위인전"}, {"id": 8, "text": "기타"}]', '1', 0, null);

-- 디지털 리터러시 (digital_literacy) - 3문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 118, 'digital_literacy', 'likert_scale', '나는 인터넷이나 앱에서 글을 읽는 것이 편하다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 119, 'digital_literacy', 'likert_scale', '인터넷에서 찾은 정보가 정확한지 확인하려고 노력한다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 120, 'digital_literacy', 'choice', '학습이나 숙제를 할 때 주로 어디에서 정보를 찾나요?', '[{"id": 1, "text": "책/교과서"}, {"id": 2, "text": "인터넷 검색"}, {"id": 3, "text": "선생님/부모님께 질문"}, {"id": 4, "text": "친구들과 토론"}, {"id": 5, "text": "유튜브/영상"}]', '2', 0, null);

-- 비판적 사고 (critical_thinking) - 3문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 121, 'critical_thinking', 'likert_scale', '글을 읽을 때 작가의 의견에 동의하지 않는 부분을 찾으려고 한다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 122, 'critical_thinking', 'likert_scale', '책을 읽고 나서 내 생각과 비교해보는 것이 좋다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 123, 'critical_thinking', 'likert_scale', '글에서 사실과 의견을 구별하려고 노력한다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null);

-- 독서 태도 (reading_attitude) - 2문항
INSERT INTO questions (id, template_id, question_number, category, question_type, question_text, options, correct_answer, points, difficulty)
VALUES
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 124, 'reading_attitude', 'likert_scale', '독서는 나의 미래에 도움이 될 것이라고 생각한다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null),
  (gen_random_uuid(), (SELECT id FROM test_templates WHERE template_code = 'ELEM_1'), 125, 'reading_attitude', 'likert_scale', '어려운 책도 끝까지 읽으려고 노력하는 편이다.', '[{"id": 1, "text": "전혀 그렇지 않다"}, {"id": 2, "text": "그렇지 않다"}, {"id": 3, "text": "보통이다"}, {"id": 4, "text": "그렇다"}, {"id": 5, "text": "매우 그렇다"}]', '3', 0, null);
