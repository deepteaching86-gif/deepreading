import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateVisionTitle() {
  try {
    console.log('🔄 Updating Vision TEST template title...');

    const result = await prisma.testTemplate.update({
      where: {
        templateCode: 'VISION_G2_2025'
      },
      data: {
        title: '초등 2학년 Vision TEST'
      }
    });

    console.log('✅ Vision TEST template updated:');
    console.log(`   Template Code: ${result.templateCode}`);
    console.log(`   Old Title: 초등 2학년 Vision TEST (시선 추적 독해력 진단)`);
    console.log(`   New Title: ${result.title}`);

  } catch (error) {
    console.error('❌ Error updating template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateVisionTitle();
