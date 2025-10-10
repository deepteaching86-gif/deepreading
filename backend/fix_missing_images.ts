import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fixMissingImages() {
  try {
    // Find all questions with imageUrl
    const questionsWithImages = await prisma.question.findMany({
      where: {
        imageUrl: { not: null }
      },
      select: {
        id: true,
        questionNumber: true,
        imageUrl: true,
        template: {
          select: {
            grade: true,
            templateCode: true
          }
        }
      }
    });

    console.log(`Found ${questionsWithImages.length} questions with images`);

    let missingCount = 0;
    let fixedCount = 0;

    for (const question of questionsWithImages) {
      if (!question.imageUrl) continue;

      // Check if file exists
      const filePath = path.join(__dirname, 'uploads', 'questions', path.basename(question.imageUrl));
      
      if (!fs.existsSync(filePath)) {
        console.log(`Missing image for question ${question.questionNumber} (Grade ${question.template.grade}): ${question.imageUrl}`);
        missingCount++;

        // Set imageUrl to null
        await prisma.question.update({
          where: { id: question.id },
          data: { imageUrl: null }
        });
        
        fixedCount++;
        console.log(`  → Updated to remove broken image reference`);
      }
    }

    console.log(`\nSummary:`);
    console.log(`- Total questions with images: ${questionsWithImages.length}`);
    console.log(`- Missing images: ${missingCount}`);
    console.log(`- Fixed: ${fixedCount}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingImages();
