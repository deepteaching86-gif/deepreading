// Script to create Vision TEST template for grade 2
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createVisionTemplate() {
  try {
    console.log('🔧 Creating Vision TEST template for grade 2...');

    const templateCode = 'VISION_G2_2025';
    const grade = 2;

    // Check if template already exists
    const existingTemplate = await prisma.testTemplate.findUnique({
      where: { templateCode },
    });

    if (existingTemplate) {
      console.log('✅ Vision TEST template already exists:', templateCode);
      console.log('   Grade:', existingTemplate.grade);
      console.log('   Title:', existingTemplate.title);
      return;
    }

    // Create Vision TEST template
    const template = await prisma.testTemplate.create({
      data: {
        templateCode,
        grade,
        title: '초등 2학년 Vision TEST (시선 추적 독해력 진단)',
        description: '시선 추적 기술을 활용한 독해력 진단 테스트입니다. 웹캠을 통해 읽기 패턴을 분석하여 정확한 독해력 수준을 측정합니다.',
        version: '1.0',
        totalQuestions: 5,
        totalPoints: 100,
        passingScore: 60,
        timeLimit: 20, // 20 minutes
        status: 'active',
        isActive: true,
        templateType: 'vision',
        visionConfig: {
          calibrationRequired: true,
          minCalibrationAccuracy: 0.7,
          gazeTrackingEnabled: true,
          saveInterval: 5000, // Save gaze data every 5 seconds
          passages: [
            {
              id: 'passage1',
              title: '아침 햇살',
              text: '아침 햇살이 창문으로 들어왔어요. 따뜻한 햇살을 받으며 꽃들이 활짝 피었어요. 나비가 날아와 꽃 위에 앉았어요.',
              wordCount: 28,
              expectedReadingTime: 30 // seconds
            },
            {
              id: 'passage2',
              title: '우리 강아지',
              text: '우리 집에는 강아지가 한 마리 있어요. 이름은 뽀삐예요. 뽀삐는 매일 아침 나를 깨워요. 꼬리를 흔들며 반갑게 인사해요.',
              wordCount: 32,
              expectedReadingTime: 35
            },
            {
              id: 'passage3',
              title: '비 오는 날',
              text: '오늘은 비가 많이 와요. 우산을 쓰고 학교에 갔어요. 길에서 개구리를 만났어요. 개구리도 비를 맞으며 뛰어다녔어요.',
              wordCount: 30,
              expectedReadingTime: 32
            },
            {
              id: 'passage4',
              title: '생일 파티',
              text: '오늘은 내 생일이에요. 친구들이 우리 집에 놀러 왔어요. 엄마가 맛있는 케이크를 준비해 주셨어요. 모두 함께 노래를 불렀어요.',
              wordCount: 34,
              expectedReadingTime: 38
            },
            {
              id: 'passage5',
              title: '가을 소풍',
              text: '학교에서 가을 소풍을 갔어요. 단풍잎이 빨갛고 노랗게 물들었어요. 친구들과 도시락을 먹으며 즐거운 시간을 보냈어요.',
              wordCount: 31,
              expectedReadingTime: 35
            }
          ],
          metricsEnabled: [
            'averageSaccadeAmplitude',
            'saccadeVariability',
            'averageSaccadeVelocity',
            'optimalLandingRate',
            'returnSweepAccuracy',
            'scanPathEfficiency',
            'averageFixationDuration',
            'fixationsPerWord',
            'regressionRate',
            'vocabularyGapScore',
            'wordsPerMinute',
            'rhythmRegularity',
            'staminaScore',
            'gazeComprehensionCorrelation',
            'cognitiveLoadIndex'
          ]
        }
      },
    });

    // Create questions for Vision TEST
    const questions = [
      {
        questionNumber: 1,
        category: 'reading',
        questionType: 'choice',
        questionText: '아침 햇살을 받으며 무엇이 피었나요?',
        passage: '아침 햇살이 창문으로 들어왔어요. 따뜻한 햇살을 받으며 꽃들이 활짝 피었어요. 나비가 날아와 꽃 위에 앉았어요.',
        options: [
          { id: 1, text: '꽃' },
          { id: 2, text: '나무' },
          { id: 3, text: '풀' },
          { id: 4, text: '버섯' }
        ],
        correctAnswer: '1',
        points: 20,
        difficulty: 'easy'
      },
      {
        questionNumber: 2,
        category: 'reading',
        questionType: 'choice',
        questionText: '강아지 뽀삐는 언제 나를 깨우나요?',
        passage: '우리 집에는 강아지가 한 마리 있어요. 이름은 뽀삐예요. 뽀삐는 매일 아침 나를 깨워요. 꼬리를 흔들며 반갑게 인사해요.',
        options: [
          { id: 1, text: '저녁마다' },
          { id: 2, text: '매일 아침' },
          { id: 3, text: '점심시간' },
          { id: 4, text: '밤마다' }
        ],
        correctAnswer: '2',
        points: 20,
        difficulty: 'easy'
      },
      {
        questionNumber: 3,
        category: 'reading',
        questionType: 'choice',
        questionText: '비 오는 날 길에서 무엇을 만났나요?',
        passage: '오늘은 비가 많이 와요. 우산을 쓰고 학교에 갔어요. 길에서 개구리를 만났어요. 개구리도 비를 맞으며 뛰어다녔어요.',
        options: [
          { id: 1, text: '고양이' },
          { id: 2, text: '강아지' },
          { id: 3, text: '개구리' },
          { id: 4, text: '새' }
        ],
        correctAnswer: '3',
        points: 20,
        difficulty: 'easy'
      },
      {
        questionNumber: 4,
        category: 'reading',
        questionType: 'choice',
        questionText: '생일 파티에서 엄마가 준비해 주신 것은?',
        passage: '오늘은 내 생일이에요. 친구들이 우리 집에 놀러 왔어요. 엄마가 맛있는 케이크를 준비해 주셨어요. 모두 함께 노래를 불렀어요.',
        options: [
          { id: 1, text: '피자' },
          { id: 2, text: '케이크' },
          { id: 3, text: '과일' },
          { id: 4, text: '사탕' }
        ],
        correctAnswer: '2',
        points: 20,
        difficulty: 'easy'
      },
      {
        questionNumber: 5,
        category: 'reading',
        questionType: 'choice',
        questionText: '가을 소풍에서 단풍잎은 무슨 색이었나요?',
        passage: '학교에서 가을 소풍을 갔어요. 단풍잎이 빨갛고 노랗게 물들었어요. 친구들과 도시락을 먹으며 즐거운 시간을 보냈어요.',
        options: [
          { id: 1, text: '파랗고 초록색' },
          { id: 2, text: '빨갛고 노란색' },
          { id: 3, text: '하얗고 검은색' },
          { id: 4, text: '보라색과 분홍색' }
        ],
        correctAnswer: '2',
        points: 20,
        difficulty: 'easy'
      }
    ];

    // Insert questions
    for (const q of questions) {
      await prisma.question.create({
        data: {
          templateId: template.id,
          questionNumber: q.questionNumber,
          category: q.category as any,
          questionType: q.questionType as any,
          questionText: q.questionText,
          passage: q.passage,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          difficulty: q.difficulty as any
        }
      });
    }

    console.log('✅ Vision TEST template created successfully!');
    console.log('');
    console.log('📝 Template Code:', templateCode);
    console.log('🎓 Grade:', grade, '(초등 2학년)');
    console.log('📖 Title:', template.title);
    console.log('❓ Questions:', questions.length);
    console.log('⏱️  Time Limit:', template.timeLimit, 'minutes');
    console.log('');
    console.log('✨ Vision TEST features:');
    console.log('   - Gaze tracking with webcam');
    console.log('   - 15 eye-tracking metrics');
    console.log('   - Calibration before test');
    console.log('   - Reading pattern analysis');
    console.log('   - 5 passages for grade 2 students');
  } catch (error) {
    console.error('❌ Error creating Vision TEST template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createVisionTemplate()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
