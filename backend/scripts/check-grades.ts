import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGrades() {
  const results = await prisma.testResult.findMany({
    select: {
      id: true,
      totalScore: true,
      totalPossible: true,
      percentage: true,
      gradeLevel: true,
      session: {
        select: {
          student: {
            select: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('\n=== Recent Test Results ===\n');
  results.forEach(r => {
    const pct = Number(r.percentage);
    console.log(`Student: ${r.session?.student.user.name}`);
    console.log(`Score: ${r.totalScore}/${r.totalPossible} (${pct.toFixed(2)}%)`);
    console.log(`Grade Level: ${r.gradeLevel}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkGrades().catch(console.error);
