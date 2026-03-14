import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";

// GET all schedules
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST create new schedule (instructor only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug session
    console.log('Session:', JSON.stringify(session, null, 2));
    console.log('User ID:', session.user.id);
    
    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!userExists) {
      console.log('User not found in database:', session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log('User found:', userExists.email, userExists.role);

    // Check if user is instructor
    if (session.user.role !== "instruktur") {
      return NextResponse.json(
        { error: "Only instructors can create schedules" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      fullDescription,
      date,
      time,
      location,
      pemateri,
      thumbnailUrl,
      status: bodyStatus,
      contactNumber,
      contactEmail,
    } = body;

    // Detailed validation
    if (!title || !title.toString().trim()) {
      return NextResponse.json(
        { error: "Judul jadwal harus diisi" },
        { status: 400 }
      );
    }
    if (title.toString().trim().length < 3) {
      return NextResponse.json(
        { error: "Judul jadwal minimal 3 karakter" },
        { status: 400 }
      );
    }
    if (!description || !description.toString().trim()) {
      return NextResponse.json(
        { error: "Deskripsi jadwal harus diisi" },
        { status: 400 }
      );
    }
    if (!date) {
      return NextResponse.json(
        { error: "Tanggal jadwal harus dipilih" },
        { status: 400 }
      );
    }
    if (!time) {
      return NextResponse.json(
        { error: "Jam jadwal harus dipilih" },
        { status: 400 }
      );
    }
    if (!location || !location.toString().trim()) {
      return NextResponse.json(
        { error: "Lokasi jadwal harus diisi" },
        { status: 400 }
      );
    }
    if (!pemateri || !pemateri.toString().trim()) {
      return NextResponse.json(
        { error: "Penanggung jawab harus diisi" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        fullDescription,
        date: new Date(date),
        time,
        location,
        pemateri,
        thumbnailUrl,
        contactNumber: contactNumber || null,
        contactEmail: contactEmail || null,
        instructorId: session.user.id,
        status: bodyStatus || "segera_hadir",
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log Activity
    const userRole = session.user.role?.toLowerCase();
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: session.user.id,
        type: "admin_schedule_managed" as any,
        title: "Membuat Jadwal Baru",
        description: `Admin membuat jadwal baru: ${schedule.title}`,
        metadata: { scheduleId: schedule.id }
      });
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat jadwal" },
      { status: 500 }
    );
  }
}
