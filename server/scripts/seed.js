import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Ritual } from '../src/models/Ritual.js';
import { Exercise } from '../src/models/Exercise.js';

async function seedDevelopmentData() {
  if (env.NODE_ENV === 'production') {
    console.error('❌ SEEDING IS FORBIDDEN IN PRODUCTION. Real users only.');
    process.exit(1);
  }

  const allowSeed = process.argv.includes('--allow-dev-seed');
  if (!allowSeed) {
    console.error('⚠️ Seeding requires explicit flag: node scripts/seed.js --allow-dev-seed');
    process.exit(1);
  }

  console.log('🌱 Seeding development starter data...');
  await connectDatabase();

  // Seed standard exercise library if empty
  const count = await Exercise.countDocuments();
  if (count === 0) {
    console.log('Seeding standard strength exercise library...');
    await Exercise.insertMany([
      { name: 'Bench Press', muscleGroup: 'chest', isCustom: false },
      { name: 'Incline Dumbbell Press', muscleGroup: 'chest', isCustom: false },
      { name: 'Barbell Squat', muscleGroup: 'legs', isCustom: false },
      { name: 'Deadlift', muscleGroup: 'back', isCustom: false },
      { name: 'Overhead Press', muscleGroup: 'shoulders', isCustom: false },
      { name: 'Barbell Row', muscleGroup: 'back', isCustom: false },
      { name: 'Pull-ups', muscleGroup: 'back', isCustom: false },
      { name: 'Plank', muscleGroup: 'core', isCustom: false }
    ]);
  }

  console.log('✅ Development seeding complete.');
  await disconnectDatabase();
}

seedDevelopmentData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
