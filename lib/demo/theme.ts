/**
 * 데모 테마.
 *
 * 원래 DemoGuideWidget 안에만 있던 것을 꺼냈다. 챗봇도 "우리 브랜드 색으로
 * 보여줘"에 응답해 테마를 바꿔야 하는데, 위젯 안에 갇혀 있으면 같은 코드를
 * 한 벌 더 쓰게 된다. 토큰 하나로 전 화면이 바뀐다는 게 이 데모의 주장이라
 * 그 주장을 실행하는 코드가 두 곳에 있으면 곤란하다.
 */
export const THEMES = [
  { id: "indigo", label: "기본", color: "#4f46e5", ink: "#3730a3", soft: "#eef0ff" },
  { id: "red", label: "빨강", color: "#ef4444", ink: "#b91c1c", soft: "#fff1f2" },
  { id: "amber", label: "주황", color: "#f59e0b", ink: "#b45309", soft: "#fffbeb" },
  { id: "ink", label: "먹색", color: "#1b1e28", ink: "#111318", soft: "#f1f2f5" },
];

export function applyTheme(id: string) {
  // "custom:#rrggbb" — 피커로 고른 색. ink(진하게)·soft(옅게)는 색상 혼합으로 파생
  if (id.startsWith("custom:")) {
    const hex = id.slice(7);
    const root = document.documentElement.style;
    root.setProperty("--accent", hex);
    root.setProperty("--accent-ink", `color-mix(in oklab, ${hex} 76%, #1b1e28)`);
    root.setProperty(
      "--accent-soft",
      `color-mix(in oklab, ${hex} 12%, #ffffff)`,
    );
    return;
  }
  const theme = THEMES.find((item) => item.id === id) ?? THEMES[0];
  document.documentElement.style.setProperty("--accent", theme.color);
  document.documentElement.style.setProperty("--accent-ink", theme.ink);
  document.documentElement.style.setProperty("--accent-soft", theme.soft);
}

export const THEME_LABEL: Record<string, string> = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme.label]),
);
