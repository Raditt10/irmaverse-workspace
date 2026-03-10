import prisma from "@/lib/prisma";
import { Metadata } from "next";
import ScheduleDetailClient from "./ScheduleDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function getSchedule(id: string) {
  return await prisma.schedule.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          name: true,
          bidangKeahlian: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const schedule = await getSchedule(id);

  if (!schedule) {
    return {
      title: "Event Tidak Ditemukan - IRMA Verse",
    };
  }

  const title = `${schedule.title} - IRMA Verse`;
  const description = schedule.description || "Platform pembelajaran Islam interaktif untuk generasi muda";
  const imageUrl = schedule.thumbnailUrl || `https://picsum.photos/seed/event${schedule.id}/800/400`;
  
  // Use absolute URL for metadata images
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const absoluteImageUrl = imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: absoluteImageUrl }],
      type: "website",
      url: `${baseUrl}/schedule/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function SchedulePage({ params }: Props) {
  const { id } = await params;
  const rawSchedule = await getSchedule(id);

  let mappedSchedule = null;
  if (rawSchedule) {
    mappedSchedule = {
      ...rawSchedule,
      instructorId: rawSchedule.instructorId || "",
      status: rawSchedule.status === "segera_hadir" 
        ? "Segera hadir" 
        : rawSchedule.status === "ongoing" 
        ? "Sedang berlangsung" 
        : "Kegiatan telah selesai",
      pemateriAvatar: rawSchedule.instructor?.name 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawSchedule.instructor.name}`
        : null,
      pemateriSpecialization: rawSchedule.instructor?.bidangKeahlian || "Instruktur",
      image: rawSchedule.thumbnailUrl || `https://picsum.photos/seed/event${rawSchedule.id}/800/400`,
      // Convert Date serialize for Client Component
      date: rawSchedule.date.toISOString(),
      description: rawSchedule.description || "",
      location: rawSchedule.location || "",
      pemateri: rawSchedule.pemateri || "",
      contactNumber: rawSchedule.contactNumber || null,
      contactEmail: rawSchedule.contactEmail || null,
      fullDescription: rawSchedule.fullDescription || null,
    };
  }

  return (
    <ScheduleDetailClient 
      initialSchedule={mappedSchedule} 
      scheduleId={id} 
    />
  );
}
