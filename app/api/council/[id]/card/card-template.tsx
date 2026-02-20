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

function truncate(input: string, limit: number) {
  return input.length > limit ? `${input.slice(0, limit - 1)}…` : input;
}

export function renderCard({ councilId, question, types, winner, winnerQuote, verdictLines, isSquare }: CardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#111827",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: 56,
        fontFamily: "Noto Sans KR, sans-serif",
      }}
    >
      <div style={{ fontSize: 26, opacity: 0.7 }}>MBTI 단톡 · vitric.ai</div>

      <div style={{ fontSize: isSquare ? 44 : 52, fontWeight: 700, marginTop: 20, lineHeight: 1.3 }}>
        {truncate(question, 52)}
      </div>

      <div style={{ fontSize: 30, marginTop: 24 }}>참여 유형: {types.join(", ")}</div>

      <div style={{ fontSize: isSquare ? 40 : 48, fontWeight: 800, marginTop: 28 }}>🏆 승자: {winner}</div>

      <div style={{ fontSize: 30, marginTop: 16, lineHeight: 1.35 }}>
        {winnerQuote ? truncate(winnerQuote, 72) : "이 토론에서는 모두가 열정적이었습니다."}
      </div>

      {!isSquare && verdictLines.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
          {verdictLines.slice(0, 3).map((v) => (
            <div key={v.type} style={{ fontSize: 24, marginTop: 6 }}>
              {v.type}: {truncate(v.line, 58)}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 22, opacity: 0.65 }}>vitric.ai/c/{councilId}</div>
    </div>
  );
}
