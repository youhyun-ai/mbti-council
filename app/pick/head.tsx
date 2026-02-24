export default function Head() {
  const title = "MBTI 토론 시작 | MBTI 성격유형 단톡";
  const description = "MBTI 성격 유형 3명을 골라 질문하면, 실시간으로 토론이 열립니다. 궁합/관계/고민 모두 가능.";
  const image = "https://vitric.ai/api/council/0520f5fc-3d8c-49c8-b430-42c1649dc50e/card?format=square";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="MBTI 성격, MBTI 토론, MBTI 궁합, 성격유형" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="ko_KR" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
