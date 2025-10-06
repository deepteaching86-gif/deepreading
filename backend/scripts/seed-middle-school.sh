#!/bin/bash
# Seed middle school templates to production database

echo "🌱 Seeding middle school templates..."

cd "$(dirname "$0")/.."

# Run the seed script
npx ts-node prisma/seeds/middle-school-templates.ts

echo "✅ Middle school templates seeded successfully!"
