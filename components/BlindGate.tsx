"use client";

import { useEffect, useState } from "react";
import { loadState } from "@/lib/admin/overlay";
import type { Report } from "@/lib/admin/seed";
import { Icon } from "./Icon";

/**
 * 블라인드 게이트 — 운영자 신고 처리(블라인드·삭제)가 사용자 화면으로 돌아오는 자리.
 *
 * 글 상세·목록은 정적 시드를 그리는 서버 컴포넌트라, 오버레이(loadState)를 읽는
 * 클라이언트 게이트를 사이에 끼워 원문을 가린다. 운영자가 복원하면 상태값이
 * "복원"으로 바뀌므로 다음 렌더에서 즉시 원문이 돌아온다 — 별도 저장소를 만들지
 * 않고 신고 오버레이 하나만 정본으로 쓴다.
 *
 * "임시 블라인드"는 가리지 않는다 — 자동 조치 단계라 아직 운영자 판정 전이고,
 * 가리는 건 운영자의 확정 조치(블라인드·삭제)만이다.
 */

const HIDDEN_STATUS = new Set(["블라인드", "삭제"]);

function isBlinded(reports: Report[], postId: string) {
  return reports.some((row) => {
    // 시드 행은 postId 필드로(공유 계약), 체험 중 접수된 신고 행은 id가 곧
    // 글 id다(submitReport가 대상 id로 행을 만든다) — 두 경로 모두 잇는다
    const linked =
      (row as Report & { postId?: string }).postId ??
      (row.kind === "커뮤니티 글" ? row.id : undefined);
    return linked === postId && HIDDEN_STATUS.has(row.status);
  });
}

/** 글 하나의 블라인드 여부 — 목록 행(PostRow)도 같은 판정을 쓴다 */
export function useBlinded(postId?: string) {
  const [blinded, setBlinded] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setBlinded(isBlinded(loadState().reports, postId));
  }, [postId]);

  return blinded;
}

/**
 * 글 상세용 — 블라인드면 제목·본문 자리를 안내로 통째 교체한다.
 * `.article` 안에서 쓴다(ahead/abody 문법을 그대로 따라 자리 구조가 튀지 않는다).
 */
export function BlindGate({
  postId,
  children,
}: {
  postId: string;
  children: React.ReactNode;
}) {
  const blinded = useBlinded(postId);

  if (!blinded) return <>{children}</>;

  return (
    <>
      <div className="ahead">
        <div className="badges" style={{ display: "flex", gap: 6 }}>
          <span className="tag neu">블라인드</span>
        </div>
        <h1 style={{ color: "var(--ink-3)" }}>
          운영자에 의해 블라인드된 글이에요
        </h1>
      </div>
      <div className="abody">
        <div className="safenote" style={{ marginBottom: 0 }}>
          <span className="si">
            <Icon name="shield" />
          </span>
          <div>
            <b>신고 처리로 가려진 글이에요</b>
            <span>
              운영자가 복원하면 원문이 그대로 돌아와요, 처리 과정은 운영자 화면{" "}
              <b>신고 관리</b>에서 볼 수 있어요.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
