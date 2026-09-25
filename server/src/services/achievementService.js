import { AchievementDefinition } from '../models/AchievementDefinition.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { HydrationLog } from '../models/HydrationLog.js';
import { FocusSession } from '../models/FocusSession.js';
import { ProteinLog } from '../models/ProteinLog.js';
import { Ritual } from '../models/Ritual.js';
import { RitualLog } from '../models/RitualLog.js';
import { getLocalDateString, getIsoWeekId } from '../utils/timezone.js';

export const DEFAULT_ACHIEVEMENT_DEFINITIONS = [
  {
    key: 'hydration-hero-weekly',
    title: 'Hydration Hero',
    description: 'Drink 10L of water in a week',
    icon: '💧',
    metric: 'water_ml',
    period: 'weekly',
    targetValue: 10000,
    unit: 'ml',
    tier: 'Bronze',
    pointsAwarded: 50,
    displayOrder: 1
  },
  {
    key: 'deep-diver-monthly',
    title: 'Deep Diver',
    description: 'Log 40L of water in a month',
    icon: '🌊',
    metric: 'water_ml',
    period: 'monthly',
    targetValue: 40000,
    unit: 'ml',
    tier: 'Gold',
    pointsAwarded: 150,
    displayOrder: 2
  },
  {
    key: 'focused-mind-weekly',
    title: 'Focused Mind',
    description: 'Complete 5 hours of focus sessions in a week',
    icon: '🧘',
    metric: 'focus_min',
    period: 'weekly',
    targetValue: 300,
    unit: 'min',
    tier: 'Silver',
    pointsAwarded: 60,
    displayOrder: 3
  },
  {
    key: 'protein-powerhouse-weekly',
    title: 'Protein Powerhouse',
    description: 'Hit your daily protein goal 5 days in a week',
    icon: '🥩',
    metric: 'protein_days',
    period: 'weekly',
    targetValue: 5,
    unit: 'days',
    tier: 'Silver',
    pointsAwarded: 50,
    displayOrder: 4
  },
  {
    key: 'consistency-circle-weekly',
    title: 'Consistency Circle',
    description: 'Complete all due rituals 6 out of 7 days in a week',
    icon: '⭕',
    metric: 'ritual_days',
    period: 'weekly',
    targetValue: 6,
    unit: 'days',
    tier: 'Gold',
    pointsAwarded: 75,
    displayOrder: 5
  },
  {
    key: 'monthly-momentum',
    title: 'Monthly Momentum',
    description: 'Maintain 80%+ average adherence for a full month',
    icon: '🌿',
    metric: 'adherence_pct',
    period: 'monthly',
    targetValue: 80,
    unit: '%',
    tier: 'Platinum',
    pointsAwarded: 200,
    displayOrder: 6
  }
];

export class AchievementService {
  /**
   * Seed default achievement definitions if they don't exist
   */
  static async seedDefinitions() {
    for (const def of DEFAULT_ACHIEVEMENT_DEFINITIONS) {
      await AchievementDefinition.findOneAndUpdate(
        { key: def.key },
        { $setOnInsert: def },
        { upsert: true }
      );
    }
  }

