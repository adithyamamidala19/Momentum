import { Medal } from '../models/Medal.js';
import { Workout } from '../models/Workout.js';
import { FocusSession } from '../models/FocusSession.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

export class MilestoneController {
  static async getMilestones(req, res) {
    const today = getLocalDateString(new Date(), req.user.timezone);
    const streak = await MetricsService.computeStreak(req.user._id, req.user.timezone);
    const [workoutsCount, focusSessions] = await Promise.all([
      Workout.countDocuments({ userId: req.user._id }),
      FocusSession.find({ userId: req.user._id, completed: true })
    ]);

    const totalFocusMinutes = focusSessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);

    // Medal criteria definitions
    const medalDefinitions = [
      { id: 'streak-3', title: '3-Day Rhythm', description: 'Maintained uninterrupted mindful presence for 3 days', tier: 'bronze', reqStreak: 3 },
      { id: 'streak-7', title: '7-Day Sanctuary', description: 'A complete unbroken week of conscious living', tier: 'silver', reqStreak: 7 },
      { id: 'streak-14', title: 'Fortnight of Flow', description: '14 consecutive days of steady mindful practice', tier: 'silver', reqStreak: 14 },
      { id: 'streak-30', title: 'Monthly Harmony', description: '30 days rooted deeply in daily rituals', tier: 'gold', reqStreak: 30 },
      { id: 'streak-60', title: '60-Day Deep Roots', description: 'Two months of unwavering alignment', tier: 'gold', reqStreak: 60 },
      { id: 'streak-100', title: 'Centurion of Presence', description: '100 days of stillness, strength, and rhythm', tier: 'emerald', reqStreak: 100 },
      { id: 'first-workout', title: 'First Temple Movement', description: 'Logged your first conscious workout', tier: 'bronze', reqWorkouts: 1 },
      { id: 'focus-100', title: 'Century of Focus', description: 'Dedicated over 100 minutes to deep presence', tier: 'silver', reqFocusMin: 100 }
    ];

    const userMedals = await Medal.find({ userId: req.user._id });
    const earnedMap = new Map();
    userMedals.forEach((m) => earnedMap.set(m.medalId, m.earnedDate));

    // Award newly unlocked medals
    const medalsResult = await Promise.all(
      medalDefinitions.map(async (def) => {
        let isUnlocked = Boolean(earnedMap.get(def.id));
        let earnedDate = earnedMap.get(def.id) || null;

        // Check unlock conditions
        let meetsCondition = false;
        if (def.reqStreak && streak >= def.reqStreak) meetsCondition = true;
        if (def.reqWorkouts && workoutsCount >= def.reqWorkouts) meetsCondition = true;
        if (def.reqFocusMin && totalFocusMinutes >= def.reqFocusMin) meetsCondition = true;

        if (meetsCondition && !isUnlocked) {
          isUnlocked = true;
          earnedDate = today;
          await Medal.create({
            userId: req.user._id,
            medalId: def.id,
            title: def.title,
            tier: def.tier,
            earnedDate
          }).catch(() => {});
        }

        return {
          id: def.id,
          title: def.title,
          description: def.description,
          tier: def.tier,
          unlocked: isUnlocked,
          earnedDate
        };
      })
    );

    return res.status(200).json({
      streak,
      totalWorkouts: workoutsCount,
      totalFocusMinutes,
      medals: medalsResult
    });
  }
}
