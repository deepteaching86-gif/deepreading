import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calculateGradeLevel(percentage: number): number {
  if (percentage >= 96) return 1;
  if (percentage >= 89) return 2;
  if (percentage >= 77) return 3;
  if (percentage >= 60) return 4;
  if (percentage >= 40) return 5;
  if (percentage >= 23) return 6;
  if (percentage >= 11) return 7;
  if (percentage >= 4) return 8;
  return 9;
}

async function fixGrades() {
  const results = await prisma.testResult.findMany({
    select: {
      id: true,
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
    }
  });

  console.log(`\nFound ${results.length} test results to check...\n`);

  for (const result of results) {
    const percentage = Number(result.percentage);
    const correctGrade = calculateGradeLevel(percentage);
    const currentGrade = result.gradeLevel;

    if (currentGrade !== correctGrade) {
      console.log(`Fixing: ${result.session?.student.user.name}`);
      console.log(`  Percentage: ${percentage.toFixed(2)}%`);
      console.log(`  Current Grade: ${currentGrade} → Correct Grade: ${correctGrade}`);

      await prisma.testResult.update({
        where: { id: result.id },
        data: { gradeLevel: correctGrade }
      });
    }
  }

  console.log('\n✅ All grades fixed!\n');
  await prisma.$disconnect();
}

fixGrades().catch(console.error);
