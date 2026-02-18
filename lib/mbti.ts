export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

const MBTI_SET = new Set<string>(MBTI_TYPES);

export function isValidMbtiType(value: string): value is MbtiType {
  return MBTI_SET.has(value.toUpperCase());
}

export function normalizeType(value: string): string {
  return value.trim().toUpperCase();
}
