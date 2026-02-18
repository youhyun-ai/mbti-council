export type MbtiGroup = "analyst" | "diplomat" | "sentinel" | "explorer";

export type MbtiType = {
  code: string;
  group: MbtiGroup;
  emoji: string;
};

export const MBTI_TYPES: MbtiType[] = [
  { code: "INTJ", group: "analyst", emoji: "🧠" },
  { code: "INTP", group: "analyst", emoji: "🧪" },
  { code: "ENTJ", group: "analyst", emoji: "🧭" },
  { code: "ENTP", group: "analyst", emoji: "⚡" },

  { code: "INFJ", group: "diplomat", emoji: "🔮" },
  { code: "INFP", group: "diplomat", emoji: "🌿" },
  { code: "ENFJ", group: "diplomat", emoji: "🤝" },
  { code: "ENFP", group: "diplomat", emoji: "🎉" },

  { code: "ISTJ", group: "sentinel", emoji: "📘" },
  { code: "ISFJ", group: "sentinel", emoji: "🫶" },
  { code: "ESTJ", group: "sentinel", emoji: "📈" },
  { code: "ESFJ", group: "sentinel", emoji: "💬" },

  { code: "ISTP", group: "explorer", emoji: "🛠️" },
  { code: "ISFP", group: "explorer", emoji: "🎨" },
  { code: "ESTP", group: "explorer", emoji: "🏍️" },
  { code: "ESFP", group: "explorer", emoji: "🌞" },
];

export const GROUP_LABEL: Record<MbtiGroup, string> = {
  analyst: "분석가",
  diplomat: "외교관",
  sentinel: "관리자",
  explorer: "탐험가",
};

export const GROUP_STYLES: Record<
  MbtiGroup,
  {
    badge: string;
    card: string;
    selectedRing: string;
  }
> = {
  analyst: {
    badge: "bg-violet-100 text-violet-700",
    card: "border-violet-200 bg-violet-50 text-violet-800",
    selectedRing: "ring-violet-500",
  },
  diplomat: {
    badge: "bg-emerald-100 text-emerald-700",
    card: "border-emerald-200 bg-emerald-50 text-emerald-800",
    selectedRing: "ring-emerald-500",
  },
  sentinel: {
    badge: "bg-sky-100 text-sky-700",
    card: "border-sky-200 bg-sky-50 text-sky-800",
    selectedRing: "ring-sky-500",
  },
  explorer: {
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200 bg-amber-50 text-amber-900",
    selectedRing: "ring-amber-500",
  },
};
