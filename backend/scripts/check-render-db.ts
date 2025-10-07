// Check what's in the production database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
  },
});

async function checkDatabase() {
  try {
    console.log('Checking production database...\n');

    // Check admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true, name: true, role: true, createdAt: true },
    });
    console.log('👤 Admin accounts:', admins.length);
    admins.forEach((a) => console.log(`  - ${a.email} (${a.name})`));

    // Check students
    const studentCount = await prisma.user.count({ where: { role: 'student' } });
    console.log(`\n🎓 Students: ${studentCount}`);

    // Check templates
    const templates = await prisma.testTemplate.findMany({
      select: { templateCode: true, title: true, status: true },
    });
    console.log(`\n📝 Templates: ${templates.length}`);
    templates.slice(0, 5).forEach((t) => console.log(`  - ${t.templateCode}: ${t.title} (${t.status})`));

    // Check sessions
    const sessionCount = await prisma.testSession.count();
    const scoredCount = await prisma.testSession.count({ where: { status: 'scored' } });
    console.log(`\n📊 Sessions: ${sessionCount} total, ${scoredCount} scored`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
