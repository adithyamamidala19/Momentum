import crypto from 'crypto';
import { Ritual } from '../models/Ritual.js';
import { RitualLog } from '../models/RitualLog.js';
import { HydrationLog } from '../models/HydrationLog.js';
import { ProteinLog } from '../models/ProteinLog.js';
import { FocusSession } from '../models/FocusSession.js';
import { Workout } from '../models/Workout.js';
import { WeeklyScore } from '../models/WeeklyScore.js';
import { Medal } from '../models/Medal.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { calculateWeeklyScore, SCORE_CONFIG } from '../config/scoreConfig.js';
import { getLocalDateString, getIsoWeekId, getYesterdayDateString } from '../utils/timezone.js';

export class MetricsService {
  /**
   * Computes adherence for a single date in user's timezone.
   * REST AND SKIPPED DAYS ARE STRICTLY EXCLUDED FROM THE DENOMINATOR!
   */
  static async computeDailyAdherence(userId, dateStr) {
    const activeRituals = await Ritual.find({ userId, archived: false });
    if (activeRituals.length === 0) return { adherencePct: 0, completedCount: 0, activeCount: 0, eligibleCount: 0 };

    const ritualIds = activeRituals.map((r) => r._id);
    const logs = await RitualLog.find({
      userId,
      ritualId: { $in: ritualIds },
      date: dateStr
    });

    const statusMap = new Map();
    logs.forEach((l) => statusMap.set(l.ritualId.toString(), l.status));

    let completed = 0;
    let skipped = 0;

    activeRituals.forEach((r) => {
      const status = statusMap.get(r._id.toString());
      if (status === 'done') completed++;
      else if (status === 'skipped') skipped++;
    });

    // The denominator excludes skipped/rest days
    const eligibleHabits = activeRituals.length - skipped;
    const habitAdherence = eligibleHabits > 0 ? (completed / eligibleHabits) * 100 : 0;

    return {
      adherencePct: Math.round(habitAdherence),
      completedCount: completed,
      skippedCount: skipped,
      activeCount: activeRituals.length,
      eligibleCount: eligibleHabits
    };
  }

