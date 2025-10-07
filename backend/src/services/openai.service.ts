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
