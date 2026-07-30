import { describe, expect, it } from "vitest";
import { sanitizePaste } from "./sanitize";

describe("sanitizePaste: 붙여넣기 실살균", () => {
  it("스크립트·이벤트 핸들러를 지우고 내역을 돌려준다", () => {
    const { clean, hits } = sanitizePaste(
      '안내문\n<script>alert(1)</script><img src="x" onerror="steal()">끝',
    );
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("onerror");
    expect(clean).toContain("안내문");
    expect(clean).toContain("끝");
    expect(hits.map((hit) => hit.label)).toEqual([
      "실행 스크립트",
      "이벤트 핸들러",
    ]);
  });

  it("위험이 없으면 원문 그대로, 내역은 빈 배열", () => {
    const { clean, hits } = sanitizePaste("평범한 글 **굵게** - 목록");
    expect(clean).toBe("평범한 글 **굵게** - 목록");
    expect(hits).toEqual([]);
  });

  it("javascript: 링크와 iframe도 잡는다", () => {
    const { hits } = sanitizePaste(
      '<iframe src="https://evil"></iframe><a href="javascript:x()">a</a>',
    );
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});
