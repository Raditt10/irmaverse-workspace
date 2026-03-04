import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET - fetch rekapan for a specific material
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: materialId } = await params;

    const rekapan = await prisma.rekapan.findUnique({
      where: { materialId },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            category: true,
            grade: true,
            instructorId: true,
            users: { select: { name: true } },
          },
        },
      },
    });

    if (!rekapan) {
      return NextResponse.json(
        { error: "Rekapan belum tersedia untuk materi ini" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: rekapan.id,
      materialId: rekapan.materialId,
      content: rekapan.content,
      createdAt: rekapan.createdAt,
      updatedAt: rekapan.updatedAt,
      material: {
        id: rekapan.material.id,
        title: rekapan.material.title,
        description: rekapan.material.description,
        date: rekapan.material.date,
        category: rekapan.material.category,
        grade: rekapan.material.grade,
        instructor: rekapan.material.users?.name || "TBA",
      },
    });
  } catch (error) {
    console.error("Get rekapan error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil rekapan" },
      { status: 500 },
    );
  }
}

// POST / PUT - create or update rekapan for a material
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || (user.role !== "instruktur" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Hanya instruktur atau admin yang bisa membuat rekapan" },
        { status: 403 },
      );
    }

    const { id: materialId } = await params;

    // Verify material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) {
      return NextResponse.json(
        { error: "Materi tidak ditemukan" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Konten rekapan tidak boleh kosong" },
        { status: 400 },
      );
    }

    // Upsert: create if not exists, update if exists
    const rekapan = await prisma.rekapan.upsert({
      where: { materialId },
      create: {
        materialId,
        content: content.trim(),
      },
      update: {
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, rekapan }, { status: 201 });
  } catch (error) {
    console.error("Create/update rekapan error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan rekapan" },
      { status: 500 },
    );
  }
}

// DELETE - remove rekapan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || (user.role !== "instruktur" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: materialId } = await params;

    await prisma.rekapan.delete({
      where: { materialId },
    });

    return NextResponse.json({ success: true, message: "Rekapan dihapus" });
  } catch (error) {
    console.error("Delete rekapan error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus rekapan" },
      { status: 500 },
    );
  }
}
