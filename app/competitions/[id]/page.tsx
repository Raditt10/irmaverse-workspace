import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import CompetitionDetailClient from "./CompetitionDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

function getCompetitionStatus(date: Date): "upcoming" | "ongoing" | "finished" {
  const now = new Date();
  const competitionDate = new Date(date);
  
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const competition = await prisma.competition.findUnique({
    where: { id },
  });

  if (!competition) {
    return {
      title: "Kompetisi Tidak Ditemukan | IRMA Verse",
      description: "Kompetisi yang Anda cari tidak dapat ditemukan.",
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const imageUrl = competition.thumbnailUrl?.startsWith("http")
    ? competition.thumbnailUrl
    : `${baseUrl}${competition.thumbnailUrl || "/og-image.png"}`;

  return {
    title: `${competition.title} | IRMA Verse`,
    description: competition.description || "Ikuti kompetisi seru di IRMA Verse!",
    openGraph: {
      title: competition.title,
      description: competition.description || "Ikuti kompetisi seru di IRMA Verse!",
      url: `${baseUrl}/competitions/${id}`,
      siteName: "IRMA Verse",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: competition.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: competition.title,
      description: competition.description || "Ikuti kompetisi seru di IRMA Verse!",
      images: [imageUrl],
    },
  };
}

export default async function CompetitionPage({ params }: Props) {
  const { id } = await params;

  try {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!competition) {
      return (
        <CompetitionDetailClient initialCompetition={null} competitionId={id} />
      );
    }

    const initialCompetition = {
      ...competition,
      date: competition.date.toISOString(),
      status: getCompetitionStatus(competition.date),
      requirements: competition.requirements as string[] || [],
      judgingCriteria: competition.judgingCriteria as string[] || [],
      prizes: competition.prizes as any[] || [],
      schedules: competition.schedules as any[] || [],
    };

    return (
      <CompetitionDetailClient 
        initialCompetition={initialCompetition as any} 
        competitionId={id} 
      />
    );
  } catch (error) {
    console.error("Error loading competition page:", error);
    return (
      <CompetitionDetailClient initialCompetition={null} competitionId={id} />
    );
  }
}
