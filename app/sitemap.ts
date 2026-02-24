import type { MetadataRoute } from "next";

const SITE = "https://vitric.ai";

function todayKST() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

const MBTI = [
  "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const today = todayKST();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/pick`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/horoscope`, changeFrequency: "daily", priority: 0.9 },
  ];

  const horoscopeUrls = MBTI.map((type) => ({
    url: `${SITE}/horoscope/${type}/${today}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...base, ...horoscopeUrls];
}
