import {
  PrismaClient,
  MaterialGrade,
  MaterialCategory,
  NotificationType,
  NotificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding data...");
  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();

  await prisma.notification.deleteMany();
  await prisma.materialInvite.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.programEnrollment.deleteMany();

  await prisma.material.deleteMany();
  await prisma.program.deleteMany();
  await prisma.news.deleteMany();
  await prisma.schedule.deleteMany();

  await prisma.materialQuiz.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.quizAttempt.deleteMany();

  await prisma.user.deleteMany();

  console.log("🧹 Database cleared");

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 10);

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
    },
  });

  // Create news articles
  const news1 = await prisma.news.create({
    data: {
      title: "Kedudukan Akal dan Wahyu",
      slug: "kedudukan-akal-dan-wahyu",
      category: "Kajian",
      deskripsi:
        "Memahami hubungan dan kedudukan akal dalam konteks wahyu ilahi",
      content: `# Kedudukan Akal dan Wahyu

Dalam khazanah pemikiran Islam, relasi antara akal dan wahyu telah menjadi topik diskusi yang mendalam dan berkelanjutan.

## Pengertian Akal dalam Islam

Akal merupakan nikmat yang diberikan Allah kepada manusia...

## Kedudukan Wahyu

Wahyu adalah petunjuk langsung dari Allah kepada hamba-Nya...

## Hubungan Akal dan Wahyu

Akal dan wahyu bukan dua hal yang saling bertentangan...`,
      image:
        "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500",
      authorId: user1.id,
    },
  });

  const news2 = await prisma.news.create({
    data: {
      title: "Fiqih Ibadah Sehari-hari",
      slug: "fiqih-ibadah-sehari-hari",
      category: "Pembelajaran",
      deskripsi:
        "Panduan praktis menjalankan ibadah dalam kehidupan sehari-hari",
      content: `# Fiqih Ibadah Sehari-hari

Ibadah bukan hanya dilakukan di masjid, tetapi adalah bagian dari kehidupan sehari-hari seorang Muslim.

## Wudhu yang Sempurna

Wudhu adalah niat untuk membersihkan diri...

## Shalat Dengan Khusyu'

Khusyu' adalah hadirnya hati dalam shalat...`,
      image:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500",
      authorId: user2.id,
    },
  });

  const news3 = await prisma.news.create({
    data: {
      title: "Tafsir Al-Quran Surat Al-Fatihah",
      slug: "tafsir-al-quran-surat-al-fatihah",
      category: "Tafsir",
      deskripsi: "Penjelasan mendalam tentang surat pertama dalam Al-Quran",
      content: `# Tafsir Al-Quran Surat Al-Fatihah

Surat Al-Fatihah adalah surat pembuka Al-Quran yang penuh dengan makna dan hikmah.

## Bismillah

Membaca dengan nama Allah adalah cara memulai segala aktivitas...

## Alhamdulillah

Segala puji bagi Allah, Tuhan sekalian alam...`,
      image:
        "https://images.unsplash.com/photo-1488173174519-e21cc028cb29?w=500",
      authorId: user2.id,
    },
  });

  const news4 = await prisma.news.create({
    data: {
      title: "Akhlak Mulia dalam Berinteraksi",
      slug: "akhlak-mulia-dalam-berinteraksi",
      category: "Akhlak",
      deskripsi:
        "Mempelajari etika Islam dalam menjalin hubungan dengan sesama",
      content: `# Akhlak Mulia dalam Berinteraksi

Islam mengajarkan akhlak yang luhur dalam setiap aspek interaksi sosial.

## Salam dan Sapa

Memberikan salam adalah bentuk kasih sayang...

## Silaturahmi

Menjaga hubungan baik dengan keluarga dan teman...`,
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500",
      authorId: user1.id,
    },
  });

  const news5 = await prisma.news.create({
    data: {
      title: "Memahami Hadis Nabawi",
      slug: "memahami-hadis-nabawi",
      category: "Pembelajaran",
      deskripsi:
        "Pengenalan tentang hadis dan cara memahami petunjuk Rasulullah",
      content: `# Memahami Hadis Nabawi

Hadis adalah warisan berharga dari Rasulullah Muhammad SAW...

## Definisi Hadis

Hadis adalah segala ucapan, perbuatan, dan taqrir (persetujuan) Rasulullah...

## Tingkatan Hadis

Hadis dibagi menjadi beberapa tingkatan berdasarkan kualitasnya...`,
      image:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
      authorId: user1.id,
    },
  });

  // Create schedules
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

  const schedule2 = await prisma.schedule.create({
    data: {
      title: "Workshop Tahfidz Al-Quran",
      description: "Meningkatkan kemampuan menghafal Al-Quran",
      fullDescription:
        "Tahfidz Al-Quran adalah pencapaian spiritual tertinggi yang dapat diraih seorang Muslim. Program intensif ini dirancang untuk membantu peserta mengembangkan kemampuan menghafal Al-Quran dengan metode yang telah terbukti efektif.",
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

  const schedule3 = await prisma.schedule.create({
    data: {
      title: "Kajian Tafsir Surat Al-Baqarah",
      description: "Memahami makna mendalam surat Al-Baqarah",
      fullDescription:
        "Surat Al-Baqarah adalah surat terpanjang dalam Al-Quran yang penuh dengan hikmah dan petunjuk. Kajian ini akan membahas ayat demi ayat dengan pendekatan komprehensif.",
      date: new Date("2026-03-01T16:00:00"),
      time: "16:00 WIB",
      location: "Musholla Al-Ikhlas",
      pemateri: "Ustadzah Fatimah",
      status: "segera_hadir",
      instructorId: user2.id,
    },
  });

  // Create materials & instructors
  const instructors = [
    { id: "1", conID: "inst-ahmad", name: "Ustadz Ahmad Zaki" },
    { id: "2", conID: "inst-fatimah", name: "Ustadzah Fatimah" },
    { id: "3", conID: "inst-rizki", name: "Ustadz Muhammad Rizki" },
    { id: "4", conID: "inst-abdullah", name: "Ustadz Abdullah" },
    { id: "5", conID: "inst-ali", name: "Ustadz Ali Hasan" },
    { id: "6", conID: "inst-khadijah", name: "Ustadzah Khadijah" },
  ];

  for (const inst of instructors) {
    await prisma.user.create({
      data: {
        id: (parseInt(inst.id) + 100).toString(),
        name: inst.name,
        email: `${inst.conID}@irma.com`,
        password: hashedPassword,
        role: "instruktur",
      },
    });
  }

  // ── PROGRAMS ──────────────────────────────────────────────────────────────────
  const program1 = await prisma.program.create({
    data: {
      title: "Program Aqidah & Akhlak",
      description:
        "Program pembelajaran aqidah dan akhlak islami untuk santri, mencakup dasar-dasar keimanan dan pembentukan karakter Islami.",
      grade: MaterialGrade.X,
      category: MaterialCategory.Wajib,
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
        "Program mendalam tentang tafsir dan ilmu Al-Quran, dirancang untuk santri tingkat lanjut yang ingin memahami makna Al-Quran secara komprehensif.",
      grade: MaterialGrade.XII,
      category: MaterialCategory.NextLevel,
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

  // ── MATERIALS ─────────────────────────────────────────────────────────────────
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
  };

  //Create Quizzes (from last Mock up)
  const quizdata = [
    {
      id: "q1",
      title: "Pemahaman Dasar Fiqih",
      description: "Kajian Fiqih Bab Thaharah",
    },
    {
      id: "q2",
      title: "Kisah Nabi & Sahabat",
      description: "Sirah Nabawiyah: Perang Badar",
    },
    {
      id: "q3",
      title: "Adab Menuntut Ilmu",
      description: "Kajian Rutin: Kitab Ta'lim Muta'allim",
      score: 90,
    },
    {
      id: "q4",
      title: "Tajwid Dasar",
      description: "Tahsin Al-Quran Pertemuan 1",
    }
  ];

  const quizquestion =[
    { id: "q1_1", quizId: "q1", question: "Berapakah jumlah air minimal agar termasuk kategori air dua qullah menurut jumhur ulama?" },
    { id: "q1_2", quizId: "q1", question: "Debu yang digunakan untuk tayamum haruslah debu yang suci dan tidak musta'mal." },
    { id: "q1_3", quizId: "q1", question: "Apa hukum dasar menuntut ilmu agama bagi setiap muslim?"},
    { id: "q1_4", quizId: "q1", question: "Syarat sahnya wudhu antara lain adalah, kecuali..."},
    { id: "q1_5", quizId: "q1", question: "Air yang suci namun tidak bisa mensucikan (seperti air teh, kopi) disebut air..."},
    { id: "q1_6", quizId: "q1", question: "Apa yang harus dilakukan jika seseorang lupa jumlah rakaat saat shalat?"},
    { id: "q2_1", quizId: "q2", question: "Siapakah sahabat yang mengusulkan strategi untuk menguasai sumber air di lembah Badar?" },
    { id: "q2_2", quizId: "q2", question: "Berapakah perkiraan jumlah pasukan muslimin pada saat Perang Badar terjadi?" },
    { id: "q3_1", quizId: "q3", question: "Menurut kitab Ta'lim Muta'allim, niat utama dalam menuntut ilmu adalah untuk mencari ridha Allah dan menghilangkan kebodohan." },
    { id: "q3_2", quizId: "q3", question: "Manakah yang termasuk adab terhadap guru berdasarkan kajian Ta'lim Muta'allim?" },
    { id: "q4_1", quizId: "q4", question: "Hukum bacaan apabila Nun Sukun atau Tanwin bertemu dengan huruf 'Alif/Hamzah' disebut?" },
    { id: "q4_2", quizId: "q4", question: "Huruf-huruf Qalqalah terkumpul dalam kalimat 'Quthbu Jadin' (ق ط ب ج د)." }
  ];
  const quizoption = [
    { questionId: "q1_1", order: 1, option: "Sekitar 216 liter",                     isCorrect: true },
    { questionId: "q1_1", order: 2, option: "Sekitar 100 liter",                     isCorrect: false },
    { questionId: "q1_1", order: 3, option: "Sekitar 500 liter",                     isCorrect: false },
    
    { questionId: "q1_2", order: 1, option: "True",                                  isCorrect: true },
    { questionId: "q1_2", order: 2, option: "False",                                 isCorrect: false },

    { questionId: "q1_3", order: 1, option: "Fardhu 'Ain",                           isCorrect: true },
    { questionId: "q1_3", order: 2, option: "Fardhu Kifayah",                        isCorrect: false },
    { questionId: "q1_3", order: 3, option: "Sunnah Muakkad",                        isCorrect: false },
    { questionId: "q1_3", order: 4, option: "Sunnah Ghairu Muakkad",                 isCorrect: false },

    { questionId: "q1_4", order: 1, option: "Beragama Islam",                        isCorrect: false },
    { questionId: "q1_4", order: 2, option: "Tamyiz (Bisa membedakan baik & buruk)", isCorrect: false },
    { questionId: "q1_4", order: 3, option: "Menggunakan air suci mensucikan",       isCorrect: false },
    { questionId: "q1_4", order: 4, option: "Harus dilakukan di masjid",             isCorrect: true },

    { questionId: "q1_5", order: 1, option: "Mutlaq",                                isCorrect: false },
    { questionId: "q1_5", order: 2, option: "Musta'mal",                             isCorrect: false },
    { questionId: "q1_5", order: 3, option: "Tahir Ghairu Mutahhir",                 isCorrect: true },
    { questionId: "q1_5", order: 4, option: "Mutanajjis",                            isCorrect: false },

    { questionId: "q1_6", order: 1, option: "Membatalkan shalat",                                 isCorrect: false },
    { questionId: "q1_6", order: 2, option: "Mengambil jumlah yang paling sedikit & sujud sahwi", isCorrect: true },
    { questionId: "q1_6", order: 3, option: "Bertanya pada orang di sebelah",                     isCorrect: false },
    { questionId: "q1_6", order: 4, option: "Melanjutkan tanpa peduli",                           isCorrect: false },

    { questionId: "q2_1", order: 1, option: "Hubab bin Mundzir",                     isCorrect: true },
    { questionId: "q2_1", order: 2, option: "Salman Al-Farisi",                      isCorrect: false },
    { questionId: "q2_1", order: 3, option: "Umar bin Khattab",                      isCorrect: false },

    { questionId: "q2_2", order: 1, option: "313 personil",                          isCorrect: true },
    { questionId: "q2_2", order: 2, option: "1000 personil",                         isCorrect: false },

    { questionId: "q3_1", order: 1, option: "True",                                  isCorrect: true },
    { questionId: "q3_1", order: 2, option: "False",                                 isCorrect: false },

    { questionId: "q3_2", order: 1, option: "Tidak berjalan di depan guru",          isCorrect: true },
    { questionId: "q3_2", order: 2, option: "Tidak mendahului berbicara tanpa izin", isCorrect: true },
    { questionId: "q3_2", order: 3, option: "Membantah pendapat guru di depan umum", isCorrect: false },

    { questionId: "q4_1", order: 1, option: "Idzhar Halqi",                          isCorrect: true },
    { questionId: "q4_1", order: 2, option: "Ikhfa Haqiqi",                          isCorrect: false },
    { questionId: "q4_1", order: 3, option: "Idgham Bighunnah",                      isCorrect: false },

    { questionId: "q4_2", order: 1, option: "True",                                  isCorrect: true },
    { questionId: "q4_2", order: 2, option: "False",                                 isCorrect: false }
  ];

  for (const q of quizdata) {
    await prisma.materialQuiz.create({
      data: {
        id: q.id,
        title: q.title,
        description: q.description,
      },
    });
  }

  for (const q of quizquestion) {
    await prisma.quizQuestion.create({
      data: {
        id: q.id,
        quizId: q.quizId,
        question: q.question,
      },
    });
  }

  for (const o of quizoption) {
    await prisma.quizOption.create({
      data: {
        questionId: o.questionId,
        text: o.option,
        isCorrect: o.isCorrect,
      },
    });
  }

  // ── PROGRAM ENROLLMENTS ───────────────────────────────────────────────────────
  // Enroll user3 (Rafa) into program1
  await prisma.programEnrollment.create({
    data: { programId: program1.id, userId: user3.id },
  });

  // Create sample notifications for user3 (Rafa)
  // 1. Basic notification
  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "basic",
      status: "unread",
      title: "Selamat Datang di IRMA Verse!",
      message:
        "Assalamualaikum! Selamat bergabung di platform IRMA Verse. Jelajahi fitur-fitur yang tersedia dan mulai perjalanan belajarmu.",
      icon: "megaphone",
      actionUrl: "/overview",
    },
  });

  // 2. Basic notification (schedule reminder)
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

  // 3. Basic notification (already read)
  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: "basic",
      status: "read",
      title: "Berita Baru: Kedudukan Akal dan Wahyu",
      message:
        "Artikel terbaru telah diterbitkan. Baca selengkapnya tentang hubungan akal dan wahyu dalam perspektif Islam.",
      icon: "bell",
      resourceType: "news",
      resourceId: news1.id,
      actionUrl: `/news/${news1.slug}`,
      senderId: user1.id,
    },
  });

  // 4. Invitation notification (with MaterialInvite)
  const inviteToken1 =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Create the materialinvite first
  await prisma.materialInvite.create({
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

  // 5. Another invitation notification
  const inviteToken2 =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  const material102 = await prisma.material.findFirst({
    where: { instructorId: "102" },
  });

  await prisma.materialInvite.create({
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

  console.log("✅ Data seeding completed!");
  console.log("📊 Summary:");
  console.log(`   - Users: 3 + 6 instructors`);
  console.log(`   - News: 5`);
  console.log(`   - Schedules: 3`);
  console.log(
    `   - Programs: 2 (program1 dengan 3 materi, program2 dengan 2 materi)`,
  );
  console.log(`   - Materials: 6 (4 terhubung ke program, 2 mandiri)`);
  console.log(`   - Program Enrollments: 1 (Rafa → Program Aqidah & Akhlak)`);
  console.log(`   - Notifications: 5 (3 basic + 2 invitations)`);
  console.log(`   - Material Invites: 2`);
  console.log(`   - Quizzes: 4`);
  console.log(`   - Quiz Questions: 8`);
  console.log(`   - Quiz Options: 20`);
  console.log("\n💡 Test the search with these keywords:");
  console.log('   - "kedudukan" (untuk mencari berita tentang akal dan wahyu)');
  console.log('   - "ahmad" (untuk mencari instruktur)');
  console.log('   - "tafsir" (untuk mencari artikel tafsir)');
  console.log('   - "rafa" (untuk mencari pengguna)');
}

function mapGrade(value: string): MaterialGrade {
  switch (value) {
    case "X":
      return MaterialGrade.X;
    case "XI":
      return MaterialGrade.XI;
    case "XII":
      return MaterialGrade.XII;
    default:
      throw new Error(`Invalid grade: ${value}`);
  }
}
function mapCourseCategory(value: string): MaterialCategory {
  switch (value) {
    case "Wajib":
      return MaterialCategory.Wajib;
    case "Ekstra":
      return MaterialCategory.Extra;
    case "Next Level":
      return MaterialCategory.NextLevel;
    case "Susulan":
      return MaterialCategory.Susulan;
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