  /**
   * Computes overall consecutive streak in user's timezone.
   * Rest days (all habits skipped or adherence maintained) preserve the streak!
   */
  static async computeStreak(userId, timezone = 'UTC') {
    const today = getLocalDateString(new Date(), timezone);
    const yesterday = getYesterdayDateString(timezone);

    // Get all ritual logs for user sorted descending by date
    const allLogs = await RitualLog.find({ userId }).sort({ date: -1 });
    if (allLogs.length === 0) return 0;

    // Group logs by date
    const logsByDate = new Map();
    allLogs.forEach((l) => {
      if (!logsByDate.has(l.date)) logsByDate.set(l.date, []);
      logsByDate.get(l.date).push(l);
    });

    const dates = Array.from(logsByDate.keys()).sort().reverse();
    if (dates.length === 0) return 0;

    // Check if user has active log today or yesterday to maintain streak
    const hasActivityToday = dates.includes(today);
    const hasActivityYesterday = dates.includes(yesterday);

    if (!hasActivityToday && !hasActivityYesterday) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date();
    // If not checked in today yet, streak check starts from yesterday
    if (!hasActivityToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dStr = getLocalDateString(checkDate, timezone);
      const dayLogs = logsByDate.get(dStr);

      if (!dayLogs || dayLogs.length === 0) {
        break;
      }

      // Check if day was completed or rest day
      const hasDone = dayLogs.some((l) => l.status === 'done');
      const allSkipped = dayLogs.every((l) => l.status === 'skipped');

      if (hasDone || allSkipped) {
        streak++;
      } else {
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Computes per-ritual consecutive streak
   */
  static async computeRitualStreak(userId, ritualId, timezone = 'UTC') {
    const logs = await RitualLog.find({ userId, ritualId, status: 'done' }).sort({ date: -1 });
    if (logs.length === 0) return 0;

    const today = getLocalDateString(new Date(), timezone);
    const yesterday = getYesterdayDateString(timezone);
    const dates = logs.map((l) => l.date);

    if (!dates.includes(today) && !dates.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date();
    if (!dates.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dStr = getLocalDateString(checkDate, timezone);
      if (dates.includes(dStr)) {
        streak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Computes total practice points
   */
  static async computePracticePoints(userId) {
    const { points } = SCORE_CONFIG;

    const [doneRitualsCount, waterLogs, proteinLogs, focusSessions, workouts, completedAchievements] = await Promise.all([
      RitualLog.countDocuments({ userId, status: 'done' }),
      HydrationLog.find({ userId }),
      ProteinLog.find({ userId, deletedAt: null }),
      FocusSession.find({ userId, completed: true }),
      Workout.find({ userId }),
      UserAchievement.find({ userId, completed: true })
    ]);

    const waterGlasses = waterLogs.reduce((acc, curr) => acc + Math.floor(curr.amountMl / 250), 0);
    const focusMins = focusSessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);
    const proteinPoints = proteinLogs.reduce((acc, curr) => acc + Math.round(curr.grams * 0.5), 0);
    const achievementPoints = completedAchievements.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0);

    const total =
      doneRitualsCount * points.habitCompleted +
      waterGlasses * points.waterLoggedPerGlass +
      focusMins * points.focusMinuteMultiplier +
      workouts.length * points.workoutCompleted +
      proteinPoints +
      achievementPoints;

    return Math.max(0, total);
  }

  /**
   * Computes aggregated Today overview payload
   */
  static async getTodayOverview(user) {
    const today = getLocalDateString(new Date(), user.timezone);

    const [
      rituals,
      ritualLogs,
      hydrationLogs,
      proteinLogs,
      focusSessions,
      streak,
      practicePoints
    ] = await Promise.all([
      Ritual.find({ userId: user._id, archived: false }).sort({ order: 1 }),
      RitualLog.find({ userId: user._id, date: today }),
      HydrationLog.find({ userId: user._id, date: today }),
      ProteinLog.find({ userId: user._id, date: today, deletedAt: null }),
      FocusSession.find({ userId: user._id, date: today }),
      this.computeStreak(user._id, user.timezone),
      this.computePracticePoints(user._id)
    ]);

    // Hydration total
    const waterMl = hydrationLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
    const waterTargetMl = user.goals?.waterMl || 2000;
    const waterPct = Math.min(100, Math.round((waterMl / waterTargetMl) * 100));

    // Protein total
    const proteinG = proteinLogs.reduce((acc, curr) => acc + curr.grams, 0);
    const proteinTargetG = user.goals?.proteinG || 90;
    const proteinPct = Math.min(100, Math.round((proteinG / proteinTargetG) * 100));

    // Focus total
    const focusMin = focusSessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);
    const focusTargetMin = user.goals?.focusMin || 25;
    const focusPct = Math.min(100, Math.round((focusMin / focusTargetMin) * 100));

    // Ritual completion status map
    const logMap = new Map();
    ritualLogs.forEach((l) => logMap.set(l.ritualId.toString(), l));

    let completedHabitsCount = 0;
    let skippedHabitsCount = 0;

    const mappedRituals = await Promise.all(
      rituals.map(async (r) => {
        const log = logMap.get(r._id.toString());
        const isDone = log?.status === 'done';
        const isSkipped = log?.status === 'skipped';
        if (isDone) completedHabitsCount++;
        if (isSkipped) skippedHabitsCount++;

        const habitStreak = await this.computeRitualStreak(user._id, r._id, user.timezone);

        return {
          id: r._id,
          name: r.name,
          category: r.category,
          anchor: r.anchor,
          time: r.time,
          completed: isDone,
          skipped: isSkipped,
          streak: habitStreak
        };
      })
    );

    // Habit Adherence excluding skipped/rest days
    const eligibleHabits = rituals.length - skippedHabitsCount;
    const habitPct = eligibleHabits > 0 ? Math.round((completedHabitsCount / eligibleHabits) * 100) : 0;

    // Overall daily adherence composite (weighted: habits 50%, focus 25%, water 25%)
    // If no habits exist, adherence reflects focus (50%) and water (50%)
    const dailyAdherence = rituals.length > 0
      ? Math.round(habitPct * 0.5 + focusPct * 0.25 + waterPct * 0.25)
      : Math.round(focusPct * 0.5 + waterPct * 0.5);

    // Compute Next Up action
    let nextUp = null;
    const incompleteRitual = mappedRituals.find((r) => !r.completed && !r.skipped);
    if (incompleteRitual) {
      nextUp = {
        type: 'ritual',
        id: incompleteRitual.id,
        title: `Next: ${incompleteRitual.name}`,
        subtitle: incompleteRitual.time ? `due ${incompleteRitual.time}` : 'Today',
        actionLabel: 'Check in'
      };
    } else if (waterPct < 100) {
      nextUp = {
        type: 'water',
        title: 'Next: Hydrate with 250ml',
        subtitle: `${waterTargetMl - waterMl}ml to daily intention`,
        actionLabel: 'Log Water'
      };
    } else if (proteinPct < 100) {
      nextUp = {
        type: 'protein',
        title: 'Next: Protein Nourishment',
        subtitle: `${proteinTargetG - proteinG}g remaining today`,
        actionLabel: 'Log Protein'
      };
    } else if (focusPct < 100) {
      nextUp = {
        type: 'focus',
        title: 'Next: Mindful Focus Session',
        subtitle: `${focusTargetMin - focusMin}m remaining today`,
        actionLabel: 'Start Focus'
      };
    } else {
      nextUp = {
        type: 'done',
        title: 'All done. Beautiful day.',
        subtitle: 'Every mindful intention fulfilled.',
        actionLabel: null
      };
    }

    const { milestones, nextMilestone } = await this.computeMilestones(user._id, streak, user.timezone);

    return {
      date: today,
      user: {
        id: user._id,
        displayName: user.displayName,
        mantra: user.mantra,
        photoURL: user.photoURL,
        timezone: user.timezone
      },
      metrics: {
        dailyAdherenceScore: dailyAdherence,
        habitPct,
        focusPct,
        waterPct,
        proteinPct,
        completedHabitsCount,
        activeHabitsCount: rituals.length,
        eligibleHabitsCount: eligibleHabits,
        waterMl,
        waterTargetMl,
        proteinGrams: proteinG,
        proteinTargetGrams: proteinTargetG,
        focusMinutes: focusMin,
        focusTargetMinutes: focusTargetMin,
        streak,
        totalPoints: practicePoints,
        milestones,
        nextMilestone
      },
      nextUp,
      rituals: mappedRituals,
      waterEntries: hydrationLogs,
      proteinEntries: proteinLogs
    };
  }

  /**
   * Computes authoritative 4-tier milestone medals (Bronze, Silver, Gold, Platinum)
   * with unique server verification codes
   */
  static async computeMilestones(userId, streak, timezone = 'UTC') {
    const today = getLocalDateString(new Date(), timezone);
    const tiers = [
      { id: 'ms-bronze', medalId: 'streak-7', name: '7-Day Genesis', tier: 'Bronze', threshold: '7-Day Rhythm', targetDays: 7, desc: 'Establish an unbroken 7-day rhythm of grounded habits.' },
      { id: 'ms-silver', medalId: 'streak-30', name: '30-Day Flow', tier: 'Silver', threshold: '30-Day Rhythm', targetDays: 30, desc: 'Maintain mindful daily presence across a full month of practice.' },
      { id: 'ms-gold', medalId: 'streak-100', name: '100-Day Centurion', tier: 'Gold', threshold: '100-Day Rhythm', targetDays: 100, desc: 'A monumental milestone of 100 continuous days of presence.' },
      { id: 'ms-plat', medalId: 'streak-365', name: '365-Day Master', tier: 'Platinum', threshold: '365-Day Rhythm', targetDays: 365, desc: 'An entire year devoted to unhurried, intentional living.' }
    ];

    const userMedals = await Medal.find({ userId });
    const medalMap = new Map();
    userMedals.forEach((m) => medalMap.set(m.medalId, m));

    const milestones = await Promise.all(
      tiers.map(async (t) => {
        const achieved = streak >= t.targetDays;
        const progress = Math.min(streak, t.targetDays);
        const remainingDays = Math.max(0, t.targetDays - streak);
        const progressPct = Math.round((progress / t.targetDays) * 100);

        let medalDoc = medalMap.get(t.medalId);

        if (achieved && !medalDoc) {
          const verificationCode = `MMTM-${t.tier.slice(0, 1)}${t.targetDays}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          try {
            medalDoc = await Medal.create({
              userId,
              medalId: t.medalId,
              title: t.name,
              tier: t.tier.toLowerCase(),
              earnedDate: today,
              verificationCode
            });
          } catch (e) {
            medalDoc = await Medal.findOne({ userId, medalId: t.medalId });
          }
        }

        return {
          id: t.id,
          medalId: t.medalId,
          name: t.name,
          tier: t.tier,
          threshold: t.threshold,
          targetDays: t.targetDays,
          description: t.desc,
          achieved: Boolean(medalDoc || achieved),
          progress,
          remainingDays,
          progressPct,
          date: medalDoc?.earnedDate || (achieved ? today : null),
          verificationCode: medalDoc?.verificationCode || null,
          sharedCount: medalDoc?.sharedCount || 0
        };
      })
    );

    const nextMilestone = milestones.find((m) => !m.achieved) || milestones[milestones.length - 1];

    return { milestones, nextMilestone };
  }

  /**
   * Recomputes and updates weekly score document for current week
   */
  static async updateWeeklyScore(user) {
    const weekId = getIsoWeekId(new Date());

    if (!user.challenge?.optedIn) {
      return null;
    }

    const practicePoints = await this.computePracticePoints(user._id);

    // Get average adherence over past 7 days
    let totalAdherence = 0;
    let daysCount = 0;
    const tempDate = new Date();

    for (let i = 0; i < 7; i++) {
      const dStr = getLocalDateString(tempDate, user.timezone);
      const dayMetrics = await this.computeDailyAdherence(user._id, dStr);
      totalAdherence += dayMetrics.adherencePct;
      daysCount++;
      tempDate.setDate(tempDate.getDate() - 1);
    }

    const adherenceAvg = Math.round(totalAdherence / Math.max(1, daysCount));

    // Get total focus minutes in current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));

    const focusSessions = await FocusSession.find({
      userId: user._id,
      startedAt: { $gte: startOfWeek }
    });
    const focusMinutes = focusSessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);

    const weeklyScoreVal = calculateWeeklyScore({
      practicePoints,
      avgAdherence: adherenceAvg,
      focusMinutes
    });

    const weeklyDoc = await WeeklyScore.findOneAndUpdate(
      { userId: user._id, weekId },
      {
        userId: user._id,
        weekId,
        nickname: user.challenge.nickname || user.displayName || 'Practitioner',
        avatar: user.challenge.avatar || '🌱',
        practicePoints,
        adherenceAvg,
        focusMinutes,
        weeklyScore: weeklyScoreVal
      },
      { upsert: true, new: true }
    );

    return weeklyDoc;
  }

  /**
   * Computes comprehensive insights data across a date range (e.g. 30 days)
   * in the user's timezone.
   */
  static async computeInsightsRange(user, days = 30) {
    const timezone = user.timezone || 'UTC';
    const todayStr = getLocalDateString(new Date(), timezone);

    // 1. Generate array of date strings from oldest to today
    const dateStrings = [];
    const dateObjects = [];
    const cursor = new Date();

    for (let i = 0; i < days; i++) {
      const dStr = getLocalDateString(cursor, timezone);
      dateStrings.unshift(dStr);
      dateObjects.unshift(new Date(cursor.getTime()));
      cursor.setDate(cursor.getDate() - 1);
    }

    // 2. Query all logs in parallel for the whole range
    const [
      activeRituals,
      ritualLogs,
      hydrationLogs,
      proteinLogs,
      focusSessions,
      totalFocusSessions,
      streak,
      practicePoints
    ] = await Promise.all([
      Ritual.find({ userId: user._id, archived: false }),
      RitualLog.find({ userId: user._id, date: { $in: dateStrings } }),
      HydrationLog.find({ userId: user._id, date: { $in: dateStrings } }),
      ProteinLog.find({ userId: user._id, date: { $in: dateStrings }, deletedAt: null }),
      FocusSession.find({ userId: user._id, date: { $in: dateStrings } }),
      FocusSession.find({ userId: user._id, completed: true }),
      this.computeStreak(user._id, timezone),
      this.computePracticePoints(user._id)
    ]);

    const waterTargetMl = user.goals?.waterMl || 2000;
    const proteinTargetG = user.goals?.proteinG || 90;
    const focusTargetMin = user.goals?.focusMin || 25;

    // Group logs by date
    const ritualLogsByDate = new Map();
    ritualLogs.forEach((l) => {
      if (!ritualLogsByDate.has(l.date)) ritualLogsByDate.set(l.date, []);
      ritualLogsByDate.get(l.date).push(l);
    });

    const hydrationLogsByDate = new Map();
    hydrationLogs.forEach((l) => {
      if (!hydrationLogsByDate.has(l.date)) hydrationLogsByDate.set(l.date, []);
      hydrationLogsByDate.get(l.date).push(l);
    });

    const proteinLogsByDate = new Map();
    proteinLogs.forEach((l) => {
      if (!proteinLogsByDate.has(l.date)) proteinLogsByDate.set(l.date, []);
      proteinLogsByDate.get(l.date).push(l);
    });

    const focusLogsByDate = new Map();
    focusSessions.forEach((l) => {
      if (!focusLogsByDate.has(l.date)) focusLogsByDate.set(l.date, []);
      focusLogsByDate.get(l.date).push(l);
    });

    let cumulativeAdherence = 0;
    const heatmap = [];

    dateStrings.forEach((dStr, idx) => {
      const dObj = dateObjects[idx];
      const dayRitualLogs = ritualLogsByDate.get(dStr) || [];
      const dayHydrationLogs = hydrationLogsByDate.get(dStr) || [];
      const dayProteinLogs = proteinLogsByDate.get(dStr) || [];
      const dayFocusLogs = focusLogsByDate.get(dStr) || [];

      // Ritual adherence
      let completedCount = 0;
      let skippedCount = 0;
      dayRitualLogs.forEach((l) => {
        if (l.status === 'done') completedCount++;
        else if (l.status === 'skipped') skippedCount++;
      });

      const eligibleHabits = Math.max(0, activeRituals.length - skippedCount);
      const habitPct = eligibleHabits > 0 ? (completedCount / eligibleHabits) * 100 : 0;
      const isRestDay =
        (skippedCount > 0 && completedCount === 0) ||
        (activeRituals.length > 0 && skippedCount === activeRituals.length);

      // Hydration
      const dayWaterMl = dayHydrationLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
      const waterPct = Math.min(100, Math.round((dayWaterMl / waterTargetMl) * 100));

      // Protein
      const dayProteinG = dayProteinLogs.reduce((acc, curr) => acc + curr.grams, 0);
      const proteinPct = Math.min(100, Math.round((dayProteinG / proteinTargetG) * 100));

      // Focus
      const dayFocusMin = dayFocusLogs.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);
      const focusPct = Math.min(100, Math.round((dayFocusMin / focusTargetMin) * 100));

      // Composite daily adherence (rituals 50%, focus 25%, water 25%)
      let dailyAdherence = 0;
      if (isRestDay) {
        dailyAdherence = 0;
      } else if (activeRituals.length > 0) {
        dailyAdherence = Math.round(habitPct * 0.5 + focusPct * 0.25 + waterPct * 0.25);
      } else {
        dailyAdherence = Math.round(focusPct * 0.5 + waterPct * 0.5);
      }

      // Adherence level
      let level = 'none';
      if (isRestDay) {
        level = 'rest';
      } else if (dailyAdherence >= 80) {
        level = 'peak';
      } else if (dailyAdherence >= 50) {
        level = 'moderate';
      } else if (dailyAdherence > 0) {
        level = 'low';
      }

      const dayOfMonth = parseInt(dStr.slice(8, 10), 10);
      const weekdayShort = dObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthShort = dObj.toLocaleDateString('en-US', { month: 'short' });
      const dateLabel = `${monthShort} ${dayOfMonth}`;
      const isToday = dStr === todayStr;

      heatmap.push({
        date: dStr,
        dayIndex: dayOfMonth,
        weekday: weekdayShort,
        dateLabel,
        isToday,
        isRestDay,
        level,
        adherence: dailyAdherence,
        completed: completedCount,
        skipped: skippedCount,
        total: activeRituals.length,
        eligible: eligibleHabits,
        focusMin: dayFocusMin,
        waterMl: dayWaterMl,
        proteinG: dayProteinG
      });

      if (!isRestDay) {
        cumulativeAdherence += dailyAdherence;
      }
    });

    // Momentum curve (smoothed with 3-day rolling average)
    const momentumCurve = heatmap.map((pt, idx) => {
      const window = heatmap.slice(Math.max(0, idx - 2), idx + 1);
      const rollingAvg = Math.round(window.reduce((acc, w) => acc + w.adherence, 0) / window.length);
      return {
        date: pt.date,
        dayIndex: pt.dayIndex,
        dateLabel: pt.dateLabel,
        weekday: pt.weekday,
        isToday: pt.isToday,
        isRestDay: pt.isRestDay,
        adherence: pt.adherence,
        rollingAverage: rollingAvg
      };
    });

    const activeDaysCount = heatmap.filter((d) => !d.isRestDay).length;
    const averageAdherence = Math.round(cumulativeAdherence / Math.max(1, activeDaysCount));
    const currentMomentum = momentumCurve[momentumCurve.length - 1]?.rollingAverage || averageAdherence;

    const totalMindfulMins = totalFocusSessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);
    const mindfulHours = Math.round((totalMindfulMins / 60) * 10) / 10;

    const hasAnyLogs =
      ritualLogs.length > 0 ||
      hydrationLogs.length > 0 ||
      proteinLogs.length > 0 ||
      focusSessions.length > 0;

    return {
      range: `${days}d`,
      daysCount: days,
      averageAdherence,
      currentMomentum,
      totalScore: practicePoints,
      streak,
      mindfulHours,
      hasAnyLogs,
      heatmap,
      momentumCurve
    };
  }
}
