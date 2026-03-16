import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET single schedule by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = await prisma.schedules.findUnique({
      where: {
        id: id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            bidangKeahlian: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Map users to instructor for frontend compatibility
    const responseData = {
      ...schedule,
      instructor: (schedule as any).users,
    };
    delete (responseData as any).users;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PATCH update schedule (instructor only, own schedules)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the schedule to check ownership
    const existingSchedule = await prisma.schedules.findUnique({
      where: { id: id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const userRole = session.user.role?.toLowerCase();

    // Check if user is the instructor who created this schedule or if they are an admin/instruktur
    if (
      existingSchedule.instructorId !== session.user.id &&
      userRole !== "admin" &&
      userRole !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "You can only update your own schedules" },
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
      status,
      contactNumber,
      contactEmail,
    } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (fullDescription !== undefined) updateData.fullDescription = fullDescription;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (location) updateData.location = location;
    if (pemateri) updateData.pemateri = pemateri;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (status) updateData.status = status;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null;

    const updatedSchedule = await prisma.schedules.update({
      where: { id: id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Map users to instructor for frontend compatibility
    const responseData = {
      ...updatedSchedule,
      instructor: (updatedSchedule as any).users,
    };
    delete (responseData as any).users;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE schedule (instructor only, own schedules)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the schedule to check ownership
    const existingSchedule = await prisma.schedules.findUnique({
      where: { id: id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const userRole = session.user.role?.toLowerCase();

    // Check if user is the instructor who created this schedule or if they are an admin/instruktur
    if (
      existingSchedule.instructorId !== session.user.id &&
      userRole !== "admin" &&
      userRole !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "You can only delete your own schedules" },
        { status: 403 }
      );
    }

    await prisma.schedules.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
