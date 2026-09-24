import { User } from '../models/User.js';
import { Ritual } from '../models/Ritual.js';
import { RitualLog } from '../models/RitualLog.js';
import { Todo } from '../models/Todo.js';
import { HydrationLog } from '../models/HydrationLog.js';
import { ProteinLog } from '../models/ProteinLog.js';
import { FocusSession } from '../models/FocusSession.js';
import { Workout } from '../models/Workout.js';
import { PersonalRecord } from '../models/PersonalRecord.js';
import { CardioLog } from '../models/CardioLog.js';
import { AriaMessage } from '../models/AriaMessage.js';
import { WeeklyScore } from '../models/WeeklyScore.js';
import { Medal } from '../models/Medal.js';

export class ExportService {
  static async exportUserData(userId) {
    const [
      user,
      rituals,
      ritualLogs,
      todos,
      hydrationLogs,
      proteinLogs,
      focusSessions,
      workouts,
      prs,
      cardioLogs,
      ariaMessages,
      weeklyScores,
      medals
    ] = await Promise.all([
      User.findById(userId).select('-__v'),
      Ritual.find({ userId }).select('-__v'),
      RitualLog.find({ userId }).select('-__v'),
      Todo.find({ userId }).select('-__v'),
      HydrationLog.find({ userId }).select('-__v'),
      ProteinLog.find({ userId }).select('-__v'),
      FocusSession.find({ userId }).select('-__v'),
      Workout.find({ userId }).select('-__v'),
      PersonalRecord.find({ userId }).select('-__v'),
      CardioLog.find({ userId }).select('-__v'),
      AriaMessage.find({ userId }).select('-__v'),
      WeeklyScore.find({ userId }).select('-__v'),
      Medal.find({ userId }).select('-__v')
    ]);

    return {
      exportedAt: new Date().toISOString(),
      formatVersion: '1.0.0',
      user: {
        email: user?.email,
        displayName: user?.displayName,
        mantra: user?.mantra,
        timezone: user?.timezone,
        units: user?.units,
        goals: user?.goals,
        createdAt: user?.createdAt
      },
      rituals,
      ritualLogs,
      todos,
      hydration: hydrationLogs,
      protein: proteinLogs,
      focusSessions,
      workouts,
      personalRecords: prs,
      cardioLogs,
      ariaMessages,
      weeklyScores,
      medals
    };
  }
}
