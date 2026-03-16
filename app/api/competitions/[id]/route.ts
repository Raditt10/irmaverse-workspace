import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const competition = await prisma.competitions.findUnique({
      where: { id },
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

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    const formatted = {
      id: competition.id,
      title: competition.title,
      description: competition.description,
      date: new Date(competition.date).toISOString(), // Return ISO for easier parsing in frontend
      location: competition.location,
      prize: competition.prize,
      category: competition.category,
      thumbnailUrl: competition.thumbnailUrl,
      requirements: competition.requirements || [],
      judgingCriteria: competition.judgingCriteria || [],
      prizes: competition.prizes || [],
      schedules: competition.schedules || [],
      contactPerson: competition.contactPerson,
      contactNumber: competition.contactNumber,
      contactEmail: competition.contactEmail,
      maxParticipants: competition.maxParticipants,
      instructorId: competition.instructorId,
      instructor: competition.users,
      createdAt: competition.createdAt,
      status: getCompetitionStatus(competition.date),
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching competition:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch competition", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const competition = await prisma.competitions.findUnique({
      where: { id },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    await prisma.competitions.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Competition deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting competition:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to delete competition", details: error?.message },
      { status: 500 }
    );
  }
}

function getCompetitionStatus(date: Date): "upcoming" | "ongoing" | "finished" {
  const now = new Date();
  const competitionDate = new Date(date);
  
  // Add 1 day to competition date to consider it "ongoing" for the whole day
  const endDate = new Date(competitionDate);
  endDate.setDate(endDate.getDate() + 1);

  if (now < competitionDate) {
    return "upcoming";
  } else if (now < endDate) {
    return "ongoing";
  } else {
    return "finished";
  }
}
