import prisma from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

// ─── XP CONFIG ──────────────────────────────────────────────────────────────────
// Setiap aksi memberikan jumlah XP tertentu
export const XP_REWARDS: Record<ActivityType, number> = {
  quiz_completed: 50,
  material_read: 20,
  course_enrolled: 30,
  program_enrolled: 40,
  attendance_marked: 25,
  badge_earned: 100,
  level_up: 0, // Level up sendiri tidak memberikan XP tambahan
  friend_added: 15,
  forum_post: 10,
  streak_maintained: 35,
  profile_completed: 50,
};

// ─── LEVEL THRESHOLDS ───────────────────────────────────────────────────────────
// XP yang dibutuhkan untuk setiap level (kumulatif)
// Level 1: 0, Level 2: 100, Level 3: 250, dst (progressive)
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Formula: base * level^1.5 — semakin tinggi makin susah
  return Math.floor(80 * Math.pow(level - 1, 1.5));
}

export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (getXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
} {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  const progressXp = totalXp - currentLevelXp;
  const totalNeeded = nextLevelXp - currentLevelXp;
  const progressPercent =
    totalNeeded > 0
      ? Math.min(100, Math.round((progressXp / totalNeeded) * 100))
      : 100;

  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    progressPercent,
  };
}

// ─── LEVEL TITLES ───────────────────────────────────────────────────────────────
export function getLevelTitle(level: number): string {
  if (level <= 2) return "Pemula";
  if (level <= 5) return "Pelajar";
  if (level <= 10) return "Pencari Ilmu";
  if (level <= 15) return "Penuntut Ilmu";
  if (level <= 20) return "Ahli Ilmu";
  if (level <= 30) return "Mujtahid";
  if (level <= 50) return "Ulama Muda";
  return "Masya Allah";
}

// ─── GRANT XP ───────────────────────────────────────────────────────────────────
// Fungsi utama untuk memberikan XP kepada user + log aktivitas + cek level up + badge
export async function grantXp(params: {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  xpOverride?: number; // Gunakan jika ingin memberikan XP berbeda dari default
  metadata?: Record<string, any>;
}): Promise<{
  xpEarned: number;
  newTotal: number;
  leveledUp: boolean;
  newLevel: number;
  badgesEarned: string[];
}> {
  const { userId, type, title, description, xpOverride, metadata } = params;
  const xpEarned = xpOverride ?? XP_REWARDS[type] ?? 0;

  // 1. Update user points
  const user = await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: xpEarned } },
    select: { points: true, level: true, id: true },
  });

  // 2. Hitung level baru
  const newLevel = getLevelFromXp(user.points);
  const leveledUp = newLevel > user.level;

  // 3. Update level jika naik
  if (leveledUp) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }

  // 4. Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      type,
      title,
      description,
      xpEarned,
      metadata: metadata ?? undefined,
    },
  });

  // 5. Jika level up, log juga sebagai aktivitas
  if (leveledUp) {
    await prisma.activityLog.create({
      data: {
        userId,
        type: "level_up",
        title: `Naik ke Level ${newLevel}!`,
        description: `Selamat! Kamu telah mencapai level ${newLevel} — ${getLevelTitle(newLevel)}`,
        xpEarned: 0,
        metadata: { fromLevel: user.level, toLevel: newLevel },
      },
    });
  }

  // 6. Cek dan berikan badge yang memenuhi syarat
  const badgesEarned = await checkAndAwardBadges(userId);

  return {
    xpEarned,
    newTotal: user.points,
    leveledUp,
    newLevel: leveledUp ? newLevel : user.level,
    badgesEarned,
  };
}

// ─── BADGE CHECKER ──────────────────────────────────────────────────────────────
// Cek semua badge dan berikan yang belum dimiliki jika syarat terpenuhi
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      points: true,
      level: true,
      streak: true,
      quizzes: true,
      earnedBadges: { select: { badge: { select: { code: true } } } },
    },
  });

  if (!user) return [];

  const ownedCodes = new Set(user.earnedBadges.map((ub) => ub.badge.code));
  const allBadges = await prisma.badge.findMany();
  const earned: string[] = [];

  // Hitung stats tambahan untuk badge check
  const [activityCount, quizAttemptCount, friendCount, forumPostCount] =
    await Promise.all([
      prisma.activityLog.count({ where: { userId } }),
      prisma.quiz_attempt.count({ where: { userId } }),
      prisma.friendship.count({
        where: { followerId: userId, status: "accepted" },
      }),
      prisma.activityLog.count({ where: { userId, type: "forum_post" } }),
    ]);

  for (const badge of allBadges) {
    if (ownedCodes.has(badge.code)) continue;

    let qualifies = false;

    switch (badge.code) {
      // ── Learning Badges ──
      case "first_quiz":
        qualifies = quizAttemptCount >= 1;
        break;
      case "quiz_master":
        qualifies = quizAttemptCount >= 10;
        break;
      case "quiz_legend":
        qualifies = quizAttemptCount >= 50;
        break;

      // ── Streak Badges ──
      case "streak_3":
        qualifies = user.streak >= 3;
        break;
      case "streak_7":
        qualifies = user.streak >= 7;
        break;
      case "streak_30":
        qualifies = user.streak >= 30;
        break;

      // ── Social Badges ──
      case "first_friend":
        qualifies = friendCount >= 1;
        break;
      case "social_butterfly":
        qualifies = friendCount >= 10;
        break;
      case "community_pillar":
        qualifies = friendCount >= 25;
        break;

      // ── Achievement Badges ──
      case "level_5":
        qualifies = user.level >= 5;
        break;
      case "level_10":
        qualifies = user.level >= 10;
        break;
      case "level_20":
        qualifies = user.level >= 20;
        break;

      // ── Special Badges ──
      case "active_learner":
        qualifies = activityCount >= 50;
        break;
      case "forum_contributor":
        qualifies = forumPostCount >= 5;
        break;
      case "points_1000":
        qualifies = user.points >= 1000;
        break;
      case "points_5000":
        qualifies = user.points >= 5000;
        break;

      default:
        break;
    }

    if (qualifies) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      // Update badge count pada user
      await prisma.user.update({
        where: { id: userId },
        data: { badges: { increment: 1 } },
      });

      // Log badge earned
      await prisma.activityLog.create({
        data: {
          userId,
          type: "badge_earned",
          title: `Mendapatkan badge: ${badge.name}`,
          description: badge.description,
          xpEarned: badge.xpReward,
          metadata: { badgeCode: badge.code, badgeName: badge.name },
        },
      });

      // Tambah XP dari badge reward
      if (badge.xpReward > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: badge.xpReward } },
        });
      }

      earned.push(badge.code);
    }
  }

  return earned;
}
