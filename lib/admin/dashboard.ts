/**
 * 대시보드 지표 — 기간(오늘/7일/30일)에 따라 달라진다.
 * 시안은 7일 값만 그려져 있어, 나머지는 그 값을 기준으로 비율을 맞춘 합성 데이터다.
 */

export type Period = "today" | "7d" | "30d";

export const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "today", label: "오늘" },
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
];

export type Metric = {
  key: string;
  label: string;
  value: string;
  delta: string;
  /** up = 증가(청록 ▲), down = 감소(회색 ▼) — 시안의 dn/up 클래스와 대응 */
  dir: "up" | "down";
  spark: string;
};

const SPARK_UP = "0,20 17,17 33,19 50,12 67,14 83,7 100,4";
const SPARK_MID = "0,18 17,20 33,14 50,16 67,10 83,11 100,6";
const SPARK_DOWN = "0,8 17,10 33,7 50,13 67,12 83,17 100,15";
const SPARK_STEEP = "0,22 17,19 33,16 50,15 67,10 83,8 100,3";

export const METRICS: Record<Period, Metric[]> = {
  today: [
    { key: "visit", label: "방문자", value: "486", delta: "▲ 8%", dir: "up", spark: SPARK_UP },
    { key: "signup", label: "신규 가입", value: "12", delta: "▲ 4%", dir: "up", spark: SPARK_MID },
    { key: "posts", label: "새 글 · 댓글", value: "63", delta: "▼ 2%", dir: "down", spark: SPARK_DOWN },
    { key: "reviews", label: "새 리뷰", value: "19", delta: "▲ 15%", dir: "up", spark: SPARK_STEEP },
  ],
  "7d": [
    { key: "visit", label: "방문자", value: "3,182", delta: "▲ 12%", dir: "up", spark: SPARK_UP },
    { key: "signup", label: "신규 가입", value: "86", delta: "▲ 9%", dir: "up", spark: SPARK_MID },
    { key: "posts", label: "새 글 · 댓글", value: "412", delta: "▼ 4%", dir: "down", spark: SPARK_DOWN },
    { key: "reviews", label: "새 리뷰", value: "128", delta: "▲ 21%", dir: "up", spark: SPARK_STEEP },
  ],
  "30d": [
    { key: "visit", label: "방문자", value: "13,940", delta: "▲ 18%", dir: "up", spark: SPARK_UP },
    { key: "signup", label: "신규 가입", value: "371", delta: "▲ 14%", dir: "up", spark: SPARK_MID },
    { key: "posts", label: "새 글 · 댓글", value: "1,806", delta: "▼ 1%", dir: "down", spark: SPARK_DOWN },
    { key: "reviews", label: "새 리뷰", value: "544", delta: "▲ 26%", dir: "up", spark: SPARK_STEEP },
  ],
};

/** x축 라벨도 기간에 맞춰 바뀐다 */
export const XAXIS: Record<Period, string[]> = {
  today: ["00시", "04시", "08시", "12시", "16시", "20시", "지금"],
  "7d": ["07.20", "07.21", "07.22", "07.23", "07.24", "07.25", "오늘"],
  "30d": ["6.28", "7.03", "7.08", "7.13", "7.18", "7.23", "오늘"],
};

/** 운영 큐 — 각 항목은 담당 화면으로 이어진다(시안 코치마크: "누르면 실제 작업 화면으로") */
export const QUEUE: Array<{
  label: string;
  note?: string;
  count: number;
  href: string;
  icon: string;
  warn?: boolean;
}> = [
  {
    label: "신고된 위험 콘텐츠",
    count: 8,
    href: "/admin/reports",
    icon: "alert",
    warn: true,
  },
  {
    label: "답변 없는 질문",
    note: "· 48시간 경과",
    count: 12,
    href: "/community?board=qna",
    icon: "comment",
  },
  { label: "증빙 검토 대기", count: 3, href: "/admin/badges", icon: "award" },
  {
    label: "회사 중복 · 사명 변경 확인",
    count: 4,
    href: "/admin/companies",
    icon: "building",
  },
  {
    label: "AI 생성 실패",
    count: 2,
    href: "/admin/ai",
    icon: "bot",
    warn: true,
  },
];

/** 활동 추이 차트 — 기간별 시리즈(글·댓글 / 리뷰). viewBox 320x140 기준 좌표 */
export const TREND: Record<Period, { posts: string; reviews: string }> = {
  today: {
    posts: "0,110 53,96 107,101 160,72 213,80 267,58 320,44",
    reviews: "0,126 53,120 107,114 160,116 213,104 267,108 320,92",
  },
  "7d": {
    posts: "0,95 53,80 107,88 160,60 213,66 267,42 320,35",
    reviews: "0,118 53,112 107,102 160,106 213,90 267,94 320,74",
  },
  "30d": {
    posts: "0,102 53,88 107,70 160,74 213,52 267,46 320,28",
    reviews: "0,124 53,108 107,110 160,92 213,86 267,70 320,62",
  },
};

/** 면적(area)은 선 아래를 닫아 만든다 */
export function toArea(points: string) {
  const last = points.trim().split(/\s+/).at(-1)?.split(",")[0] ?? "320";
  return `M${points.trim().replace(/\s+/g, " L")} L${last},140 L0,140 Z`;
}
