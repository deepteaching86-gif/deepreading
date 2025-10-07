// 문해력 유형 분류 시스템 (MBTI 스타일)
// 4개 영역(어휘력, 독해력, 문법, 추론)의 강약으로 8가지 유형 분류

export interface LiteracyScores {
  vocabulary: number; // 어휘력
  reading: number; // 독해력
  grammar: number; // 문법
  reasoning: number; // 추론
}

export interface LiteracyType {
  code: string; // 유형 코드 (예: "VRGR")
  name: string; // 유형명
  emoji: string; // 이모지
  description: string; // 설명
  strengths: string[]; // 강점
  weaknesses: string[]; // 약점
  recommendations: string[]; // 추천 학습법
  careers: string[]; // 어울리는 진로
  color: string; // 대표 색상
}

// 문해력 유형 정의 (8가지)
export const LITERACY_TYPES: Record<string, LiteracyType> = {
  // 1. 종합 균형형 (모든 영역 고른 발달)
  BALANCED: {
    code: 'BALANCED',
    name: '종합 균형형',
    emoji: '⚖️',
    description: '네 가지 영역이 고르게 발달한 이상적인 문해력 유형입니다. 다양한 텍스트를 효과적으로 이해하고 표현할 수 있습니다.',
    strengths: [
      '다양한 장르의 글을 자유롭게 읽고 이해',
      '복잡한 개념도 쉽게 설명 가능',
      '논리적 사고와 창의적 표현의 조화',
      '문맥 파악과 세부 내용 이해 동시 가능'
    ],
    weaknesses: [
      '특정 분야의 심화 학습 필요',
      '속도보다 정확성 우선 시 시간 소요'
    ],
    recommendations: [
      '전문 분야 서적으로 깊이 있는 독서',
      '토론과 글쓰기로 사고력 확장',
      '다양한 장르의 비평적 읽기',
      '프로젝트 기반 통합 학습'
    ],
    careers: ['저널리스트', '작가', '교육자', '연구원', '기획자'],
    color: 'from-purple-500 to-pink-500'
  },

  // 2. 언어 감각형 (어휘력 + 독해력 강함)
  LINGUISTIC: {
    code: 'LINGUISTIC',
    name: '언어 감각형',
    emoji: '📚',
    description: '풍부한 어휘력과 뛰어난 독해력으로 언어를 자유자재로 다룹니다. 문학적 감수성이 뛰어나고 표현이 풍부합니다.',
    strengths: [
      '다양한 어휘를 정확하게 구사',
      '문학 작품의 깊이 있는 이해',
      '은유와 상징의 해석 능력',
      '창의적이고 감성적인 표현'
    ],
    weaknesses: [
      '논리적 구조화에 어려움',
      '문법 규칙 체계화 필요',
      '분석적 사고 훈련 필요'
    ],
    recommendations: [
      '문학 작품 깊이 있게 감상하기',
      '어휘 노트 작성으로 표현력 확장',
      '논리적 글쓰기 연습 (논설문, 보고서)',
      '문법 규칙 체계적으로 정리'
    ],
    careers: ['작가', '시인', '문학평론가', '카피라이터', '번역가'],
    color: 'from-blue-500 to-cyan-500'
  },

  // 3. 논리 분석형 (문법 + 추론 강함)
  ANALYTICAL: {
    code: 'ANALYTICAL',
    name: '논리 분석형',
    emoji: '🧮',
    description: '정확한 문법 지식과 뛰어난 추론 능력으로 복잡한 정보를 논리적으로 분석합니다. 비판적 사고가 뛰어납니다.',
    strengths: [
      '논리적 구조와 인과관계 파악',
      '정확한 문법으로 명확한 표현',
      '비판적 분석과 평가 능력',
      '복잡한 개념의 체계적 이해'
    ],
    weaknesses: [
      '어휘의 다양성 부족',
      '문학적 감수성 개발 필요',
      '창의적 표현력 향상 필요'
    ],
    recommendations: [
      '다양한 어휘 학습으로 표현력 확장',
      '시와 소설로 문학적 감수성 기르기',
      '토론과 논쟁으로 논리력 강화',
      '비판적 독서와 글쓰기'
    ],
    careers: ['과학자', '엔지니어', '변호사', '분석가', '프로그래머'],
    color: 'from-green-500 to-teal-500'
  },

  // 4. 독해 집중형 (독해력 월등)
  READER: {
    code: 'READER',
    name: '독해 집중형',
    emoji: '📖',
    description: '뛰어난 독해력으로 복잡한 텍스트의 핵심을 빠르게 파악합니다. 정보 처리 능력이 탁월합니다.',
    strengths: [
      '긴 글의 핵심 내용 빠른 파악',
      '문맥을 통한 의미 추론',
      '다양한 관점 이해와 통합',
      '정보의 구조화와 요약'
    ],
    weaknesses: [
      '어휘력 확장 필요',
      '문법적 정확성 향상 필요',
      '논리적 추론 훈련 필요'
    ],
    recommendations: [
      '어휘 학습으로 이해의 폭 넓히기',
      '문법 규칙으로 정확성 높이기',
      '논리적 사고 퍼즐과 게임',
      '속독과 정독의 균형 잡기'
    ],
    careers: ['편집자', '리서처', '정보분석가', '사서', '큐레이터'],
    color: 'from-indigo-500 to-purple-500'
  },

  // 5. 어휘 전문형 (어휘력 월등)
  WORDSMITH: {
    code: 'WORDSMITH',
    name: '어휘 전문형',
    emoji: '✍️',
    description: '풍부한 어휘로 정교하고 세련된 표현을 구사합니다. 언어의 뉘앙스를 정확히 파악하고 활용합니다.',
    strengths: [
      '다양하고 정확한 어휘 사용',
      '세밀한 뉘앙스 표현',
      '창의적 언어 활용',
      '풍부한 표현력'
    ],
    weaknesses: [
      '전체 맥락 파악 훈련 필요',
      '논리적 구조화 능력 향상 필요',
      '추론 능력 개발 필요'
    ],
    recommendations: [
      '긴 글 읽기로 독해력 향상',
      '논리적 글쓰기 연습',
      '추론 문제 풀이',
      '문법 체계 학습'
    ],
    careers: ['카피라이터', '시인', '번역가', '언어학자', '콘텐츠 크리에이터'],
    color: 'from-yellow-500 to-orange-500'
  },

  // 6. 추론 사고형 (추론력 월등)
  THINKER: {
    code: 'THINKER',
    name: '추론 사고형',
    emoji: '🤔',
    description: '뛰어난 추론 능력으로 숨겨진 의미와 논리를 찾아냅니다. 비판적 사고와 문제 해결 능력이 탁월합니다.',
    strengths: [
      '논리적 추론과 분석',
      '숨은 의미와 의도 파악',
      '비판적 평가 능력',
      '창의적 문제 해결'
    ],
    weaknesses: [
      '어휘력 확장 필요',
      '독해 속도 향상 필요',
      '문법 정확성 개선 필요'
    ],
    recommendations: [
      '다양한 어휘 학습',
      '다독으로 독해력 향상',
      '문법 규칙 체계적 학습',
      '논리 퍼즐과 게임'
    ],
    careers: ['철학자', '과학자', '전략 기획자', '컨설턴트', '발명가'],
    color: 'from-red-500 to-pink-500'
  },

  // 7. 문법 정밀형 (문법 월등)
  GRAMMARIAN: {
    code: 'GRAMMARIAN',
    name: '문법 정밀형',
    emoji: '📝',
    description: '정확한 문법 지식으로 오류 없는 문장을 구사합니다. 체계적이고 정밀한 표현이 강점입니다.',
    strengths: [
      '문법적으로 완벽한 문장',
      '명확하고 정확한 표현',
      '체계적 문장 구조',
      '편집과 교정 능력'
    ],
    weaknesses: [
      '어휘의 다양성 부족',
      '독해 속도 향상 필요',
      '추론 능력 개발 필요'
    ],
    recommendations: [
      '다양한 어휘 학습',
      '다양한 장르 독서',
      '추론 문제 연습',
      '창의적 글쓰기'
    ],
    careers: ['편집자', '교정자', '언어 교사', '기술 작가', '법률 문서 작성자'],
    color: 'from-emerald-500 to-green-500'
  },

  // 8. 발전 탐색형 (모든 영역 개발 단계)
  EXPLORER: {
    code: 'EXPLORER',
    name: '발전 탐색형',
    emoji: '🌱',
    description: '아직 특정 강점이 뚜렷하지 않지만, 모든 영역에서 성장 가능성이 큰 유형입니다. 꾸준한 학습으로 발전할 수 있습니다.',
    strengths: [
      '다양한 분야 학습 의욕',
      '성장 가능성',
      '열린 태도',
      '노력하는 자세'
    ],
    weaknesses: [
      '전반적인 기초 실력 향상 필요',
      '학습 전략 수립 필요',
      '꾸준한 연습 필요'
    ],
    recommendations: [
      '매일 조금씩 독서 습관 들이기',
      '기초 어휘와 문법 체계적 학습',
      '쉬운 책부터 시작해 난이도 높이기',
      '학습 멘토나 선생님의 도움 받기',
      '독서 일기로 이해도 확인',
      '꾸준한 연습과 복습'
    ],
    careers: ['모든 분야에 가능성 열려있음', '자신만의 강점 발견 중'],
    color: 'from-pink-500 to-rose-500'
  }
};