  /**
   * Calculates weekly and monthly period bounds in user timezone
   */
  static getPeriodBounds(date = new Date(), timezone = 'UTC') {
    const todayStr = getLocalDateString(date, timezone);
    const now = new Date(`${todayStr}T12:00:00Z`);

    // ── Weekly Calculation (Monday to Sunday) ──
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const weeklyStart = monday.toISOString().slice(0, 10);
    const weeklyEnd = sunday.toISOString().slice(0, 10);
    const weeklyKey = getIsoWeekId(date);
    const daysLeftInWeek = Math.max(0, 6 - diffToMonday);

    // ── Monthly Calculation (1st to last day of month) ──
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-indexed
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));

    const monthlyStart = firstDay.toISOString().slice(0, 10);
    const monthlyEnd = lastDay.toISOString().slice(0, 10);
    const monthlyKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysLeftInMonth = Math.max(0, lastDay.getUTCDate() - now.getUTCDate());

    return {
      todayStr,
      weekly: {
        periodKey: weeklyKey,
        periodStart: weeklyStart,
        periodEnd: weeklyEnd,
        daysRemaining: daysLeftInWeek
      },
      monthly: {
        periodKey: monthlyKey,
        periodStart: monthlyStart,
        periodEnd: monthlyEnd,
        daysRemaining: daysLeftInMonth,
        monthName: now.toLocaleDateString('en-US', { month: 'long' })
      }
    };
  }

  /**
   * Generates array of YYYY-MM-DD date strings between start and end inclusive
   */
  static getDateRangeArray(startStr, endStr) {
    const dates = [];
    const curr = new Date(`${startStr}T00:00:00Z`);
    const end = new Date(`${endStr}T00:00:00Z`);
    while (curr <= end) {
      dates.push(curr.toISOString().slice(0, 10));
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
    return dates;
  }

  /**
   * Recomputes all active weekly and monthly user achievements from raw logs
   */
  static async recomputeUserAchievements(user) {
    await this.seedDefinitions();
    const timezone = user.timezone || 'UTC';
    const bounds = this.getPeriodBounds(new Date(), timezone);
    const definitions = await AchievementDefinition.find({ active: true }).sort({ displayOrder: 1 });

    const newlyCompleted = [];

    // Pre-fetch date arrays
    const weeklyDates = this.getDateRangeArray(bounds.weekly.periodStart, bounds.weekly.periodEnd);
    const monthlyDates = this.getDateRangeArray(bounds.monthly.periodStart, bounds.monthly.periodEnd);

    // Filter date arrays up to today so we only inspect elapsed days
    const elapsedWeeklyDates = weeklyDates.filter((d) => d <= bounds.todayStr);
    const elapsedMonthlyDates = monthlyDates.filter((d) => d <= bounds.todayStr);

    // Pre-fetch logs for weekly & monthly windows
    const [
      activeRituals,
      weeklyHydration,
      monthlyHydration,
      weeklyFocus,
      weeklyProtein,
      weeklyRitualLogs,
      monthlyRitualLogs
    ] = await Promise.all([
      Ritual.find({ userId: user._id, archived: false }),
      HydrationLog.find({ userId: user._id, date: { $in: weeklyDates } }),
      HydrationLog.find({ userId: user._id, date: { $in: monthlyDates } }),
      FocusSession.find({ userId: user._id, date: { $in: weeklyDates }, completed: true }),
      ProteinLog.find({ userId: user._id, date: { $in: weeklyDates }, deletedAt: null }),
      RitualLog.find({ userId: user._id, date: { $in: weeklyDates } }),
      RitualLog.find({ userId: user._id, date: { $in: monthlyDates } })
    ]);

    const proteinTargetG = user.goals?.proteinG || 90;

    for (const def of definitions) {
      const isWeekly = def.period === 'weekly';
      const periodInfo = isWeekly ? bounds.weekly : bounds.monthly;
      const periodDates = isWeekly ? weeklyDates : monthlyDates;
      const elapsedDates = isWeekly ? elapsedWeeklyDates : elapsedMonthlyDates;

      let progress = 0;

      switch (def.metric) {
        case 'water_ml': {
          const logs = isWeekly ? weeklyHydration : monthlyHydration;
          progress = logs.reduce((sum, log) => sum + (log.amountMl || 0), 0);
          break;
        }
        case 'focus_min': {
          progress = weeklyFocus.reduce((sum, session) => sum + (session.actualMin || 0), 0);
          break;
        }
        case 'protein_days': {
          // Count distinct days in week where sum(grams) >= proteinTargetG
          const gramsByDate = new Map();
          weeklyProtein.forEach((p) => {
            gramsByDate.set(p.date, (gramsByDate.get(p.date) || 0) + p.grams);
          });
          let qualifyingDays = 0;
          gramsByDate.forEach((g) => {
            if (g >= proteinTargetG) qualifyingDays++;
          });
          progress = qualifyingDays;
          break;
        }
        case 'ritual_days': {
          // Count days where all eligible rituals were completed (excluding skipped/rest days)
          const logsByDate = new Map();
          weeklyRitualLogs.forEach((l) => {
            if (!logsByDate.has(l.date)) logsByDate.set(l.date, []);
            logsByDate.get(l.date).push(l);
          });

          let fullRitualDays = 0;
          elapsedDates.forEach((dStr) => {
            const dLogs = logsByDate.get(dStr) || [];
            let completed = 0;
            let skipped = 0;
            dLogs.forEach((l) => {
              if (l.status === 'done') completed++;
              else if (l.status === 'skipped') skipped++;
            });
            const eligible = Math.max(0, activeRituals.length - skipped);
            // If user completed all eligible rituals (and had at least 1 ritual done), count as successful ritual day
            if (eligible > 0 && completed >= eligible) {
              fullRitualDays++;
            }
          });
          progress = fullRitualDays;
          break;
        }
        case 'adherence_pct': {
          // Monthly average adherence excluding pure rest days
          const logsByDate = new Map();
          monthlyRitualLogs.forEach((l) => {
            if (!logsByDate.has(l.date)) logsByDate.set(l.date, []);
            logsByDate.get(l.date).push(l);
          });

          let totalAdherence = 0;
          let evaluatedDays = 0;
          elapsedDates.forEach((dStr) => {
            const dLogs = logsByDate.get(dStr) || [];
            let completed = 0;
            let skipped = 0;
            dLogs.forEach((l) => {
              if (l.status === 'done') completed++;
              else if (l.status === 'skipped') skipped++;
            });
            const eligible = Math.max(0, activeRituals.length - skipped);
            if (eligible > 0) {
              const dayPct = Math.round((completed / eligible) * 100);
              totalAdherence += dayPct;
              evaluatedDays++;
            }
          });
          progress = evaluatedDays > 0 ? Math.round(totalAdherence / evaluatedDays) : 0;
          break;
        }
        default:
          progress = 0;
      }

      const progressPct = Math.min(100, Math.round((progress / def.targetValue) * 100));
      const isCompleted = progress >= def.targetValue;

      // Check existing user achievement record for this period
      let userAch = await UserAchievement.findOne({
        userId: user._id,
        achievementKey: def.key,
        periodKey: periodInfo.periodKey
      });

      if (!userAch) {
        userAch = new UserAchievement({
          userId: user._id,
          achievementDefinitionId: def._id,
          achievementKey: def.key,
          periodType: def.period,
          periodKey: periodInfo.periodKey,
          periodStart: periodInfo.periodStart,
          periodEnd: periodInfo.periodEnd,
          currentProgress: progress,
          targetValue: def.targetValue,
          progressPct,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
          pointsAwarded: isCompleted ? def.pointsAwarded : 0
        });
        await userAch.save();
        if (isCompleted) {
          newlyCompleted.push({
            id: userAch._id,
            key: def.key,
            title: def.title,
            icon: def.icon,
            points: def.pointsAwarded,
            period: def.period
          });
        }
      } else {
        const wasCompleted = userAch.completed;
        userAch.currentProgress = progress;
        userAch.progressPct = progressPct;

        if (!wasCompleted && isCompleted) {
          userAch.completed = true;
          userAch.completedAt = new Date();
          userAch.pointsAwarded = def.pointsAwarded;
          newlyCompleted.push({
            id: userAch._id,
            key: def.key,
            title: def.title,
            icon: def.icon,
            points: def.pointsAwarded,
            period: def.period
          });
        }
        await userAch.save();
      }
    }

    // Retrieve active and past achievements
    const allUserAchievements = await UserAchievement.find({ userId: user._id })
      .populate('achievementDefinitionId')
      .sort({ createdAt: -1 });

    const activeWeekly = [];
    const activeMonthly = [];
    const pastCompleted = [];

    allUserAchievements.forEach((ua) => {
      const def = ua.achievementDefinitionId;
      if (!def) return;

      const item = {
        id: ua._id,
        key: def.key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        metric: def.metric,
        period: def.period,
        targetValue: def.targetValue,
        unit: def.unit,
        tier: def.tier,
        pointsAwarded: def.pointsAwarded,
        currentProgress: ua.currentProgress,
        progressPct: ua.progressPct,
        completed: ua.completed,
        completedAt: ua.completedAt,
        periodKey: ua.periodKey,
        periodStart: ua.periodStart,
        periodEnd: ua.periodEnd
      };

      if (ua.periodKey === bounds.weekly.periodKey && def.period === 'weekly') {
        item.daysRemaining = bounds.weekly.daysRemaining;
        item.remainingAmount = Math.max(0, def.targetValue - ua.currentProgress);
        activeWeekly.push(item);
      } else if (ua.periodKey === bounds.monthly.periodKey && def.period === 'monthly') {
        item.daysRemaining = bounds.monthly.daysRemaining;
        item.remainingAmount = Math.max(0, def.targetValue - ua.currentProgress);
        item.monthName = bounds.monthly.monthName;
        activeMonthly.push(item);
      } else if (ua.completed) {
        pastCompleted.push(item);
      }
    });

    return {
      bounds,
      activeWeekly,
      activeMonthly,
      pastCompleted,
      newlyCompleted
    };
  }
}
