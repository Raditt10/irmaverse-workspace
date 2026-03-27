import { NextRequest, NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    const typesParam = request.nextUrl.searchParams.get('types'); // e.g., "news,schedule"
    const allowedTypes = typesParam ? typesParam.split(',') : null;

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Prepare promises for parallel execution, but only if type is allowed
    const searchPromises: Promise<any>[] = [];

    // Berita & Artikel
    if (!allowedTypes || allowedTypes.includes('news')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT id, title, slug, deskripsi, image, category
        FROM news
        WHERE 
          CONCAT(LOWER(title), ' ', LOWER(deskripsi), ' ', LOWER(COALESCE(content, ''))) 
          LIKE CONCAT('%', LOWER(${query}), '%')
        ORDER BY createdAt DESC
        LIMIT 5
      `.then((res: any) => res.map((n: any) => ({
        id: n.id,
        type: 'news' as const,
        title: n.title,
        slug: n.slug,
        description: n.deskripsi,
        image: n.image,
        category: n.category,
      }))));
    }

    // Kajian (Materials)
    if (!allowedTypes || allowedTypes.includes('material')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT m.id, m.title, m.description, m.category, m.grade, m.date, m.location, m.thumbnailUrl,
               u.name AS instructorName
        FROM material m
        LEFT JOIN users u ON m.instructorId = u.id
        WHERE 
          CONCAT(LOWER(m.title), ' ', LOWER(COALESCE(m.description, '')), ' ', LOWER(COALESCE(m.location, '')))
          LIKE CONCAT('%', LOWER(${query}), '%')
        ORDER BY m.date DESC
        LIMIT 5
      `.then((res: any) => res.map((m: any) => ({
        id: m.id,
        type: 'material' as const,
        title: m.title,
        description: m.description,
        image: m.thumbnailUrl,
        category: m.category,
        grade: m.grade,
        date: m.date,
        location: m.location,
        instructorName: m.instructorName,
      }))));
    }

    // Instruktur
    if (!allowedTypes || allowedTypes.includes('instructor')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT id, name, avatar, bidangKeahlian, pengalaman
        FROM users
        WHERE 
          role = 'instruktur' AND
          CONCAT(LOWER(COALESCE(name, '')), ' ', LOWER(COALESCE(bidangKeahlian, '')), ' ', LOWER(COALESCE(pengalaman, '')))
          LIKE CONCAT('%', LOWER(${query}), '%')
        LIMIT 5
      `.then((res: any) => res.map((i: any) => ({
        id: i.id,
        type: 'instructor' as const,
        title: i.name,
        image: i.avatar,
        bidangKeahlian: i.bidangKeahlian,
        pengalaman: i.pengalaman,
      }))));
    }

    // Program
    if (!allowedTypes || allowedTypes.includes('program')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT p.id, p.title, p.description, p.category, p.grade, p.thumbnailUrl,
               u.name AS instructorName
        FROM programs p
        LEFT JOIN users u ON p.instructorId = u.id
        WHERE 
          CONCAT(LOWER(p.title), ' ', LOWER(COALESCE(p.description, '')))
          LIKE CONCAT('%', LOWER(${query}), '%')
        ORDER BY p.createdAt DESC
        LIMIT 5
      `.then((res: any) => res.map((p: any) => ({
        id: p.id,
        type: 'program' as const,
        title: p.title,
        description: p.description,
        image: p.thumbnailUrl,
        category: p.category,
        grade: p.grade,
        instructorName: p.instructorName,
      }))));
    }

    // Kompetisi
    if (!allowedTypes || allowedTypes.includes('competition')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT id, title, description, category, date, location, thumbnailUrl, prize
        FROM competitions
        WHERE 
          CONCAT(LOWER(title), ' ', LOWER(COALESCE(description, '')), ' ', LOWER(COALESCE(location, '')))
          LIKE CONCAT('%', LOWER(${query}), '%')
        ORDER BY date DESC
        LIMIT 5
      `.then((res: any) => res.map((c: any) => ({
        id: c.id,
        type: 'competition' as const,
        title: c.title,
        description: c.description,
        image: c.thumbnailUrl,
        category: c.category,
        date: c.date,
        location: c.location,
        prize: c.prize,
      }))));
    }

    // Jadwal / Schedule
    if (!allowedTypes || allowedTypes.includes('schedule')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT s.id, s.title, s.description, s.date, s.time, s.location, s.pemateri, s.status, s.thumbnailUrl
        FROM schedules s
        WHERE 
          CONCAT(LOWER(s.title), ' ', LOWER(COALESCE(s.description, '')), ' ', LOWER(COALESCE(s.location, '')), ' ', LOWER(COALESCE(s.pemateri, '')))
          LIKE CONCAT('%', LOWER(${query}), '%')
        ORDER BY s.date DESC
        LIMIT 5
      `.then((res: any) => res.map((s: any) => ({
        id: s.id,
        type: 'schedule' as const,
        title: s.title,
        description: s.description,
        date: s.date,
        time: s.time,
        location: s.location,
        pemateri: s.pemateri,
        status: s.status,
      }))));
    }

    // Kuis
    if (!allowedTypes || allowedTypes.includes('quiz')) {
      searchPromises.push(prisma.$queryRaw`
        SELECT q.id, q.title, q.description, q.materialId,
               m.title AS materialTitle
        FROM material_quizzes q
        LEFT JOIN material m ON q.materialId = m.id
        WHERE 
          CONCAT(LOWER(q.title), ' ', LOWER(COALESCE(q.description, '')))
          LIKE CONCAT('%', LOWER(${query}), '%')
        ORDER BY q.createdAt DESC
        LIMIT 5
      `.then((res: any) => res.map((q: any) => ({
        id: q.id,
        type: 'quiz' as const,
        title: q.title,
        description: q.description,
        materialId: q.materialId,
        materialTitle: q.materialTitle,
      }))));
    }

    const searchResultsArrays = await Promise.all(searchPromises);
    const results = searchResultsArrays.flat();

    return NextResponse.json({ results, query });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
