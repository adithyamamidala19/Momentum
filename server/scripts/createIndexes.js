import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Ritual } from '../src/models/Ritual.js';
import { RitualLog } from '../src/models/RitualLog.js';
import { Todo } from '../src/models/Todo.js';
import { HydrationLog } from '../src/models/HydrationLog.js';
import { ProteinLog } from '../src/models/ProteinLog.js';
import { FocusSession } from '../src/models/FocusSession.js';
import { Workout } from '../src/models/Workout.js';
import { PersonalRecord } from '../src/models/PersonalRecord.js';
import { WeeklyScore } from '../src/models/WeeklyScore.js';
import { Medal } from '../src/models/Medal.js';

async function createAllIndexes() {
  console.log('🍃 Connecting to MongoDB to ensure indexes...');
  await connectDatabase();

  const models = [
    User,
    Ritual,
    RitualLog,
    Todo,
    HydrationLog,
    ProteinLog,
    FocusSession,
    Workout,
    PersonalRecord,
    WeeklyScore,
    Medal
  ];

  for (const model of models) {
    console.log(`Creating indexes for ${model.modelName}...`);
    await model.createIndexes();
  }

  console.log('✅ All MongoDB Atlas indexes created and synced successfully.');
  await disconnectDatabase();
}

createAllIndexes().catch((err) => {
  console.error('❌ Failed to create indexes:', err);
  process.exit(1);
});
