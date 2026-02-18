import type { Metadata } from "next";
import { getCouncil } from "@/lib/council-db";
import { CouncilClient } from "./council-client";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    question?: string;
    types?: string;
    language?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;

  // Try to load from DB first for accurate OG meta
  const saved = await getCouncil(id);
  const question = saved?.question || sp.question || "MBTI 토론회";
  const types = saved ? saved.types.join(" vs ") : (sp.types ? sp.types.split(",").join(" vs ") : "MBTI 패널");
  const description = `MBTI 토론회: ${types}`;

  return {
    title: question,
    description,
    openGraph: { title: question, description },
    twitter: { card: "summary_large_image", title: question, description },
  };
}

export default async function CouncilPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  // Check DB — if already completed, pass saved data for replay
  const saved = await getCouncil(id);

  if (saved?.status === "done") {
    return (
      <CouncilClient
        id={id}
        initialQuestion={saved.question}
        initialTypes={saved.types}
        initialLanguage={saved.language}
        savedCouncil={saved}
      />
    );
  }

  return (
    <CouncilClient
      id={id}
      initialQuestion={sp.question ?? ""}
      initialTypes={(sp.types ?? "")
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean)}
      initialLanguage={sp.language ?? "ko"}
    />
  );
}
