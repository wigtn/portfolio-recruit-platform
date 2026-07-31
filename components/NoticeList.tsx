"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadState } from "@/lib/admin/overlay";
import { seed, type Notice } from "@/lib/admin/seed";
import { Icon } from "./Icon";
import { Sk, SkRegion, useMockLoading } from "./Skeleton";

/**
 * 공지·FAQ·약관 — **운영자가 등록·수정·내리기 한 결과가 그대로 보이는 화면**이다.
 *
 * 아코디언(접었다 펴기)을 버리고 일반 게시판처럼 목록 → 상세로 오간다.
 * 무엇을 볼지는 전부 URL(kind·doc)이 정한다 — 상태를 컴포넌트에 복사해
 * 두지 않으므로, 푸터에서 다른 종류·문서 링크를 눌러도 그대로 반영된다
 * (예전에는 useState(initial)이 낡은 탭을 붙들고 있었다).
 */

const KINDS: Array<{ key: Notice["kind"]; label: string }> = [
  { key: "notice", label: "공지사항" },
  { key: "faq", label: "자주 묻는 질문" },
  { key: "terms", label: "약관, 정책" },
];

const KIND_LABEL = Object.fromEntries(
  KINDS.map((item) => [item.key, item.label]),
) as Record<Notice["kind"], string>;

const live = (row: Notice) =>
  row.status === "노출중" || row.status === "시행중";

/** 실측 높이(1440px) — 목록 행 53.6px, 고정 배지가 붙은 행은 58.2px */
const ROW_H = 53.6;
const ROW_PINNED_H = 58.2;

/**
 * 스켈레톤 행 수는 시드에서 센다 — 오버레이를 읽기 전이라 실제 개수는 모르지만,
 * 손대지 않은 기본 상태에서는 시드 개수 그대로라 전환 시 높이가 안 변한다.
 */
function skeletonRows(kind: Notice["kind"]) {
  return seed.notices.filter((row) => row.kind === kind && live(row));
}

export function NoticeList({
  kind,
  doc,
}: {
  kind: Notice["kind"];
  /** 문서 id — 있으면 상세 화면을 그린다 */
  doc?: string;
}) {
  const [notices, setNotices] = useState<Notice[] | null>(null);

  // 홈과 같은 강제 지연 — 빈 카드가 먼저 그려졌다 채워지는 flash를 없앤다
  const delaying = useMockLoading();
  const loading = delaying || notices === null;

  useEffect(() => setNotices(loadState().notices), []);

  const rows = (notices ?? [])
    .filter((row) => row.kind === kind && live(row))
    .sort((a, b) => Number(b.pinned ?? 0) - Number(a.pinned ?? 0));

  /* ── 상세 — 커뮤니티 글 상세(.article)와 같은 문법. 반응바·댓글처럼
        공지에 없는 것만 뺀다 ── */
  if (doc) {
    const row = (notices ?? []).find((item) => item.id === doc);
    return (
      <>
        <div className="ntback">
          <Link className="btn line sm" href={`/notices?kind=${kind}`}>
            ← {KIND_LABEL[kind]} 목록
          </Link>
        </div>
        {loading ? (
          <SkRegion label="문서">
            <div className="article" aria-hidden>
              <div className="ahead">
                <Sk w={56} h={22} r={6} />
                <div style={{ margin: "11px 0 14px" }}>
                  <Sk w="46%" h={24} />
                </div>
                <Sk w={140} h={12} />
              </div>
              <Sk w="100%" h={14} style={{ marginBottom: 10 }} />
              <Sk w="92%" h={14} style={{ marginBottom: 10 }} />
              <Sk w="84%" h={14} />
            </div>
          </SkRegion>
        ) : row && live(row) ? (
          <article className="article sk-arrive">
            <div className="ahead">
              <div style={{ display: "flex", gap: 6 }}>
                <span className="tag neu">{KIND_LABEL[row.kind]}</span>
                {row.pinned ? <span className="tag hot">고정</span> : null}
              </div>
              <h1>{row.title}</h1>
              <div className="awho">
                <span>운영팀</span>
                <span>, {row.date}</span>
              </div>
            </div>
            <div className="abody">
              {row.body.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              내려갔거나 없는 문서예요
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
              목록에서 다른 문서를 확인해보세요
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── 목록 — 행을 누르면 상세로 이동한다 ── */
  return (
    <>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {KINDS.map((item) => (
          <Link
            key={item.key}
            className={kind === item.key ? "on" : undefined}
            href={`/notices?kind=${item.key}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <SkRegion label="문서 목록">
            {skeletonRows(kind).map((row, index) => (
              <div
                className="ntrow"
                key={row.id}
                aria-hidden
                style={{
                  height: row.pinned ? ROW_PINNED_H : ROW_H,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 18px",
                  boxSizing: "border-box",
                }}
              >
                {row.pinned ? <Sk w={37} h={22} r={6} /> : null}
                {/* 제목 폭은 행마다 다르게 — 같은 폭이 반복되면 목록으로 안 읽힌다 */}
                <Sk w={["42%", "34%", "46%", "38%"][index % 4]} h={14} />
                <Sk w={70} h={12} style={{ marginLeft: "auto" }} />
                <Sk w={14} h={14} />
              </div>
            ))}
          </SkRegion>
        ) : (
          <>
            {rows.map((row) => (
              <div className="ntrow" key={row.id}>
                <Link
                  className="nthd"
                  href={`/notices?kind=${kind}&doc=${row.id}`}
                >
                  {row.pinned ? <span className="bs neu">고정</span> : null}
                  <span className="ntt">{row.title}</span>
                  <span className="ntd">{row.date}</span>
                  <Icon name="arrow" />
                </Link>
              </div>
            ))}

            {rows.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  등록된 문서가 없어요
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                  운영자가 등록하면 여기에 보여요
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
