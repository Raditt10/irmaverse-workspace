import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";

export async function GET() {
  try {
    const competitions = await prisma.competitions.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const formattedCompetitions = competitions.map((comp) => {
      try {
        return {
          id: comp.id,
          title: comp.title || "Untitled",
          date: Array.isArray(comp.schedules) && comp.schedules.length > 0
            ? (comp.schedules as any[])[0]?.date || "TBA"
            : new Date(comp.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
          prize: comp.prize || "TBA",
          category: comp.category,
          image: comp.thumbnailUrl || "https://images.unsplash.com/photo-1526080652727-5b77f74df6c5?auto=format&fit=crop&w=1000&q=80",
          instructor: comp.users ? {
            id: comp.users.id,
            name: comp.users.name || "Instructor",
            avatar: comp.users.avatar,
          } : null,
        };
      } catch (e) {
        console.error("Error formatting competition:", comp, e);
        throw e;
      }
    });

    return NextResponse.json(formattedCompetitions, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching competitions:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch competitions", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/competitions - Starting request");
    
    const session = await auth();
    console.log("Session:", session ? "Found" : "Not found");

    if (!session || !session.user) {
      console.log("No session or user");
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    const userRole = session.user.role?.toLowerCase();
    const isPrivileged = userRole === "admin" || userRole === "instruktur" || userRole === "super_admin";

    if (!isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);
    
    const { 
      title, description, date, location, prize, category, thumbnailUrl,
      contactPerson, contactNumber, contactEmail, maxParticipants, prizes, schedules,
      requirements, judgingCriteria
    } = body;

    if (!title || !date || !prize || !category) {
      console.log("Missing required fields:", { title: !!title, date: !!date, prize: !!prize, category: !!category });
      return NextResponse.json(
        { error: "Missing required fields: title, date, prize, category" },
        { status: 400 }
      );
    }

    const instructorId = session.user.id || session.user.email;
    console.log("Instructor ID:", instructorId);
    
    if (!instructorId) {
      return NextResponse.json(
        { error: "Cannot determine user ID" },
        { status: 400 }
      );
    }

    console.log("Creating competition with data:", { title, date, prize, category, instructorId });

    const competition = await prisma.competitions.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        prize,
        category,
        thumbnailUrl: thumbnailUrl || null,
        contactPerson: contactPerson || null,
        contactNumber: contactNumber || null,
        contactEmail: contactEmail || null,
        maxParticipants: maxParticipants || null,
        prizes: prizes || null,
        schedules: schedules || null,
        requirements: requirements || null,
        judgingCriteria: judgingCriteria || null,
        instructorId,
        updatedAt: new Date(),
        id: crypto.randomUUID(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    console.log("Competition created:", competition.id);

    // Log Activity
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: session.user.id,
        type: "admin_competition_managed" as any,
        title: "Membuat Lomba Baru",
        description: `Admin membuat lomba baru: ${competition.title}`,
        metadata: { competitionId: competition.id }
      });
    }

    return NextResponse.json(competition, { status: 201 });
  } catch (error: any) {
    console.error("Error creating competition:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to create competition", 
        details: error?.message || "Unknown error",
        code: error?.code
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role?.toLowerCase();
    const isPrivileged = userRole === "admin" || userRole === "instruktur" || userRole === "super_admin";

    if (!isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      id, title, description, date, location, prize, category, thumbnailUrl, 
      requirements, judgingCriteria, prizes, schedules, 
      contactPerson, contactNumber, contactEmail, maxParticipants 
    } = body;

    if (!id || !title || !date || !prize || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const competition = await prisma.competitions.findUnique({
      where: { id },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }


    const updatedCompetition = await prisma.competitions.update({
      where: { id },
      data: {
        title,
        description,
        date: new Date(date),
        location,
        prize,
        category,
        thumbnailUrl,
        requirements,
        judgingCriteria,
        prizes,
        schedules,
        contactPerson,
        contactNumber,
        contactEmail,
        maxParticipants,
      },
    });

    // Log Activity
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: session.user.id,
        type: "admin_competition_managed" as any,
        title: "Memperbarui Lomba",
        description: `Admin memperbarui lomba: ${updatedCompetition.title}`,
        metadata: { competitionId: updatedCompetition.id }
      });
    }

    return NextResponse.json(updatedCompetition, { status: 200 });
  } catch (error: any) {
    console.error("Error updating competition:", error);
    return NextResponse.json(
      { error: "Failed to update competition", details: error?.message },
      { status: 500 }
    );
  }
}
