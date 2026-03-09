import {
  PrismaClient,
  material_grade,
  material_category,
  NotificationType,
  NotificationStatus,
  FriendshipStatus,
  ActivityType,
  BadgeCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding data...");

  // ── CLEAR ─────────────────────────────────────────────────────────────────
  console.log("🧹 Clearing existing data...");
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.materialinvite.deleteMany();
  await prisma.courseenrollment.deleteMany();
  await prisma.program_enrollment.deleteMany();
  await prisma.material.deleteMany();
  await prisma.program.deleteMany();
  await prisma.news.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Database cleared");

  const hashedPassword = await bcrypt.hash("password123", 10);
  const now = new Date();

  // ── USERS (main) ──────────────────────────────────────────────────────────
  const user1 = await prisma.user.create({
    data: {
      email: "ustadz.ahmad@irma.com",
      name: "Ustadz Ahmad Zaki",
      password: hashedPassword,
      role: "user",
      notelp: "081234567890",
      address: "Jakarta, Indonesia",
      bio: "Pengajar bijak dengan 15 tahun pengalaman",
      bidangKeahlian: "Akidah dan Aqidah",
      pengalaman:
        "Mengajar sejak tahun 2010 di berbagai pesantren dan institusi pendidikan",
      points: 1250,
      level: 7,
      streak: 14,
      badges: 6,
      quizzes: 12,
      averageScore: 86,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "ustadzah.fatimah@irma.com",
      name: "Ustadzah Fatimah",
      password: hashedPassword,
      role: "instruktur",
      notelp: "082345678901",
      address: "Bandung, Indonesia",
      bio: "Spesialis dalam mengajar Al-Quran dan Tafsir",
      bidangKeahlian: "Al-Quran dan Tafsir",
      pengalaman: "Pengalaman 10 tahun mengajar dan membimbing santri",
      points: 2100,
      level: 10,
      streak: 21,
      badges: 8,
      quizzes: 18,
      averageScore: 92,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "rafa@irma.com",
      name: "Rafa Ardanza",
      password: hashedPassword,
      role: "user",
      notelp: "083456789012",
      address: "Surabaya, Indonesia",
      bio: "Santri yang antusias belajar",
      points: 480,
      level: 4,
      streak: 7,
      badges: 3,
      quizzes: 5,
      averageScore: 78,
    },
  });

  // Extra users for richer leaderboard
  const user4 = await prisma.user.create({
    data: {
      email: "ali.hakim@irma.com",
      name: "Ali Hakim",
      password: hashedPassword,
      role: "user",
      notelp: "084567890123",
      address: "Yogyakarta, Indonesia",
      bio: "Pecinta ilmu dan penghapal Al-Quran",
      points: 3500,
      level: 14,
      streak: 30,
      badges: 10,
      quizzes: 25,
      averageScore: 95,
    },
  });

  const user5 = await prisma.user.create({
    data: {
      email: "siti.aisyah@irma.com",
      name: "Siti Aisyah",
      password: hashedPassword,
      role: "instruktur",
      notelp: "085678901234",
      address: "Semarang, Indonesia",
      bio: "Instruktur Fiqih Wanita berpengalaman",
      bidangKeahlian: "Fiqih Wanita",
      pengalaman: "8 tahun mengajar di ma'had",
      points: 1800,
      level: 9,
      streak: 10,
      badges: 7,
      quizzes: 14,
      averageScore: 89,
    },
  });

  const user6 = await prisma.user.create({
    data: {
      email: "hasan.basri@irma.com",
      name: "Hasan Basri",
      password: hashedPassword,
      role: "user",
      notelp: "086789012345",
      address: "Malang, Indonesia",
      bio: "Mahasiswa ilmu syariah",
      points: 750,
      level: 5,
      streak: 5,
      badges: 4,
      quizzes: 8,
      averageScore: 82,
    },
  });

  const user7 = await prisma.user.create({
    data: {
      email: "zahra.putri@irma.com",
      name: "Zahra Putri",
      password: hashedPassword,
      role: "user",
      notelp: "087890123456",
      address: "Depok, Indonesia",
      bio: "Senang belajar hadits dan tafsir",
      points: 320,
      level: 3,
      streak: 3,
      badges: 2,
      quizzes: 4,
      averageScore: 75,
    },
  });

  const user8 = await prisma.user.create({
    data: {
      email: "umar.faruq@irma.com",
      name: "Umar Faruq",
      password: hashedPassword,
      role: "user",
      notelp: "088901234567",
      address: "Medan, Indonesia",
      bio: "Santri baru yang bersemangat",
      points: 90,
      level: 1,
      streak: 1,
      badges: 0,
      quizzes: 1,
      averageScore: 65,
    },
  });

  const allMainUsers = [user1, user2, user3, user4, user5, user6, user7, user8];

  // ── INSTRUCTOR ACCOUNTS ───────────────────────────────────────────────────
  const instructors = [
    { id: "101", conID: "inst-ahmad", name: "Ustadz Ahmad Zaki" },
    { id: "102", conID: "inst-fatimah", name: "Ustadzah Fatimah" },
    { id: "103", conID: "inst-rizki", name: "Ustadz Muhammad Rizki" },
    { id: "104", conID: "inst-abdullah", name: "Ustadz Abdullah" },
    { id: "105", conID: "inst-ali", name: "Ustadz Ali Hasan" },
    { id: "106", conID: "inst-khadijah", name: "Ustadzah Khadijah" },
  ];

  const instructorXp = [400, 600, 350, 280, 500, 450];
  for (let i = 0; i < instructors.length; i++) {
    const inst = instructors[i];
    await prisma.user.create({
      data: {
        id: inst.id,
        name: inst.name,
        email: `${inst.conID}@irma.com`,
        password: hashedPassword,
        role: "instruktur",
        points: instructorXp[i],
        level: Math.max(1, Math.floor(instructorXp[i] / 100)),
        streak: Math.floor(Math.random() * 10) + 1,
        badges: Math.floor(Math.random() * 3),
        quizzes: Math.floor(Math.random() * 5),
        averageScore: Math.floor(Math.random() * 20) + 75,
      },
    });
  }

  // ── NEWS ──────────────────────────────────────────────────────────────────
  const news1 = await prisma.news.create({
    data: {
      title: "Kedudukan Akal dan Wahyu",
      slug: "kedudukan-akal-dan-wahyu",
      category: "Kajian",
      deskripsi:
        "Memahami hubungan dan kedudukan akal dalam konteks wahyu ilahi",
      content: `# Kedudukan Akal dan Wahyu\n\nDalam khazanah pemikiran Islam, relasi antara akal dan wahyu telah menjadi topik diskusi yang mendalam.\n\n## Pengertian Akal dalam Islam\n\nAkal merupakan nikmat yang diberikan Allah kepada manusia...\n\n## Kedudukan Wahyu\n\nWahyu adalah petunjuk langsung dari Allah kepada hamba-Nya...\n\n## Hubungan Akal dan Wahyu\n\nAkal dan wahyu bukan dua hal yang saling bertentangan...`,
      image:
        "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500",
      authorId: user1.id,
    },
  });

  await prisma.news.create({
    data: {
      title: "Fiqih Ibadah Sehari-hari",
      slug: "fiqih-ibadah-sehari-hari",
      category: "Pembelajaran",
      deskripsi:
        "Panduan praktis menjalankan ibadah dalam kehidupan sehari-hari",
      content: `# Fiqih Ibadah Sehari-hari\n\nIbadah bukan hanya dilakukan di masjid, tetapi adalah bagian dari kehidupan sehari-hari.\n\n## Wudhu yang Sempurna\n\nWudhu adalah niat untuk membersihkan diri...\n\n## Shalat Dengan Khusyu'\n\nKhusyu' adalah hadirnya hati dalam shalat...`,
      image:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500",
      authorId: user2.id,
    },
  });

  await prisma.news.create({
    data: {
      title: "Tafsir Al-Quran Surat Al-Fatihah",
      slug: "tafsir-al-quran-surat-al-fatihah",
      category: "Tafsir",
      deskripsi: "Penjelasan mendalam tentang surat pertama dalam Al-Quran",
      content: `# Tafsir Al-Quran Surat Al-Fatihah\n\nSurat Al-Fatihah adalah surat pembuka Al-Quran yang penuh dengan makna dan hikmah.\n\n## Bismillah\n\nMembaca dengan nama Allah adalah cara memulai segala aktivitas...\n\n## Alhamdulillah\n\nSegala puji bagi Allah, Tuhan sekalian alam...`,
      image:
        "https://images.unsplash.com/photo-1488173174519-e21cc028cb29?w=500",
      authorId: user2.id,
    },
  });

  await prisma.news.create({
    data: {
      title: "Akhlak Mulia dalam Berinteraksi",
      slug: "akhlak-mulia-dalam-berinteraksi",
      category: "Akhlak",
      deskripsi:
        "Mempelajari etika Islam dalam menjalin hubungan dengan sesama",
      content: `# Akhlak Mulia dalam Berinteraksi\n\nIslam mengajarkan akhlak yang luhur dalam setiap aspek interaksi sosial.\n\n## Salam dan Sapa\n\nMemberikan salam adalah bentuk kasih sayang...\n\n## Silaturahmi\n\nMenjaga hubungan baik dengan keluarga dan teman...`,
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500",
      authorId: user1.id,
    },
  });

  await prisma.news.create({
    data: {
      title: "Memahami Hadis Nabawi",
      slug: "memahami-hadis-nabawi",
      category: "Pembelajaran",
      deskripsi:
        "Pengenalan tentang hadis dan cara memahami petunjuk Rasulullah",
      content: `# Memahami Hadis Nabawi\n\nHadis adalah warisan berharga dari Rasulullah Muhammad SAW...\n\n## Definisi Hadis\n\nHadis adalah segala ucapan, perbuatan, dan taqrir (persetujuan) Rasulullah...\n\n## Tingkatan Hadis\n\nHadis dibagi menjadi beberapa tingkatan berdasarkan kualitasnya...`,
      image:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
      authorId: user1.id,
    },
  });

  // ── SCHEDULES ─────────────────────────────────────────────────────────────
  const schedule1 = await prisma.schedule.create({
    data: {
      title: "Seminar Akhlak Pemuda",
      description: "Membangun karakter islami generasi muda",
      fullDescription:
        "Generasi muda adalah pilar masa depan umat Islam. Seminar ini menghadirkan diskusi mendalam tentang pembangunan karakter Islami yang kuat di tengah tantangan zaman modern.",
      date: new Date("2026-02-15T09:00:00"),
      time: "09:00 WIB",
      location: "Aula Utama",
      pemateri: "Ustadz Ahmad Zaki",
      status: "segera_hadir",
      instructorId: user1.id,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500",
    },
  });

  await prisma.schedule.create({
    data: {
      title: "Workshop Tahfidz Al-Quran",
      description: "Meningkatkan kemampuan menghafal Al-Quran",
      fullDescription:
        "Tahfidz Al-Quran adalah pencapaian spiritual tertinggi. Program intensif ini dirancang untuk membantu peserta mengembangkan kemampuan menghafal Al-Quran.",
      date: new Date("2026-02-20T14:00:00"),
      time: "14:00 WIB",
      location: "Ruang Tahfidz",
      pemateri: "Ustadzah Fatimah",
      status: "segera_hadir",
      instructorId: user2.id,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=500",
    },
  });

  await prisma.schedule.create({
    data: {
      title: "Kajian Tafsir Surat Al-Baqarah",
      description: "Memahami makna mendalam surat Al-Baqarah",
      fullDescription:
        "Surat Al-Baqarah adalah surat terpanjang dalam Al-Quran yang penuh dengan hikmah dan petunjuk.",
      date: new Date("2026-03-01T16:00:00"),
      time: "16:00 WIB",
      location: "Musholla Al-Ikhlas",
      pemateri: "Ustadzah Fatimah",
      status: "segera_hadir",
      instructorId: user2.id,
    },
  });

  // ── PROGRAMS ──────────────────────────────────────────────────────────────
  const program1 = await prisma.program.create({
    data: {
      title: "Program Aqidah & Akhlak",
      description:
        "Program pembelajaran aqidah dan akhlak islami untuk santri, mencakup dasar-dasar keimanan dan pembentukan karakter Islami.",
      grade: material_grade.X,
      category: material_category.Wajib,
      instructorId: "101",
      duration: "12 Sesi / 3 Bulan",
      thumbnailUrl: "https://picsum.photos/seed/program1/400/300",
      syllabus: [
        "Pengenalan Aqidah Islam",
        "Rukun Iman dan Penjelasannya",
        "Akhlak Mulia dalam Kehidupan",
        "Adab Sehari-hari",
      ],
      requirements: ["Bisa membaca Al-Quran", "Komitmen hadir tiap sesi"],
      benefits: [
        "Memahami dasar-dasar aqidah Islam",
        "Meningkatkan kualitas akhlak",
        "Mendapat sertifikat kelulusan",
      ],
    },
  });

  const program2 = await prisma.program.create({
    data: {
      title: "Program Tafsir Al-Quran",
      description:
        "Program mendalam tentang tafsir dan ilmu Al-Quran untuk tingkat lanjut.",
      grade: material_grade.XII,
      category: material_category.NextLevel,
      instructorId: "102",
      duration: "16 Sesi / 4 Bulan",
      thumbnailUrl: "https://picsum.photos/seed/program2/400/300",
      syllabus: [
        "Ilmu Tajwid Lanjutan",
        "Tafsir Surat-surat Pendek",
        "Tafsir Surat Al-Baqarah",
        "Metode Penafsiran Al-Quran",
      ],
      requirements: [
        "Hafal minimal Juz 30",
        "Pengalaman mengaji minimal 2 tahun",
      ],
      benefits: [
        "Mampu membaca Al-Quran dengan tartil",
        "Memahami makna dan tafsir ayat",
        "Meningkatkan kecintaan terhadap Al-Quran",
      ],
    },
  });

  // ── MATERIALS ─────────────────────────────────────────────────────────────
  const materialsData = [
    {
      title: "Kedudukan Akal dan Wahyu",
      description: "Materi tentang adab dalam Islam",
      grade: "X",
      category: "Wajib",
      thumbnailUrl: "https://picsum.photos/seed/kajian1/400/300",
      instructorId: 101,
      date: "2024-11-25",
      startedAt: "15:00 - 17:00",
      participants: 45,
      programId: program1.id,
    },
    {
      title: "Fiqih Ibadah Sehari-hari",
      description: "Materi tentang fiqih ibadah",
      grade: "XI",
      category: "Wajib",
      thumbnailUrl: "https://picsum.photos/seed/kajian2/400/300",
      instructorId: 102,
      date: "2024-11-28",
      startedAt: "14:00 - 16:00",
      participants: 38,
      programId: program2.id,
    },
    {
      title: "Tafsir Al-Quran: Surah Al-Baqarah",
      description: "Materi tentang tafsir Al-Quran",
      grade: "XII",
      category: "Next Level",
      thumbnailUrl: "https://picsum.photos/seed/kajian3/400/300",
      instructorId: 103,
      date: "2024-12-01",
      startedAt: "15:00 - 17:00",
      participants: 52,
      programId: program2.id,
    },
    {
      title: "Sejarah Khulafaur Rasyidin",
      description: "Materi tentang sejarah Khulafaur Rasyidin",
      grade: "X",
      category: "Ekstra",
      thumbnailUrl: "https://picsum.photos/seed/kajian4/400/300",
      instructorId: 104,
      date: "2024-12-05",
      startedAt: "13:00 - 15:00",
      participants: 41,
      programId: null,
    },
    {
      title: "Rukun Iman dan Implementasinya",
      description: "Materi tentang rukun iman dan implementasinya",
      grade: "XI",
      category: "Ekstra",
      thumbnailUrl: "https://picsum.photos/seed/kajian5/400/300",
      instructorId: 105,
      date: "2024-12-08",
      startedAt: "14:00 - 16:00",
      participants: 47,
      programId: program1.id,
    },
    {
      title: "Akhlak kepada Orang Tua",
      description: "Materi tentang akhlak kepada orang tua",
      grade: "XII",
      category: "Next Level",
      thumbnailUrl: "https://picsum.photos/seed/kajian6/400/300",
      instructorId: 106,
      date: "2024-12-10",
      startedAt: "15:00 - 17:00",
      participants: 55,
      programId: null,
    },
  ];

  for (const mt of materialsData) {
    await prisma.material.create({
      data: {
        title: mt.title,
        description: mt.description,
        grade: mapGrade(mt.grade),
        category: mapCourseCategory(mt.category),
        thumbnailUrl: mt.thumbnailUrl,
        instructorId: mt.instructorId.toString(),
        date: new Date(mt.date),
        startedAt: mt.startedAt,
        participants: mt.participants.toString(),
        programId: mt.programId ?? null,
      },
    });
  }

  // ── PROGRAM ENROLLMENTS ───────────────────────────────────────────────────
  await prisma.program_enrollment.create({
    data: { programId: program1.id, userId: user3.id },
  });
  await prisma.program_enrollment.create({
    data: { programId: program1.id, userId: user1.id },
  });
  await prisma.program_enrollment.create({
    data: { programId: program2.id, userId: user4.id },
  });
  await prisma.program_enrollment.create({
    data: { programId: program2.id, userId: user2.id },
  });
  await prisma.program_enrollment.create({
    data: { programId: program1.id, userId: user6.id },
  });

  // ── FRIENDSHIPS ───────────────────────────────────────────────────────────
  const friendships: {
    followerId: string;
    followingId: string;
    status: FriendshipStatus;
  }[] = [
    // user1 ↔ user2: mutual
    { followerId: user1.id, followingId: user2.id, status: "accepted" },
    { followerId: user2.id, followingId: user1.id, status: "accepted" },
    // user1 ↔ user3: mutual
    { followerId: user1.id, followingId: user3.id, status: "accepted" },
    { followerId: user3.id, followingId: user1.id, status: "accepted" },
    // user2 → user3: pending
    { followerId: user2.id, followingId: user3.id, status: "pending" },
    // user1 → instructor 102: accepted
    { followerId: user1.id, followingId: "102", status: "accepted" },
    // user4 ↔ user1: mutual (top user)
    { followerId: user4.id, followingId: user1.id, status: "accepted" },
    { followerId: user1.id, followingId: user4.id, status: "accepted" },
    // user4 ↔ user2: mutual
    { followerId: user4.id, followingId: user2.id, status: "accepted" },
    { followerId: user2.id, followingId: user4.id, status: "accepted" },
    // user5 ↔ user3
    { followerId: user5.id, followingId: user3.id, status: "accepted" },
    { followerId: user3.id, followingId: user5.id, status: "accepted" },
    // user6 → user1 pending
    { followerId: user6.id, followingId: user1.id, status: "pending" },
    // user7 ↔ user3
    { followerId: user7.id, followingId: user3.id, status: "accepted" },
    { followerId: user3.id, followingId: user7.id, status: "accepted" },
    // user4 ↔ user5
    { followerId: user4.id, followingId: user5.id, status: "accepted" },
    { followerId: user5.id, followingId: user4.id, status: "accepted" },
  ];

  for (const f of friendships) {
    await prisma.friendship.create({ data: f });
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "basic",
      status: "unread",
      title: "Selamat Datang di IRMA Verse!",
      message:
        "Assalamualaikum! Selamat bergabung di platform IRMA Verse. Jelajahi fitur-fitur yang tersedia.",
      icon: "megaphone",
      actionUrl: "/overview",
    },
  });

  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "basic",
      status: "unread",
      title: "Jadwal Baru: Seminar Akhlak Pemuda",
      message:
        "Jadwal baru telah ditambahkan oleh Ustadz Ahmad Zaki. Seminar Akhlak Pemuda akan dilaksanakan pada 15 Feb 2026.",
      icon: "calendar",
      resourceType: "schedule",
      resourceId: schedule1.id,
      actionUrl: `/schedule/${schedule1.id}`,
      senderId: user1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "basic",
      status: "read",
      title: "Berita Baru: Kedudukan Akal dan Wahyu",
      message:
        "Artikel terbaru telah diterbitkan. Baca selengkapnya tentang hubungan akal dan wahyu.",
      icon: "bell",
      resourceType: "news",
      resourceId: news1.id,
      actionUrl: `/news/${news1.slug}`,
      senderId: user1.id,
    },
  });

  // Material invites
  const inviteToken1 =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  await prisma.materialinvite.create({
    data: {
      materialId: (await prisma.material.findFirst({
        where: { instructorId: "101" },
      }))!.id,
      instructorId: "101",
      userId: user3.id,
      token: inviteToken1,
      status: "pending",
    },
  });

  const material101 = await prisma.material.findFirst({
    where: { instructorId: "101" },
  });
  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "invitation",
      status: "unread",
      title: material101?.title || "Undangan Kajian",
      message: `Ustadz Ahmad Zaki mengundang Anda untuk bergabung ke kajian "${material101?.title || "Materi"}"`,
      icon: "book",
      resourceType: "material",
      resourceId: material101?.id,
      actionUrl: `/materials/${material101?.id}`,
      inviteToken: inviteToken1,
      senderId: "101",
    },
  });

  const inviteToken2 =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  const material102 = await prisma.material.findFirst({
    where: { instructorId: "102" },
  });
  await prisma.materialinvite.create({
    data: {
      materialId: material102!.id,
      instructorId: "102",
      userId: user3.id,
      token: inviteToken2,
      status: "pending",
    },
  });
  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "invitation",
      status: "unread",
      title: material102?.title || "Undangan Kajian",
      message: `Ustadzah Fatimah mengundang Anda untuk bergabung ke kajian "${material102?.title || "Materi"}"`,
      icon: "book",
      resourceType: "material",
      resourceId: material102?.id,
      actionUrl: `/materials/${material102?.id}`,
      inviteToken: inviteToken2,
      senderId: "102",
    },
  });

  // ── BADGES ────────────────────────────────────────────────────────────────
  console.log("🏅 Creating badges...");
  const badgesData: {
    code: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    requirement: string;
    xpReward: number;
  }[] = [
    {
      code: "first_quiz",
      name: "Quiz Pertama",
      description: "Menyelesaikan quiz pertamamu",
      icon: "🎯",
      category: "learning",
      requirement: "Selesaikan 1 quiz",
      xpReward: 50,
    },
    {
      code: "quiz_master",
      name: "Master Quiz",
      description: "Menyelesaikan 10 quiz",
      icon: "🧠",
      category: "learning",
      requirement: "Selesaikan 10 quiz",
      xpReward: 200,
    },
    {
      code: "quiz_legend",
      name: "Legenda Quiz",
      description: "Menyelesaikan 50 quiz",
      icon: "👑",
      category: "learning",
      requirement: "Selesaikan 50 quiz",
      xpReward: 500,
    },
    {
      code: "streak_3",
      name: "Konsisten 3 Hari",
      description: "Login 3 hari berturut-turut",
      icon: "🔥",
      category: "streak",
      requirement: "Streak 3 hari",
      xpReward: 75,
    },
    {
      code: "streak_7",
      name: "Semangat Mingguan",
      description: "Login 7 hari berturut-turut",
      icon: "⚡",
      category: "streak",
      requirement: "Streak 7 hari",
      xpReward: 150,
    },
    {
      code: "streak_30",
      name: "Istiqomah",
      description: "Login 30 hari berturut-turut",
      icon: "💎",
      category: "streak",
      requirement: "Streak 30 hari",
      xpReward: 500,
    },
    {
      code: "first_friend",
      name: "Teman Pertama",
      description: "Menambahkan teman pertamamu",
      icon: "🤝",
      category: "social",
      requirement: "Tambahkan 1 teman",
      xpReward: 30,
    },
    {
      code: "social_butterfly",
      name: "Kupu-Kupu Sosial",
      description: "Memiliki 10 teman",
      icon: "🦋",
      category: "social",
      requirement: "Miliki 10 teman",
      xpReward: 200,
    },
    {
      code: "community_pillar",
      name: "Pilar Komunitas",
      description: "Memiliki 50 teman",
      icon: "🏛️",
      category: "social",
      requirement: "Miliki 50 teman",
      xpReward: 500,
    },
    {
      code: "level_5",
      name: "Naik Kelas",
      description: "Mencapai Level 5",
      icon: "⭐",
      category: "achievement",
      requirement: "Capai Level 5",
      xpReward: 100,
    },
    {
      code: "level_10",
      name: "Pelajar Handal",
      description: "Mencapai Level 10",
      icon: "🌟",
      category: "achievement",
      requirement: "Capai Level 10",
      xpReward: 250,
    },
    {
      code: "level_20",
      name: "Ulama Digital",
      description: "Mencapai Level 20",
      icon: "✨",
      category: "achievement",
      requirement: "Capai Level 20",
      xpReward: 500,
    },
    {
      code: "active_learner",
      name: "Pelajar Aktif",
      description: "Mengikuti 5 program",
      icon: "📚",
      category: "learning",
      requirement: "Ikuti 5 program",
      xpReward: 150,
    },
    {
      code: "forum_contributor",
      name: "Kontributor Forum",
      description: "Membuat 10 post di forum",
      icon: "💬",
      category: "social",
      requirement: "Buat 10 post forum",
      xpReward: 100,
    },
    {
      code: "points_1000",
      name: "Seribu Poin",
      description: "Mengumpulkan 1000 poin XP",
      icon: "🎖️",
      category: "achievement",
      requirement: "Kumpulkan 1000 XP",
      xpReward: 100,
    },
    {
      code: "points_5000",
      name: "Lima Ribu Poin",
      description: "Mengumpulkan 5000 poin XP",
      icon: "🏆",
      category: "achievement",
      requirement: "Kumpulkan 5000 XP",
      xpReward: 300,
    },
  ];

  const badges: Record<string, string> = {};
  for (const b of badgesData) {
    const created = await prisma.badge.create({ data: b });
    badges[b.code] = created.id;
  }

  // ── ACTIVITY LOGS ─────────────────────────────────────────────────────────
  console.log("📝 Creating activity logs...");

  type ActivitySeed = {
    type: ActivityType;
    title: string;
    description: string;
    xpEarned: number;
    daysAgo: number;
    hoursOffset?: number;
  };

  function buildActivities(userId: string, activities: ActivitySeed[]) {
    return activities.map((a) => {
      const d = new Date(now);
      d.setDate(d.getDate() - a.daysAgo);
      d.setHours(
        d.getHours() - (a.hoursOffset ?? Math.floor(Math.random() * 12)),
      );
      return { userId, ...a, createdAt: d };
    });
  }

  // ── user1 (1250 XP, Lv7, 14 streak) ──────────────────────────────────
  const user1Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Rukun Iman",
      description: "Skor 85/100",
      xpEarned: 75,
      daysAgo: 0,
    },
    {
      type: "streak_maintained",
      title: "Streak 14 Hari!",
      description: "Login 14 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 0,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Fiqih Shalat",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 0,
      hoursOffset: 3,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Fiqih Shalat",
      description: "Skor 90/100",
      xpEarned: 75,
      daysAgo: 1,
    },
    {
      type: "program_enrolled",
      title: "Mendaftar Program Aqidah & Akhlak",
      description: "Bergabung di program aqidah",
      xpEarned: 40,
      daysAgo: 1,
      hoursOffset: 5,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Ali Hakim",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 2,
    },
    {
      type: "badge_earned",
      title: "Badge: Seribu Poin",
      description: "Mengumpulkan 1000 XP!",
      xpEarned: 100,
      daysAgo: 2,
      hoursOffset: 1,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Akidah Dasar",
      description: "Skor 88/100",
      xpEarned: 75,
      daysAgo: 3,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Kedudukan Akal dan Wahyu",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 3,
    },
    {
      type: "level_up",
      title: "Naik ke Level 7!",
      description: "Selamat! Kamu sekarang Pencari Ilmu",
      xpEarned: 0,
      daysAgo: 3,
      hoursOffset: 0,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Adab Belajar",
      description: "Skor 82/100",
      xpEarned: 50,
      daysAgo: 4,
    },
    {
      type: "attendance_marked",
      title: "Hadir: Kajian Mingguan",
      description: "Absensi kehadiran",
      xpEarned: 25,
      daysAgo: 5,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Ustadzah Fatimah",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 5,
      hoursOffset: 4,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Sejarah Khulafaur",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 6,
    },
    {
      type: "badge_earned",
      title: "Badge: Quiz Pertama",
      description: "Mendapatkan badge Quiz Pertama!",
      xpEarned: 50,
      daysAgo: 8,
    },
    {
      type: "badge_earned",
      title: "Badge: Teman Pertama",
      description: "Mendapatkan badge Teman Pertama!",
      xpEarned: 30,
      daysAgo: 9,
    },
    {
      type: "badge_earned",
      title: "Badge: Streak 3 Hari",
      description: "Konsisten 3 hari!",
      xpEarned: 75,
      daysAgo: 10,
    },
    {
      type: "badge_earned",
      title: "Badge: Streak 7 Hari",
      description: "Semangat mingguan!",
      xpEarned: 150,
      daysAgo: 7,
    },
    {
      type: "badge_earned",
      title: "Badge: Naik Kelas",
      description: "Mencapai Level 5!",
      xpEarned: 100,
      daysAgo: 6,
      hoursOffset: 2,
    },
  ];

  // ── user2 (2100 XP, Lv10, 21 streak, instruktur) ─────────────────────
  const user2Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Tajwid Lanjutan",
      description: "Skor 95/100",
      xpEarned: 75,
      daysAgo: 0,
    },
    {
      type: "streak_maintained",
      title: "Streak 21 Hari!",
      description: "Login 21 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 0,
      hoursOffset: 2,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Tafsir Al-Baqarah",
      description: "Skor 92/100",
      xpEarned: 75,
      daysAgo: 1,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Hukum Tajwid",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 1,
      hoursOffset: 4,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Fiqih Muamalah",
      description: "Skor 88/100",
      xpEarned: 75,
      daysAgo: 2,
    },
    {
      type: "badge_earned",
      title: "Badge: Master Quiz",
      description: "Menyelesaikan 10 quiz!",
      xpEarned: 200,
      daysAgo: 2,
      hoursOffset: 1,
    },
    {
      type: "badge_earned",
      title: "Badge: Pelajar Handal",
      description: "Mencapai Level 10!",
      xpEarned: 250,
      daysAgo: 2,
      hoursOffset: 0,
    },
    {
      type: "level_up",
      title: "Naik ke Level 10!",
      description: "Selamat! Kamu sekarang Pencari Ilmu",
      xpEarned: 0,
      daysAgo: 2,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Rafa Ardanza",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 3,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Ushul Fiqih",
      description: "Skor 91/100",
      xpEarned: 75,
      daysAgo: 4,
    },
    {
      type: "attendance_marked",
      title: "Hadir: Halaqah Tahsin",
      description: "Absensi kehadiran",
      xpEarned: 25,
      daysAgo: 5,
    },
    {
      type: "program_enrolled",
      title: "Mendaftar Program Tafsir Al-Quran",
      description: "Bergabung di program tafsir",
      xpEarned: 40,
      daysAgo: 6,
    },
    {
      type: "badge_earned",
      title: "Badge: Streak 7 Hari",
      description: "Semangat mingguan!",
      xpEarned: 150,
      daysAgo: 8,
    },
    {
      type: "badge_earned",
      title: "Badge: Streak 3 Hari",
      description: "Konsisten 3 hari!",
      xpEarned: 75,
      daysAgo: 12,
    },
    {
      type: "badge_earned",
      title: "Badge: Quiz Pertama",
      description: "Mendapatkan badge Quiz Pertama!",
      xpEarned: 50,
      daysAgo: 15,
    },
    {
      type: "badge_earned",
      title: "Badge: Teman Pertama",
      description: "Mendapatkan badge Teman Pertama!",
      xpEarned: 30,
      daysAgo: 14,
    },
    {
      type: "badge_earned",
      title: "Badge: Naik Kelas",
      description: "Mencapai Level 5!",
      xpEarned: 100,
      daysAgo: 10,
    },
    {
      type: "badge_earned",
      title: "Badge: Seribu Poin",
      description: "Mengumpulkan 1000 XP!",
      xpEarned: 100,
      daysAgo: 5,
    },
  ];

  // ── user3 (480 XP, Lv4, 7 streak) ────────────────────────────────────
  const user3Activities: ActivitySeed[] = [
    {
      type: "program_enrolled",
      title: "Mendaftar Program Aqidah & Akhlak",
      description: "Bergabung di program aqidah",
      xpEarned: 40,
      daysAgo: 0,
    },
    {
      type: "streak_maintained",
      title: "Streak 7 Hari!",
      description: "Login 7 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 0,
      hoursOffset: 3,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Adab Belajar",
      description: "Skor 78/100",
      xpEarned: 50,
      daysAgo: 1,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Fiqih Ibadah",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 1,
      hoursOffset: 5,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Akhlak Mulia",
      description: "Skor 80/100",
      xpEarned: 75,
      daysAgo: 2,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Ustadz Ahmad Zaki",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 2,
      hoursOffset: 6,
    },
    {
      type: "level_up",
      title: "Naik ke Level 4!",
      description: "Selamat! Kamu sekarang Pelajar",
      xpEarned: 0,
      daysAgo: 2,
      hoursOffset: 0,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Rukun Iman",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 3,
    },
    {
      type: "badge_earned",
      title: "Badge: Teman Pertama",
      description: "Menambahkan teman pertama!",
      xpEarned: 30,
      daysAgo: 4,
    },
    {
      type: "badge_earned",
      title: "Badge: Quiz Pertama",
      description: "Menyelesaikan quiz pertama!",
      xpEarned: 50,
      daysAgo: 5,
    },
    {
      type: "badge_earned",
      title: "Badge: Streak 3 Hari",
      description: "Konsisten 3 hari!",
      xpEarned: 75,
      daysAgo: 4,
    },
    {
      type: "attendance_marked",
      title: "Hadir: Kajian Mingguan",
      description: "Absensi kehadiran",
      xpEarned: 25,
      daysAgo: 6,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Zahra Putri",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 7,
    },
  ];

  // ── user4 (3500 XP, Lv14, 30 streak — top user) ──────────────────────
  const user4Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Ilmu Hadits",
      description: "Skor 98/100",
      xpEarned: 75,
      daysAgo: 0,
    },
    {
      type: "streak_maintained",
      title: "Streak 30 Hari!",
      description: "Login 30 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 0,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Mustalah Hadits",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 0,
      hoursOffset: 4,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Ushul Fiqih Lanjut",
      description: "Skor 96/100",
      xpEarned: 75,
      daysAgo: 1,
    },
    {
      type: "badge_earned",
      title: "Badge: Istiqomah",
      description: "Streak 30 hari!",
      xpEarned: 500,
      daysAgo: 0,
      hoursOffset: 1,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Tafsir Surat Yasin",
      description: "Skor 94/100",
      xpEarned: 75,
      daysAgo: 2,
    },
    {
      type: "level_up",
      title: "Naik ke Level 14!",
      description: "Selamat! Kamu sekarang Penuntut Ilmu",
      xpEarned: 0,
      daysAgo: 1,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Siti Aisyah",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 3,
    },
    {
      type: "program_enrolled",
      title: "Mendaftar Program Tafsir Al-Quran",
      description: "Bergabung di program tafsir",
      xpEarned: 40,
      daysAgo: 5,
    },
    {
      type: "attendance_marked",
      title: "Hadir: Halaqah Tahfidz",
      description: "Absensi kehadiran",
      xpEarned: 25,
      daysAgo: 4,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Qawaid Fiqhiyyah",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 3,
      hoursOffset: 5,
    },
  ];

  // ── user5 (1800 XP, Lv9) ─────────────────────────────────────────────
  const user5Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Fiqih Wanita",
      description: "Skor 90/100",
      xpEarned: 75,
      daysAgo: 0,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Hukum Hijab",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 1,
    },
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Adab Berpakaian",
      description: "Skor 87/100",
      xpEarned: 75,
      daysAgo: 2,
    },
    {
      type: "streak_maintained",
      title: "Streak 10 Hari!",
      description: "Login 10 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 0,
      hoursOffset: 2,
    },
    {
      type: "badge_earned",
      title: "Badge: Streak 7 Hari",
      description: "Semangat mingguan!",
      xpEarned: 150,
      daysAgo: 3,
    },
    {
      type: "program_enrolled",
      title: "Mendaftar Program Fiqih Kontemporer",
      description: "Bergabung di program fiqih",
      xpEarned: 40,
      daysAgo: 4,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Rafa Ardanza",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 5,
    },
    {
      type: "attendance_marked",
      title: "Hadir: Kajian Muslimah",
      description: "Absensi kehadiran",
      xpEarned: 25,
      daysAgo: 6,
    },
  ];

  // ── user6 (750 XP, Lv5) ──────────────────────────────────────────────
  const user6Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Siroh Nabawiyyah",
      description: "Skor 83/100",
      xpEarned: 75,
      daysAgo: 0,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Aqidah Ahlus Sunnah",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 1,
    },
    {
      type: "program_enrolled",
      title: "Mendaftar Program Aqidah & Akhlak",
      description: "Bergabung di program",
      xpEarned: 40,
      daysAgo: 2,
    },
    {
      type: "badge_earned",
      title: "Badge: Naik Kelas",
      description: "Mencapai Level 5!",
      xpEarned: 100,
      daysAgo: 1,
    },
    {
      type: "streak_maintained",
      title: "Streak 5 Hari!",
      description: "Login 5 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 0,
      hoursOffset: 3,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Ustadz Ahmad Zaki",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 4,
    },
    {
      type: "level_up",
      title: "Naik ke Level 5!",
      description: "Selamat! Kamu sekarang Pelajar",
      xpEarned: 0,
      daysAgo: 1,
    },
  ];

  // ── user7 (320 XP, Lv3) ──────────────────────────────────────────────
  const user7Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Pengantar Aqidah",
      description: "Skor 75/100",
      xpEarned: 50,
      daysAgo: 0,
    },
    {
      type: "material_read",
      title: "Membaca Materi: Adab Penuntut Ilmu",
      description: "Menyelesaikan bacaan",
      xpEarned: 20,
      daysAgo: 1,
    },
    {
      type: "friend_added",
      title: "Berteman dengan Rafa Ardanza",
      description: "Menambahkan teman baru",
      xpEarned: 15,
      daysAgo: 2,
    },
    {
      type: "badge_earned",
      title: "Badge: Quiz Pertama",
      description: "Menyelesaikan quiz pertama!",
      xpEarned: 50,
      daysAgo: 3,
    },
    {
      type: "badge_earned",
      title: "Badge: Teman Pertama",
      description: "Menambahkan teman pertama!",
      xpEarned: 30,
      daysAgo: 3,
    },
    {
      type: "streak_maintained",
      title: "Streak 3 Hari!",
      description: "Login 3 hari berturut-turut",
      xpEarned: 35,
      daysAgo: 1,
    },
  ];

  // ── user8 (90 XP, Lv1 — newbie) ──────────────────────────────────────
  const user8Activities: ActivitySeed[] = [
    {
      type: "quiz_completed",
      title: "Menyelesaikan Quiz: Pengenalan Islam",
      description: "Skor 65/100",
      xpEarned: 50,
      daysAgo: 0,
    },
    {
      type: "program_enrolled",
      title: "Mendaftar Program Aqidah & Akhlak",
      description: "Bergabung di program",
      xpEarned: 40,
      daysAgo: 1,
    },
  ];

  // Write all activity logs
  const allActivities = [
    ...buildActivities(user1.id, user1Activities),
    ...buildActivities(user2.id, user2Activities),
    ...buildActivities(user3.id, user3Activities),
    ...buildActivities(user4.id, user4Activities),
    ...buildActivities(user5.id, user5Activities),
    ...buildActivities(user6.id, user6Activities),
    ...buildActivities(user7.id, user7Activities),
    ...buildActivities(user8.id, user8Activities),
  ];

  for (const a of allActivities) {
    await prisma.activityLog.create({
      data: {
        userId: a.userId,
        type: a.type,
        title: a.title,
        description: a.description,
        xpEarned: a.xpEarned,
        createdAt: a.createdAt,
      },
    });
  }

  // ── USER BADGES ───────────────────────────────────────────────────────────
  console.log("🎖️ Assigning badges to users...");

  type BadgeAssignment = { userId: string; code: string; daysAgo: number };

  const badgeAssignments: BadgeAssignment[] = [
    // user1: 6 badges
    { userId: user1.id, code: "first_quiz", daysAgo: 10 },
    { userId: user1.id, code: "first_friend", daysAgo: 9 },
    { userId: user1.id, code: "streak_3", daysAgo: 10 },
    { userId: user1.id, code: "streak_7", daysAgo: 7 },
    { userId: user1.id, code: "level_5", daysAgo: 6 },
    { userId: user1.id, code: "points_1000", daysAgo: 2 },

    // user2: 8 badges (instruktur, top)
    { userId: user2.id, code: "first_quiz", daysAgo: 15 },
    { userId: user2.id, code: "first_friend", daysAgo: 14 },
    { userId: user2.id, code: "quiz_master", daysAgo: 2 },
    { userId: user2.id, code: "streak_3", daysAgo: 12 },
    { userId: user2.id, code: "streak_7", daysAgo: 8 },
    { userId: user2.id, code: "level_5", daysAgo: 10 },
    { userId: user2.id, code: "level_10", daysAgo: 2 },
    { userId: user2.id, code: "points_1000", daysAgo: 5 },

    // user3: 3 badges
    { userId: user3.id, code: "first_quiz", daysAgo: 5 },
    { userId: user3.id, code: "first_friend", daysAgo: 4 },
    { userId: user3.id, code: "streak_3", daysAgo: 4 },

    // user4: 10 badges (top player!)
    { userId: user4.id, code: "first_quiz", daysAgo: 30 },
    { userId: user4.id, code: "first_friend", daysAgo: 28 },
    { userId: user4.id, code: "quiz_master", daysAgo: 10 },
    { userId: user4.id, code: "streak_3", daysAgo: 27 },
    { userId: user4.id, code: "streak_7", daysAgo: 23 },
    { userId: user4.id, code: "streak_30", daysAgo: 0 },
    { userId: user4.id, code: "level_5", daysAgo: 18 },
    { userId: user4.id, code: "level_10", daysAgo: 8 },
    { userId: user4.id, code: "points_1000", daysAgo: 12 },
    { userId: user4.id, code: "points_5000", daysAgo: 1 },

    // user5: 7 badges
    { userId: user5.id, code: "first_quiz", daysAgo: 20 },
    { userId: user5.id, code: "first_friend", daysAgo: 18 },
    { userId: user5.id, code: "streak_3", daysAgo: 16 },
    { userId: user5.id, code: "streak_7", daysAgo: 3 },
    { userId: user5.id, code: "level_5", daysAgo: 12 },
    { userId: user5.id, code: "points_1000", daysAgo: 6 },
    { userId: user5.id, code: "quiz_master", daysAgo: 4 },

    // user6: 4 badges
    { userId: user6.id, code: "first_quiz", daysAgo: 8 },
    { userId: user6.id, code: "first_friend", daysAgo: 7 },
    { userId: user6.id, code: "streak_3", daysAgo: 5 },
    { userId: user6.id, code: "level_5", daysAgo: 1 },

    // user7: 2 badges
    { userId: user7.id, code: "first_quiz", daysAgo: 3 },
    { userId: user7.id, code: "first_friend", daysAgo: 3 },

    // user8: 0 badges (newbie)
  ];

  for (const ba of badgeAssignments) {
    await prisma.userBadge.create({
      data: {
        userId: ba.userId,
        badgeId: badges[ba.code],
        earnedAt: new Date(now.getTime() - ba.daysAgo * 86400000),
      },
    });
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const totalActivities = allActivities.length;
  const totalBadgeAssignments = badgeAssignments.length;

  console.log("✅ Data seeding completed!");
  console.log("📊 Summary:");
  console.log(`   - Users: 8 main + 6 instructors = 14 total`);
  console.log(`   - News: 5`);
  console.log(`   - Schedules: 3`);
  console.log(`   - Programs: 2`);
  console.log(`   - Materials: ${materialsData.length}`);
  console.log(`   - Program Enrollments: 5`);
  console.log(`   - Friendships: ${friendships.length}`);
  console.log(`   - Notifications: 5 (3 basic + 2 invitations)`);
  console.log(`   - Badges: ${badgesData.length} definitions`);
  console.log(`   - Activity Logs: ${totalActivities} entries`);
  console.log(`   - User Badges: ${totalBadgeAssignments} assigned`);
  console.log("");
  console.log("🏅 Gamification test data:");
  console.log(`   - user1 (Ahmad):   Lv7,  1250 XP, 6 badges,  14-day streak`);
  console.log(
    `   - user2 (Fatimah): Lv10, 2100 XP, 8 badges,  21-day streak [instruktur]`,
  );
  console.log(`   - user3 (Rafa):    Lv4,  480 XP,  3 badges,  7-day streak`);
  console.log(
    `   - user4 (Ali):     Lv14, 3500 XP, 10 badges, 30-day streak [TOP]`,
  );
  console.log(
    `   - user5 (Aisyah):  Lv9,  1800 XP, 7 badges,  10-day streak [instruktur]`,
  );
  console.log(`   - user6 (Hasan):   Lv5,  750 XP,  4 badges,  5-day streak`);
  console.log(`   - user7 (Zahra):   Lv3,  320 XP,  2 badges,  3-day streak`);
  console.log(
    `   - user8 (Umar):    Lv1,  90 XP,   0 badges,  1-day streak [NEWBIE]`,
  );
  console.log("");
  console.log("👥 Friendship graph:");
  console.log(`   - user1 ↔ user2, user3, user4: mutual`);
  console.log(`   - user2 → user3: pending`);
  console.log(`   - user4 ↔ user2, user5: mutual`);
  console.log(`   - user5 ↔ user3: mutual`);
  console.log(`   - user7 ↔ user3: mutual`);
  console.log(`   - user6 → user1: pending`);
  console.log("");
  console.log("🔐 Login credentials: password123 (same for all users)");
}

function mapGrade(value: string): material_grade {
  switch (value) {
    case "X":
      return material_grade.X;
    case "XI":
      return material_grade.XI;
    case "XII":
      return material_grade.XII;
    default:
      throw new Error(`Invalid grade: ${value}`);
  }
}

function mapCourseCategory(value: string): material_category {
  switch (value) {
    case "Wajib":
      return material_category.Wajib;
    case "Ekstra":
      return material_category.Extra;
    case "Next Level":
      return material_category.NextLevel;
    case "Susulan":
      return material_category.Susulan;
    default:
      throw new Error(`Invalid course category: ${value}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
