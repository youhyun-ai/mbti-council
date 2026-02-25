export type BalanceChoice = {
  id: "A" | "B";
  text: string;
  leanType: string;
};

export type BalanceQuestion = {
  id: string;
  prompt: string;
  choices: [BalanceChoice, BalanceChoice];
};

export const BALANCE_QUESTIONS: BalanceQuestion[] = [
  { id: "q1", prompt: "연애할 때 더 끌리는 건?", choices: [
    { id: "A", text: "ENFP처럼 매일 새 취미 같이 도전", leanType: "ENFP" },
    { id: "B", text: "ISTJ처럼 같은 루틴 10년 유지", leanType: "ISTJ" },
  ]},
  { id: "q2", prompt: "회사에서 더 편한 스타일은?", choices: [
    { id: "A", text: "ENTJ처럼 결론부터 3줄 보고", leanType: "ENTJ" },
    { id: "B", text: "INFP처럼 맥락+감정까지 풀설명", leanType: "INFP" },
  ]},
  { id: "q3", prompt: "주말 계획, 당신의 선택은?", choices: [
    { id: "A", text: "ISFP처럼 즉흥 드라이브", leanType: "ISFP" },
    { id: "B", text: "INTJ처럼 시간표 꽉 채운 하루", leanType: "INTJ" },
  ]},
  { id: "q4", prompt: "썸 연락 템포는?", choices: [
    { id: "A", text: "ESTP처럼 5분 안에 바로 답장", leanType: "ESTP" },
    { id: "B", text: "INFJ처럼 생각 정리 후 답장", leanType: "INFJ" },
  ]},
  { id: "q5", prompt: "팀플에서 맡고 싶은 역할은?", choices: [
    { id: "A", text: "ENFJ처럼 분위기+조율 담당", leanType: "ENFJ" },
    { id: "B", text: "INTP처럼 구조 설계+핵심 논리", leanType: "INTP" },
  ]},
  { id: "q6", prompt: "여행 가면 더 행복한 순간은?", choices: [
    { id: "A", text: "ESFP처럼 현지에서 우연히 놀 거리 발견", leanType: "ESFP" },
    { id: "B", text: "ISTJ처럼 계획한 코스 완주", leanType: "ISTJ" },
  ]},
  { id: "q7", prompt: "갈등 생기면 어떻게 풀래?", choices: [
    { id: "A", text: "ENTP처럼 토론으로 끝장보기", leanType: "ENTP" },
    { id: "B", text: "ISFJ처럼 조용히 배려하며 봉합", leanType: "ISFJ" },
  ]},
  { id: "q8", prompt: "돈 생기면 먼저 하는 건?", choices: [
    { id: "A", text: "ESTJ처럼 예산표부터 업데이트", leanType: "ESTJ" },
    { id: "B", text: "ENFP처럼 일단 경험에 투자", leanType: "ENFP" },
  ]},
  { id: "q9", prompt: "카톡방에서 내 역할은?", choices: [
    { id: "A", text: "ESFJ처럼 반응 이모지+분위기 메이커", leanType: "ESFJ" },
    { id: "B", text: "INTJ처럼 핵심 한 줄 요약러", leanType: "INTJ" },
  ]},
  { id: "q10", prompt: "인생 만족감이 큰 순간은?", choices: [
    { id: "A", text: "INFP처럼 의미 있는 대화 후 여운", leanType: "INFP" },
    { id: "B", text: "ENTJ처럼 목표 달성 체크 완료", leanType: "ENTJ" },
  ]},
];

export function getQuestionById(questionId: string) {
  return BALANCE_QUESTIONS.find((q) => q.id === questionId) || null;
}
