import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface GradeEssayParams {
  questionText: string;
  passage?: string;
  correctAnswer: string;
  studentAnswer: string;
  points: number;
}

interface GradeEssayResult {
  isCorrect: boolean;
  pointsEarned: number;
  feedback: string;
}

/**
 * OpenAI GPT-4를 사용하여 주관식/서술형 답변 채점
 */
export async function gradeEssayWithAI(params: GradeEssayParams): Promise<GradeEssayResult> {
  const { questionText, passage, correctAnswer, studentAnswer, points } = params;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  if (!studentAnswer || studentAnswer.trim() === '') {
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: '답변이 제출되지 않았습니다.',
    };
  }

  try {
    const prompt = `
당신은 초등학교 및 중학교 문해력 평가 전문가입니다.
다음 학생의 주관식/서술형 답변을 채점하고 피드백을 제공해주세요.

## 문제
${questionText}

${passage ? `## 지문\n${passage}\n` : ''}

## 모범 답안
${correctAnswer}

## 학생 답변
${studentAnswer}

## 배점
${points}점

## 채점 기준
1. 핵심 내용이 포함되었는지 확인
2. 논리적 흐름과 표현력 평가
3. 맞춤법과 문법 오류 여부 확인
4. 부분 점수 적용 가능 (0점 ~ ${points}점)

## 응답 형식 (JSON)
{
  "isCorrect": true/false (${points}점 만점 기준 60% 이상이면 true),
  "pointsEarned": 0-${points} (획득 점수),
  "feedback": "학생에게 제공할 피드백 (2-3문장, 긍정적이고 건설적인 톤)"
}

**중요**: 반드시 위 JSON 형식으로만 응답하세요. 추가 설명 없이 JSON만 반환하세요.
`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 초등학교 및 중학교 문해력 평가 전문가입니다. 학생들의 답변을 공정하고 건설적으로 채점하며, 항상 JSON 형식으로만 응답합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();

    // JSON 파싱
    let result: GradeEssayResult;
    try {
      // JSON 코드 블록 제거 (```json ... ``` 형식)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('OpenAI 응답 파싱 실패:', content);
      throw new Error('AI 채점 결과 파싱에 실패했습니다.');
    }

    // 점수 검증
    if (result.pointsEarned < 0 || result.pointsEarned > points) {
      result.pointsEarned = Math.max(0, Math.min(points, result.pointsEarned));
    }

    return result;
  } catch (error: any) {
    console.error('OpenAI API 오류:', error.response?.data || error.message);

    // 폴백: 단순 키워드 기반 채점
    const keywords = correctAnswer.split(/[,.\s]+/).filter((w) => w.length > 2);
    const matchCount = keywords.filter((keyword) =>
      studentAnswer.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    const ratio = keywords.length > 0 ? matchCount / keywords.length : 0;
    const earnedPoints = Math.round(points * ratio);

    return {
      isCorrect: ratio >= 0.6,
      pointsEarned: earnedPoints,
      feedback: `AI 채점 서비스를 사용할 수 없어 기본 채점이 적용되었습니다. (키워드 일치도: ${Math.round(ratio * 100)}%)`,
    };
  }
}

/**
 * 여러 서술형 답변을 배치로 채점
 */
export async function gradeEssaysBatch(essays: GradeEssayParams[]): Promise<GradeEssayResult[]> {
  const results: GradeEssayResult[] = [];

  for (const essay of essays) {
    try {
      const result = await gradeEssayWithAI(essay);
      results.push(result);

      // Rate limiting 방지 (OpenAI API 제한)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('배치 채점 오류:', error);
      results.push({
        isCorrect: false,
        pointsEarned: 0,
        feedback: '채점 중 오류가 발생했습니다.',
      });
    }
  }

  return results;
}

interface GenerateSummaryParams {
  studentName: string;
  grade: number;
  totalScore: number;
  maxScore: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * AI를 사용하여 문해력 진단 결과 요약 생성
 */
export async function generateResultSummary(params: GenerateSummaryParams): Promise<string> {
  const { studentName, grade, totalScore, maxScore, strengths, weaknesses } = params;

  if (!OPENAI_API_KEY) {
    // Fallback summary without AI
    const percentage = ((totalScore / maxScore) * 100).toFixed(1);
    const primaryStrength = strengths[0] || '기본적인 독해 능력';
    const primaryWeakness = weaknesses[0] || '심화 학습';
    return `${studentName} 학생은 ${grade}등급으로 ${percentage}%의 정답률을 보였습니다. ${primaryStrength} 영역에서 강점을 나타내며, ${primaryWeakness} 부분에서 추가 학습이 권장됩니다.`;
  }

  try {
    const percentage = ((totalScore / maxScore) * 100).toFixed(1);

    const prompt = `
당신은 초등학교 및 중학교 문해력 평가 전문가입니다.
다음 학생의 문해력 진단 결과를 바탕으로 2-3문장의 간결하고 명확한 요약을 작성해주세요.

## 학생 정보
- 이름: ${studentName}

## 평가 결과
- 등급: ${grade}등급 (1등급이 최상위, 5등급이 최하위)
- 점수: ${totalScore}점 / ${maxScore}점 (정답률 ${percentage}%)
- 강점 영역: ${strengths.join(', ') || '없음'}
- 약점 영역: ${weaknesses.join(', ') || '없음'}

## 작성 가이드
1. 첫 문장: "${studentName} 학생은 ${grade}등급으로 우수한/양호한/보통/개선이 필요한 문해력 수준을 보입니다." 형식으로 시작
2. 두 번째 문장: 주요 강점 언급
3. 세 번째 문장: 개선 영역과 격려의 메시지

**중요**: 반드시 "${studentName} 학생은"으로 문장을 시작하세요.
학부모가 이해하기 쉽고, 학생에게 동기를 부여할 수 있도록 긍정적이고 구체적으로 작성해주세요.
요약문만 반환하고, 추가 설명이나 서론은 포함하지 마세요.
`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 문해력 평가 전문가이자 교육 컨설턴트입니다. 학생과 학부모가 이해하기 쉬운 평가 요약을 작성합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const summary = response.data.choices[0].message.content.trim();
    return summary;
  } catch (error: any) {
    console.error('AI 요약 생성 오류:', error.response?.data || error.message);

    // Fallback
    const percentage = ((totalScore / maxScore) * 100).toFixed(1);
    const primaryStrength = strengths[0] || '기본적인 독해 능력';
    const primaryWeakness = weaknesses[0] || '심화 학습';
    return `${studentName} 학생은 ${grade}등급으로 ${percentage}%의 정답률을 보였습니다. ${primaryStrength} 영역에서 강점을 나타내며, ${primaryWeakness} 부분에서 추가 학습이 권장됩니다.`;
  }
}
