import { GROUP_LABEL, MBTI_TYPES, type MbtiGroup } from "@/app/lib/mbti";

type VerdictLine = { type: string; line: string };

type CardProps = {
  councilId: string;
  question: string;
  types: string[];
  winner: string;
  winnerQuote: string | null;
  verdictLines: VerdictLine[];
  isSquare: boolean;
};

const GROUP_COLORS: Record<MbtiGroup, { bg: string; text: string; border: string }> = {
  analyst: { bg: "rgba(76,29,149,0.30)", text: "#c4b5fd", border: "#7c3aed" },
  diplomat: { bg: "rgba(6,78,59,0.30)", text: "#6ee7b7", border: "#059669" },
  sentinel: { bg: "rgba(12,74,110,0.30)", text: "#7dd3fc", border: "#0284c7" },
  explorer: { bg: "rgba(120,53,15,0.30)", text: "#fcd34d", border: "#d97706" },
};

const META = Object.fromEntries(MBTI_TYPES.map((t) => [t.code, t]));

function truncate(input: string, limit: number) {
  return input.length > limit ? `${input.slice(0, limit - 1)}…` : input;
}

export function renderCard(props: CardProps) {
  const { councilId, question, types, winner, winnerQuote, verdictLines, isSquare } = props;
  const gradient = isSquare
    ? "linear-gradient(135deg, #1a0835 0%, #0f1e40 100%)"
    : "linear-gradient(160deg, #1a0835 0%, #0f1e40 55%, #0a2d1a 100%)";

  const wMeta = META[winner];

  return (
    <div
      style={{
        width: 1080,
        height: isSquare ? 1080 : 1920,
        background: gradient,
        display: "flex",
        flexDirection: "column",
        padding: isSquare ? "60px 64px" : "80px 72px",
        fontFamily: "Noto Sans KR, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: isSquare ? 44 : 60 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: isSquare ? 20 : 22 }}>MBTI 단톡</div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: isSquare ? 20 : 22 }}>vitric.ai</div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 28,
          padding: isSquare ? "32px 40px" : "40px 48px",
          marginBottom: isSquare ? 36 : 48,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: isSquare ? 22 : 24, marginBottom: 12 }}>💬 오늘의 질문</div>
        <div style={{ color: "#fff", fontSize: isSquare ? 46 : 52, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {truncate(question, 40)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: isSquare ? 32 : 48 }}>
        {types.map((code) => {
          const meta = META[code];
          if (!meta) return null;
          const c = GROUP_COLORS[meta.group];
          return (
            <div
              key={code}
              style={{
                flex: 1,
                borderRadius: 20,
                border: `2px solid ${c.border}`,
                background: c.bg,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: isSquare ? "14px 12px" : "20px 16px",
                minHeight: isSquare ? 100 : 140,
              }}
            >
              <div style={{ fontSize: isSquare ? 30 : 40 }}>{meta.emoji}</div>
              <div style={{ color: c.text, fontSize: isSquare ? 32 : 36, fontWeight: 800 }}>{code}</div>
              {!isSquare && (
                <div style={{ color: c.text, opacity: 0.85, fontSize: 20 }}>{GROUP_LABEL[meta.group]}</div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "#FEE500",
          borderRadius: 28,
          padding: isSquare ? "36px 44px" : "40px 48px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ color: "#1a0835", fontSize: isSquare ? 26 : 28, fontWeight: 700, marginBottom: 10 }}>🏆 판결</div>
        <div style={{ color: "#1a0835", fontSize: isSquare ? 38 : 44, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
          {wMeta?.emoji ?? "🏆"} {winner}가 이 토론을 주도했습니다
        </div>
        <div style={{ height: 1, background: "rgba(26,8,53,0.2)", marginTop: 20, marginBottom: 18 }} />
        <div style={{ color: "#1a0835", fontSize: isSquare ? 28 : 30, fontStyle: "italic", lineHeight: 1.4 }}>
          "{winnerQuote ? truncate(winnerQuote, 60) : "이 토론에서는 모두가 열정적이었습니다 🔥"}"
        </div>
      </div>

      {!isSquare && verdictLines.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "auto" }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }}>각자의 마지막 한마디</div>
          {verdictLines.map((v) => {
            const meta = META[v.type];
            return (
              <div key={v.type} style={{ color: "rgba(255,255,255,0.9)", fontSize: 26 }}>
                {meta?.emoji ?? "•"} {v.type}: {truncate(v.line, 60)}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: isSquare ? 26 : 28, fontWeight: 700 }}>
          나도 MBTI 토론 보러 가기 →
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: isSquare ? 20 : 22 }}>
          vitric.ai/c/{councilId}
        </div>
      </div>
    </div>
  );
}
