import Anthropic from "@anthropic-ai/sdk";

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
const cache = new Map<string, DailyHoroscope>();

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing");
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function fallback(type: MbtiType, date: string): DailyHoroscope {
  return {
    type,
    date,
    title: `${type} 오늘의 운세`,
    overall: "오늘은 가볍게 가도 운이 붙는 날. 너무 완벽하려고만 하지 말고, 작은 타이밍을 잡아보세요.",
    love: "호감 신호는 디테일에서 보여요. 답장 템포를 한 박자만 맞춰보세요.",
    career: "일은 80%에서 공유해도 충분히 좋아요. 피드백이 오늘의 부스터입니다.",
    luck: "사소한 선택에서 행운이 갈립니다. 첫 직감을 믿고 빠르게 움직여보세요.",
    social: "사람 운은 무난 이상. 길게 설명하기보다 한 줄 진심이 더 먹혀요.",
    luckyItem: "메모 앱",
    luckyTime: "오후 3:00~5:00",
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

export async function generateDailyHoroscope(typeRaw: string, date: string): Promise<DailyHoroscope> {
  const type = typeRaw.toUpperCase();
  if (!isValidMbtiType(type)) throw new Error("Invalid MBTI type");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date format");

  const key = `${type}:${date}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const prompt = [
    `MBTI council가 합의해서 만든 오늘의 MBTI 운세를 작성해줘.`,
    "형식은 토론 로그가 아니라 최종 운세 요약본이어야 해.",
    `MBTI: ${type}`,
    `날짜(한국): ${date}`,
    "톤: 가볍고 재밌게, 한국 MZ 감성, 30초 안에 읽히게.",
    "중요: MBTI 성격의 과장된 유머를 섞되 비하/혐오/공포 표현 금지.",
    "카테고리 4개: 연애, 커리어, 행운, 인간관계.",
    "date를 seed처럼 사용해서 같은 날짜엔 같은 성향의 메시지가 나오게 하고, 다음 날엔 결이 달라지게.",
    "한국어로만 작성.",
    "JSON만 출력:",
    '{"title":"...","overall":"...","love":"...","career":"...","luck":"...","social":"...","luckyItem":"...","luckyTime":"..."}',
    "각 문장은 1~2문장, 짧고 선명하게.",
  ].join("\n");

  try {
    const res = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      temperature: 0.2,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const parsed = parseJson(text);
    const value: DailyHoroscope = parsed
      ? { type, date, ...parsed }
      : fallback(type, date);

    cache.set(key, value);
    return value;
  } catch {
    const value = fallback(type, date);
    cache.set(key, value);
    return value;
  }
}
