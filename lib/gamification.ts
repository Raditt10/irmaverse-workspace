import prisma from "@/lib/prisma";
import { activity_logs_type } from "@prisma/client";

// ─── XP CONFIG ──────────────────────────────────────────────────────────────────
// Hanya 4 sumber XP yang aktif:
//   quiz_completed, program_enrolled, attendance_marked, badge_earned
// Sumber lain dinonaktifkan (0 XP).
export const XP_REWARDS: Record<activity_logs_type, number> = {
  quiz_completed: 50,
  material_read: 0, // dinonaktifkan
  course_enrolled: 0, // dinonaktifkan
  program_enrolled: 40,
  attendance_marked: 25,
  badge_earned: 100,
  level_up: 0, // Level up sendiri tidak memberikan XP tambahan
  friend_added: 0, // dinonaktifkan
  forum_post: 0, // dinonaktifkan
  streak_maintained: 0, // dinonaktifkan
  profile_completed: 0, // dinonaktifkan
};

// Tipe aktivitas yang diizinkan mendapatkan XP
const ALLOWED_XP_TYPES: Set<activity_logs_type> = new Set([
  "quiz_completed",
  "program_enrolled",
  "attendance_marked",
  "badge_earned",
]);

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
// PENTING: Hanya role "user" yang bisa mendapatkan XP.
// Hanya tipe aktivitas yang ada di ALLOWED_XP_TYPES yang memberikan XP.
export async function grantXp(params: {
  userId: string;
  type: activity_logs_type;
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

  const EMPTY_RESULT = {
    xpEarned: 0,
    newTotal: 0,
    leveledUp: false,
    newLevel: 0,
    badgesEarned: [],
  };

  // ── Guard: Hanya role "user" yang boleh mendapat XP ──
  const currentUser = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true, points: true, level: true },
  });
  if (!currentUser || currentUser.role !== "user") return EMPTY_RESULT;

  // ── Guard: Hanya tipe aktivitas yang diizinkan ──
  if (!ALLOWED_XP_TYPES.has(type)) return EMPTY_RESULT;

  const xpEarned = xpOverride ?? XP_REWARDS[type] ?? 0;
  if (xpEarned <= 0) return EMPTY_RESULT;

  // 1. Update user points
  const user = await prisma.users.update({
    where: { id: userId },
    data: { points: { increment: xpEarned } },
    select: { points: true, level: true, id: true },
  });

  // 2. Hitung level baru
  const newLevel = getLevelFromXp(user.points);
  const leveledUp = newLevel > user.level;

  // 3. Update level jika naik
  if (leveledUp) {
    await prisma.users.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }

  // 4. Log activity
  await prisma.activity_logs.create({
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
    await prisma.activity_logs.create({
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
// PENTING: Hanya role "user" yang bisa mendapatkan badge.
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      points: true,
      level: true,
      streak: true,
      quizzes: true,
      earnedBadges: { select: { badge: { select: { code: true } } } },
    },
  });

  if (!user) return [];

  // ── Guard: Hanya role "user" ──
  if (user.role !== "user") return [];

  const ownedCodes = new Set(user.earnedBadges.map((ub) => ub.badge.code));
  const allBadges = await prisma.badges.findMany();
  const earned: string[] = [];

  // Hitung stats tambahan untuk badge check
  const [activityCount, quizAttemptCount, friendCount, forumPostCount] =
    await Promise.all([
      prisma.activity_logs.count({ where: { userId } }),
      prisma.quiz_attempts.count({ where: { userId } }),
      prisma.friendships.count({
        where: { followerId: userId, status: "accepted" },
      }),
      prisma.activity_logs.count({ where: { userId, type: "forum_post" } }),
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
      await prisma.user_badges.create({
        data: { userId, badgeId: badge.id },
      });

      // Update badge count pada user
      await prisma.users.update({
        where: { id: userId },
        data: { badges: { increment: 1 } },
      });

      // Log badge earned
      await prisma.activity_logs.create({
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
        await prisma.users.update({
          where: { id: userId },
          data: { points: { increment: badge.xpReward } },
        });
      }

      earned.push(badge.code);
    }
  }

  return earned;
}
