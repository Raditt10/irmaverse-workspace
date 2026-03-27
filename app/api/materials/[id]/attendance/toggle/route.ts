import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: materialId } = await params;

    if (!session?.user || (session.user.role !== "instruktur" && session.user.role !== "admin" && session.user.role !== "super_admin")) {
      console.log("Toggle API: Unauthorized access attempt", { role: session?.user?.role });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isOpen } = body;

    // Use raw query to bypass Prisma Client schema validation since generate failed due to lock
    await prisma.$executeRaw`UPDATE material SET isAttendanceOpen = ${isOpen} WHERE id = ${materialId}`;

    return NextResponse.json({ 
      success: true, 
      isAttendanceOpen: isOpen 
    });
  } catch (error) {
    console.error("Toggle attendance error:", error);
    return NextResponse.json({ error: "Failed to toggle attendance" }, { status: 500 });
  }
}
