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

export function renderCard({
  councilId,
  question,
  types,
  winner,
  winnerQuote,
  verdictLines,
  isSquare,
}: CardProps) {
  const w = 1080;
  const h = isSquare ? 1080 : 1920;
  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundColor: "#111827",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: 56,
        fontFamily: "Noto Sans KR",
      }}
    >
      <div style={{ fontSize: 28, opacity: 0.7 }}>MBTI 단톡 · vitric.ai</div>

      <div style={{ marginTop: 24, fontSize: 56, fontWeight: 800, lineHeight: 1.25 }}>
        {truncate(question, 56)}
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "row" }}>
        {types.map((code) => (
          <div
            key={code}
            style={{
              marginRight: 16,
              borderRadius: 16,
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: "#4b5563",
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 16,
              paddingRight: 16,
              fontSize: 34,
              fontWeight: 700,
              backgroundColor: "#1f2937",
            }}
          >
            {code}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 30,
          borderRadius: 18,
          padding: 24,
          backgroundColor: "#FEE500",
          color: "#111827",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700 }}>판결</div>
        <div style={{ marginTop: 8, fontSize: 52, fontWeight: 800, lineHeight: 1.2 }}>
          {winner + " 승"}
        </div>
        <div style={{ marginTop: 14, fontSize: 34, lineHeight: 1.35 }}>
          {winnerQuote ? truncate(winnerQuote, 72) : "이 토론에서는 모두가 열정적이었습니다"}
        </div>
      </div>

      {!isSquare && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
          {verdictLines.slice(0, 3).map((v) => (
            <div key={v.type} style={{ fontSize: 28, lineHeight: 1.35, marginBottom: 8, opacity: 0.95 }}>
              {v.type + ": " + truncate(v.line, 56)}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 28, fontSize: 24, opacity: 0.65 }}>vitric.ai/c/{councilId}</div>
    </div>
  );
}