// 점수를 바탕으로 문해력 유형 판별
export function determineLiteracyType(scores: LiteracyScores): LiteracyType {
  const { vocabulary, reading, grammar, reasoning } = scores;

  // 각 영역의 최대 점수 대비 퍼센트 계산
  const maxScore = Math.max(vocabulary, reading, grammar, reasoning, 1);
  const vocabPercent = (vocabulary / maxScore) * 100;
  const readingPercent = (reading / maxScore) * 100;
  const grammarPercent = (grammar / maxScore) * 100;
  const reasoningPercent = (reasoning / maxScore) * 100;

  // 전체 평균 (사용하지 않지만 나중에 필요할 수 있음)
  // const average = (vocabPercent + readingPercent + grammarPercent + reasoningPercent) / 4;

  // 1. 종합 균형형: 모든 영역이 70% 이상 & 편차 10% 이내
  const allHigh = vocabPercent >= 70 && readingPercent >= 70 && grammarPercent >= 70 && reasoningPercent >= 70;
  const maxDiff = Math.max(vocabPercent, readingPercent, grammarPercent, reasoningPercent) -
                  Math.min(vocabPercent, readingPercent, grammarPercent, reasoningPercent);
  if (allHigh && maxDiff <= 15) {
    return LITERACY_TYPES.BALANCED;
  }

  // 2. 언어 감각형: 어휘력 + 독해력 높음
  if (vocabPercent >= 70 && readingPercent >= 70) {
    return LITERACY_TYPES.LINGUISTIC;
  }

  // 3. 논리 분석형: 문법 + 추론 높음
  if (grammarPercent >= 70 && reasoningPercent >= 70) {
    return LITERACY_TYPES.ANALYTICAL;
  }

  // 4. 독해 집중형: 독해력이 가장 높음
  if (readingPercent === Math.max(vocabPercent, readingPercent, grammarPercent, reasoningPercent) && readingPercent >= 65) {
    return LITERACY_TYPES.READER;
  }

  // 5. 어휘 전문형: 어휘력이 가장 높음
  if (vocabPercent === Math.max(vocabPercent, readingPercent, grammarPercent, reasoningPercent) && vocabPercent >= 65) {
    return LITERACY_TYPES.WORDSMITH;
  }

  // 6. 추론 사고형: 추론력이 가장 높음
  if (reasoningPercent === Math.max(vocabPercent, readingPercent, grammarPercent, reasoningPercent) && reasoningPercent >= 65) {
    return LITERACY_TYPES.THINKER;
  }

  // 7. 문법 정밀형: 문법이 가장 높음
  if (grammarPercent === Math.max(vocabPercent, readingPercent, grammarPercent, reasoningPercent) && grammarPercent >= 65) {
    return LITERACY_TYPES.GRAMMARIAN;
  }

  // 8. 발전 탐색형: 모든 영역이 낮거나 특정 강점이 없음
  return LITERACY_TYPES.EXPLORER;
}

