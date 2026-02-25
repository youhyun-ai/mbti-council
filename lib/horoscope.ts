import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";

import { isValidMbtiType, type MbtiType } from "@/lib/mbti";

export type DailyHoroscope = {
  type: MbtiType;
  date: string;
  title: string;
  overall: string;
  love: string;
  career: string;
  luck: string;
  social: string;
  luckyItem: string;
  luckyTime: string;
};

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing");
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function seededIndex(seed: string, len: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0) % len;
}

function fallback(type: MbtiType, date: string): DailyHoroscope {
  const styleMap: Record<string, string[]> = {
    I: ["혼자 정리한 생각이 승부수", "조용한 집중력이 오늘의 버프", "짧고 정확한 한마디가 먹히는 날"],
    E: ["사람 속에서 운이 붙는 날", "네 텐션이 분위기 판을 바꿔요", "한 번의 연락이 기회를 데려와요"],
    N: ["큰 그림을 먼저 보면 길이 보임", "감이 온 아이디어를 메모해두세요", "패턴 캐치가 수익으로 이어짐"],
    S: ["디테일 한 끗이 결과를 살립니다", "현실 체크가 실수 방지 치트키", "작은 루틴이 오늘 운을 끌어올림"],
    T: ["감정보다 기준표가 통하는 날", "숫자와 근거가 당신 편", "의사결정 속도가 성과를 만듭니다"],
    F: ["공감 한 줄이 관계를 구해요", "진심 톤으로 말하면 풀립니다", "마음 읽기 능력이 빛나는 날"],
    J: ["계획표가 오늘의 방패", "마감 전에 끝내면 운이 배가됨", "우선순위 정리가 보상으로 돌아와요"],
    P: ["즉흥의 센스가 기회를 낚아채요", "변수 대응력이 오늘의 재능", "유연한 플랜B가 대박 포인트"],
  };

  const letters = type.split("");
  const key = `${type}:${date}`;
  const pick = (letter: string) => {
    const pool = styleMap[letter] || ["오늘은 리듬을 믿어보세요"];
    return pool[seededIndex(`${key}:${letter}`, pool.length)];
  };

  return {
    type,
    date,
    title: `${type} 데일리 바이브 리포트`,
    overall: `${pick(letters[0])}. ${pick(letters[1])}.`,
    love: `${pick(letters[3])}. 답장 타이밍은 너무 재지 말고 한 박자 빠르게.`,
    career: `${pick(letters[2])}. 오늘은 80% 완성본이라도 먼저 공유하세요.`,
    luck: `${pick(letters[1])}. 작은 선택을 미루지 않으면 운이 붙어요.`,
    social: `${pick(letters[0])}. 설명은 길게보다 핵심 한 줄이 효과적.`,
    luckyItem: ["노트 앱", "무선 이어폰", "텀블러", "네이비 펜"][seededIndex(`${key}:item`, 4)],
    luckyTime: ["오전 09:40", "오후 01:20", "오후 04:10", "저녁 08:30"][seededIndex(`${key}:time`, 4)],
  };
}

function parseJson(text: string): Omit<DailyHoroscope, "type" | "date"> | null {
  try {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s < 0 || e < 0) return null;
    const raw = JSON.parse(text.slice(s, e + 1)) as Record<string, string>;
    const fields = ["title", "overall", "love", "career", "luck", "social", "luckyItem", "luckyTime"];
    if (!fields.every((k) => typeof raw[k] === "string" && raw[k].trim())) return null;
    return {
      title: raw.title.trim(),
      overall: raw.overall.trim(),
      love: raw.love.trim(),
      career: raw.career.trim(),
      luck: raw.luck.trim(),
      social: raw.social.trim(),
      luckyItem: raw.luckyItem.trim(),
      luckyTime: raw.luckyTime.trim(),
    };
  } catch {
    return null;
  }
}

async function generateDailyHoroscopeUncached(type: MbtiType, date: string): Promise<DailyHoroscope> {
  const prompt = [
    "MBTI council가 합의해서 만든 오늘의 MBTI 운세를 작성해줘.",
    "형식은 토론 로그가 아니라 최종 운세 요약본이어야 해.",
    `MBTI: ${type}`,
    `날짜(한국): ${date}`,
    "톤: 가볍고 재밌게, 한국 MZ 감성, 30초 안에 읽히게.",
    "중요: MBTI 성격의 과장된 유머를 섞되 비하/혐오/공포 표현 금지.",
    "카테고리 4개: 연애, 커리어, 행운, 인간관계.",
    "date를 seed처럼 사용해서 같은 날짜엔 같은 성향의 메시지가 나오게 하고, 다음 날엔 결이 달라지게.",
    "다른 MBTI 타입과 절대 같아 보이지 않게 type 특성이 문장에 드러나야 해.",
    "한국어로만 작성.",
    "JSON만 출력:",
    '{"title":"...","overall":"...","love":"...","career":"...","luck":"...","social":"...","luckyItem":"...","luckyTime":"..."}',
    "각 문장은 1~2문장, 짧고 선명하게.",
  ].join("\n");

  const res = await Promise.race([
    getClient().messages.create({
      model: "claude-sonnet-4-6",
      temperature: 0.35,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Horoscope generation timeout")), 12000)
    ),
  ]);

  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseJson(text);
  if (!parsed) {
    throw new Error("Horoscope JSON parse failed");
  }

  return { type, date, ...parsed };
}

const getDailyHoroscopeCached = unstable_cache(
  async (type: MbtiType, date: string) => generateDailyHoroscopeUncached(type, date),
  ["daily-horoscope-v3"],
  {
    revalidate: 60 * 60 * 24 * 30,
    tags: ["daily-horoscope"],
  }
);

export async function generateDailyHoroscope(typeRaw: string, date: string): Promise<DailyHoroscope> {
  const type = typeRaw.toUpperCase();
  if (!isValidMbtiType(type)) throw new Error("Invalid MBTI type");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date format");

  try {
    return await getDailyHoroscopeCached(type, date);
  } catch (error) {
    console.error("[horoscope] generation failed", {
      type,
      date,
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      error: error instanceof Error ? error.message : String(error),
    });
    // Important: fallback is NOT cached.
    return fallback(type, date);
  }
}
