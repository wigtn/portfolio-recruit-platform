/**
 * ui-kit 프리셋을 벤더링본으로 소비한다(기획서 §5.2 — 비공개 레지스트리·워크스페이스 의존 없이
 * 정적 빌드되도록). 프리셋이 semantic 토큰을 전부 매핑하므로 테마 CSS만 갈면 전체가 리테마된다.
 */
module.exports = {
  presets: [require("@wigtn/ui-kit/tailwind-preset")],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
};