// 등급 피라미드 데이터
export interface GradePyramid {
  level: number; // 1-9 등급
  label: string; // 등급명
  percentage: number; // 전체 중 비율
  color: string; // 색상
  description: string; // 설명
}

export const GRADE_PYRAMID: GradePyramid[] = [
  { level: 1, label: '최우수', percentage: 4, color: '#8b5cf6', description: '상위 4% - 탁월한 문해력' },
  { level: 2, label: '우수', percentage: 7, color: '#a78bfa', description: '상위 11% - 매우 뛰어난 수준' },
  { level: 3, label: '양호', percentage: 12, color: '#c4b5fd', description: '상위 23% - 우수한 수준' },
  { level: 4, label: '보통 상', percentage: 17, color: '#ddd6fe', description: '상위 40% - 평균 이상' },
  { level: 5, label: '보통', percentage: 20, color: '#e9d5ff', description: '중위 50% - 평균 수준' },
  { level: 6, label: '보통 하', percentage: 17, color: '#f3e8ff', description: '하위 40% - 평균 이하' },
  { level: 7, label: '노력 요함', percentage: 12, color: '#fae8ff', description: '하위 23% - 개선 필요' },
  { level: 8, label: '많은 노력', percentage: 7, color: '#fdf4ff', description: '하위 11% - 집중 학습' },
  { level: 9, label: '특별 지도', percentage: 4, color: '#fdf2f8', description: '하위 4% - 맞춤 지도' },
];
