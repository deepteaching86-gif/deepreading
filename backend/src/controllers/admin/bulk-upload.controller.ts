// Bulk upload controller with OpenAI integration
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcryptjs';
import OpenAI from 'openai';
import { env } from '../../config/env';

const prisma = new PrismaClient();

// Initialize OpenAI only if API key is available
const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

/**
 * Grade subjective answer using OpenAI GPT-4o-mini
 */
async function gradeWithAI(question: any, studentAnswer: string): Promise<{ pointsEarned: number; feedback: string }> {
  if (!openai) {
    return { pointsEarned: Math.floor(question.points / 2), feedback: 'OpenAI API 미설정' };
  }

  try {
    const prompt = `다음은 독해력 평가 문제와 학생의 답변입니다. 답변을 채점하고 피드백을 제공해주세요.

문제: ${question.questionText}
${question.correctAnswer ? `모범 답안: ${question.correctAnswer}` : ''}
배점: ${question.points}점
학생 답변: ${studentAnswer}

다음 형식으로 응답해주세요:
점수: [0-${question.points} 사이의 정수]
피드백: [50자 이내의 간단한 피드백]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 초중등 독해력 평가 전문가입니다. 학생 답변을 공정하고 건설적으로 채점해주세요.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Parse response
    const scoreMatch = response.match(/점수:\s*(\d+)/);
    const feedbackMatch = response.match(/피드백:\s*(.+)/);

    const pointsEarned = scoreMatch ? Math.min(parseInt(scoreMatch[1], 10), question.points) : Math.floor(question.points / 2);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : '채점 완료';

    return { pointsEarned, feedback };
  } catch (error) {
    console.error('OpenAI grading error:', error);
    return { pointsEarned: Math.floor(question.points / 2), feedback: 'AI 채점 실패 (자동 절반 점수)' };
  }
}

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Download Universal Excel template (supports all grades)
 */
export const downloadTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return next(new ApiError('Admin only', 403));
    }

    const workbook = new ExcelJS.Workbook();
    const dataSheet = workbook.addWorksheet('학생 데이터');
    const infoSheet = workbook.addWorksheet('사용 안내');

    // Define columns - universal template with 50 question columns
    const columns: any[] = [
      { header: '학생이름', key: 'studentName', width: 15 },
      { header: '학생이메일', key: 'studentEmail', width: 25 },
      { header: '학년', key: 'grade', width: 10 },
      { header: '학교명', key: 'schoolName', width: 20 },
      { header: '반', key: 'className', width: 10 },
      { header: '템플릿코드', key: 'templateCode', width: 15 },
    ];

    // Add 50 question columns (supports up to 50 questions per test)
    for (let i = 1; i <= 50; i++) {
      columns.push({
        header: `Q${i}`,
        key: `q${i}`,
        width: 15,
      });
    }

    dataSheet.columns = columns;

    // Add sample rows for different grades
    const sampleRows = [
      {
        studentName: '홍길동',
        studentEmail: 'student1@example.com',
        grade: 3,
        schoolName: '테스트초등학교',
        className: '3-1',
        templateCode: 'ELEM3-V1',
        q1: '1',
        q2: '답안 예시',
        q3: '3',
      },
      {
        studentName: '김영희',
        studentEmail: 'student2@example.com',
        grade: 7,
        schoolName: '테스트중학교',
        className: '1-2',
        templateCode: 'MIDDLE1-V1',
        q1: '2',
        q2: '답안 예시',
        q3: '4',
      },
    ];

    sampleRows.forEach((row) => dataSheet.addRow(row));

    // Style header row
    dataSheet.getRow(1).font = { bold: true };
    dataSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9333EA' }, // Purple color
    };
    dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add info sheet
    infoSheet.columns = [
      { header: '항목', key: 'item', width: 20 },
      { header: '설명', key: 'description', width: 60 },
    ];

    const infoData = [
      { item: '사용 방법', description: '1. 학생 데이터 시트에 학생 정보와 답안을 입력합니다.' },
      { item: '', description: '2. 필수 항목: 학생이름, 학생이메일, 학년, 템플릿코드' },
      { item: '', description: '3. 선택 항목: 학교명, 반' },
      { item: '', description: '4. 답안은 Q1, Q2, Q3... 형식으로 입력합니다.' },
      { item: '', description: '5. 파일을 저장하고 업로드 페이지에서 업로드합니다.' },
      { item: '', description: '' },
      { item: '템플릿 코드', description: '초등: ELEM1-V1 ~ ELEM6-V1 | 중등: MIDDLE1-V1 ~ MIDDLE3-V1' },
      { item: '학년', description: '초등 1~6학년: 1~6 | 중등 1~3학년: 7~9' },
      { item: '', description: '' },
      { item: '객관식 답안', description: '1, 2, 3, 4 중 하나' },
      { item: '주관식 답안', description: '학생이 작성한 답안을 그대로 입력' },
      { item: '서술형 답안', description: '학생이 작성한 답안을 그대로 입력 (AI가 자동 채점)' },
      { item: '리커트 척도', description: '1~5 사이의 숫자' },
      { item: '', description: '' },
      { item: '주의사항', description: '- 한 파일에 여러 학년의 학생을 섞어서 입력 가능' },
      { item: '', description: '- 각 학생마다 올바른 템플릿코드를 입력해야 합니다' },
      { item: '', description: '- 이메일은 중복되지 않아야 합니다' },
      { item: '', description: '- 답안이 없는 문항은 빈 칸으로 두면 0점 처리됩니다' },
    ];

    infoData.forEach((row) => infoSheet.addRow(row));

    infoSheet.getRow(1).font = { bold: true };
    infoSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9333EA' },
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=literacy_test_universal_template.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Template download error:', error);
    next(new ApiError('Failed to generate template', 500));
  }
};

/**
 * Process bulk upload
 */
export const processBulkUpload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return next(new ApiError('Admin only', 403));
    }

    if (!req.file) {
      return next(new ApiError('No file uploaded', 400));
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets['학생 데이터'];

    if (!worksheet) {
      return next(new ApiError('Invalid Excel format', 400));
    }

    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return next(new ApiError('No data found', 400));
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNumber = i + 2;

      try {
        const studentEmail = row['학생이메일']?.trim().toLowerCase();
        const studentName = row['학생이름']?.trim();
        const grade = parseInt(row['학년']);
        const templateCode = row['템플릿코드']?.trim();

        if (!studentEmail || !studentName || !grade || !templateCode) {
          errors.push({ row: rowNumber, error: '필수 항목 누락' });
          continue;
        }

        const template = await prisma.testTemplate.findUnique({
          where: { templateCode },
          include: { questions: { orderBy: { questionNumber: 'asc' } } },
        });

        if (!template) {
          errors.push({ row: rowNumber, error: '템플릿 없음' });
          continue;
        }

        // Create or get user
        let user = await prisma.user.findUnique({
          where: { email: studentEmail },
          include: { student: true },
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash('test1234', 10);
          user = await prisma.user.create({
            data: {
              email: studentEmail,
              passwordHash: hashedPassword,
              name: studentName,
              role: 'student',
              student: {
                create: {
                  grade,
                  schoolName: row['학교명'] || null,
                  className: row['반'] || null,
                },
              },
            },
            include: { student: true },
          });
        }

        if (!user.student) {
          errors.push({ row: rowNumber, error: '학생 프로필 없음' });
          continue;
        }

        // Create session with unique sessionCode
        const sessionCode = `${template.templateCode}-${user.student.id.substring(0, 8)}-${Date.now()}`;

        const session = await prisma.testSession.create({
          data: {
            sessionCode,
            studentId: user.student.id,
            templateId: template.id,
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });

        // Process answers - simple auto-grade for choice questions only
        let totalScore = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;

        for (const question of template.questions) {
          const answerKey = `Q${question.questionNumber}`;
          const studentAnswer = row[answerKey]?.toString().trim() || '';

          let isCorrect = false;
          let pointsEarned = 0;
          let feedback = '';

          if (!studentAnswer) {
            // No answer - 0 points
            incorrectAnswers++;
          } else if (question.questionType === 'choice') {
            // Objective question - automatic grading
            isCorrect = studentAnswer === question.correctAnswer;
            pointsEarned = isCorrect ? question.points : 0;
            if (isCorrect) correctAnswers++;
            else incorrectAnswers++;
          } else if (question.questionType === 'short_answer' || question.questionType === 'essay') {
            // Subjective question - AI grading with GPT-4o-mini
            if (openai) {
              const aiGrade = await gradeWithAI(question, studentAnswer);
              pointsEarned = aiGrade.pointsEarned;
              feedback = aiGrade.feedback;
              isCorrect = pointsEarned >= question.points * 0.7; // 70% 이상이면 correct
              if (isCorrect) correctAnswers++;
              else incorrectAnswers++;
            } else {
              // Fallback: half points if no OpenAI
              pointsEarned = Math.floor(question.points / 2);
              feedback = '자동 채점 (OpenAI 미설정)';
              correctAnswers++;
            }
          } else if (question.questionType === 'likert_scale') {
            // Likert scale - score is the answer value
            const scaleValue = parseInt(studentAnswer, 10);
            if (!isNaN(scaleValue) && scaleValue >= 1 && scaleValue <= 5) {
              pointsEarned = scaleValue;
              isCorrect = true;
              correctAnswers++;
            } else {
              incorrectAnswers++;
            }
          }

          totalScore += pointsEarned;

          await prisma.answer.create({
            data: {
              sessionId: session.id,
              questionId: question.id,
              questionNumber: question.questionNumber,
              studentAnswer,
              isCorrect,
              pointsEarned,
              feedback: feedback || null,
            },
          });
        }

        // Calculate percentage
        const totalPossible = template.questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
        const gradeLevel = percentage >= 90 ? 1 : percentage >= 80 ? 2 : percentage >= 70 ? 3 : percentage >= 60 ? 4 : percentage >= 50 ? 5 : 6;

        // Create result
        await prisma.testResult.create({
          data: {
            sessionId: session.id,
            totalScore,
            totalPossible,
            percentage,
            gradeLevel,
            correctAnswers,
            incorrectAnswers,
          },
        });

        // Update session
        await prisma.testSession.update({
          where: { id: session.id },
          data: { status: 'scored', scoredAt: new Date() },
        });

        results.push({
          row: rowNumber,
          studentName,
          studentEmail,
          score: `${totalScore}/${totalPossible} (${percentage.toFixed(1)}%)`,
        });
      } catch (error: any) {
        console.error(`Row ${rowNumber} error:`, error);
        errors.push({ row: rowNumber, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors,
      },
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    next(new ApiError('Failed to process upload', 500));
  }
};
