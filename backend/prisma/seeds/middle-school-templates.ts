// Seed script for middle school templates (grades 7-9)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMiddleSchoolTemplates() {
  console.log('Creating middle school templates...');

  const templates = [
    {
      templateCode: 'MID1-V1',
      title: '중학교 1학년 국어 능력 평가',
      description: '중학교 1학년 수준의 어휘력, 독해력, 문법 평가',
      grade: 7,
      totalQuestions: 25,
      totalPoints: 100,
      timeLimit: 60,
      passingScore: 60,
      status: 'active' as const,
    },
    {
      templateCode: 'MID2-V1',
      title: '중학교 2학년 국어 능력 평가',
      description: '중학교 2학년 수준의 어휘력, 독해력, 문법 평가',
      grade: 8,
      totalQuestions: 25,
      totalPoints: 100,
      timeLimit: 60,
      passingScore: 60,
      status: 'active' as const,
    },
    {
      templateCode: 'MID3-V1',
      title: '중학교 3학년 국어 능력 평가',
      description: '중학교 3학년 수준의 어휘력, 독해력, 문법 평가',
      grade: 9,
      totalQuestions: 25,
      totalPoints: 100,
      timeLimit: 60,
      passingScore: 60,
      status: 'active' as const,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.testTemplate.findUnique({
      where: { templateCode: template.templateCode },
    });

    if (existing) {
      console.log(`Template ${template.templateCode} already exists, skipping...`);
      continue;
    }

    await prisma.testTemplate.create({
      data: template,
    });

    console.log(`Created template: ${template.templateCode}`);
  }

  console.log('Middle school templates created successfully!');
}

createMiddleSchoolTemplates()
  .catch((e) => {
    console.error('Error creating middle school templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
