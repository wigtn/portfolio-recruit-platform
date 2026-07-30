"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { ToolResult } from "@/lib/admin/run";
import type { Curation, Slot } from "@/lib/admin/seed";
import { COMPANIES } from "@/lib/seed/companies";
import { BOARDS, FEED } from "@/lib/seed/feed";
import { Icon } from "@/components/Icon";
import { Sk, SkRegion } from "@/components/Skeleton";
import { toast } from "@/components/ds/Toaster";
import { useDragSort } from "@/components/ds/useDragSort";
import { CompanyLogo } from "./CompanyLogo";
import { FormModal } from "./FormModal";
import { CurationPicker } from "./CurationPicker";

/**
 * 큐레이션 — 홈 첫 화면 배치를 직접 바꾼다.
 *
 * 순서는 드래그로 바꾼다(⋮⋮ 핸들, 키보드 ↑/↓는 훅이 지원). 위/아래 화살표
 * 버튼은 한 칸씩만 움직여서 세 칸 옮기는 데 여섯 번 눌러야 했다.
 *
 * 편집은 화면에서만 하고, 저장을 눌러야 오버레이에 반영된다 — 저장 버튼이 있는데
 * 클릭마다 저장되면 그 버튼이 거짓말이 된다. 미저장 상태는 본문 배너 대신
 * "변경 발생 시 토스트 1회 + 저장 버튼 활성화"로 알린다(권한 화면 문법) —
 * 배너는 나타날 때마다 아래 카드를 밀어냈다.
 */

type Key = "companies" | "posts" | "banners";

/* 게시판 키 → 사람이 읽는 이름 (BOARDS 정본 파생) */
const BOARD_LABEL = Object.fromEntries(
  BOARDS.map((board) => [board.key, board.label]),
);

const LIMIT: Record<Key, number> = { companies: 5, posts: 3, banners: 3 };

/**
 * 스켈레톤 슬롯 수 — 시드 기본값(추천 3 · 인기글 2 · 배너 1)과 같게 맞춰
 * 스켈레톤→데이터 전환에서 카드 높이가 밀리지 않는다. 슬롯 높이 36px는
 * 표 행 밀도로 압축한 뒤의 실측값(app/admin/curation/loading.tsx와 동일).
 */
const SK_CARDS: Array<{ title: string; slots: number }> = [
  { title: "추천 회사 (홈 상단)", slots: 3 },
  { title: "인기글 고정", slots: 2 },
  { title: "메인 공지 · 배너", slots: 1 },
];

export function CurationBoard() {
  const admin = useAdmin();
  const [draft, setDraft] = useState<Curation | null>(null);
  const [adding, setAdding] = useState<Key | "keyword" | null>(null);
  // 같은 결과·같은 dirty 구간을 두 번 토스트하지 않기 위한 기억(PolicyMatrix 문법)
  const toasted = useRef<ToolResult | null>(null);
  const wasDirty = useRef(false);

  // 오버레이가 들어오면 초안을 맞춘다(저장 후 되돌아온 값도 여기로 반영된다)
  useEffect(() => {
    if (admin.state) setDraft(admin.state.curation);
  }, [admin.state]);

  // 조치 결과 안내 — 배너(ResultNote) 대신 토스트. 레이아웃을 밀지 않는다.
  useEffect(() => {
    const res = admin.result;
    if (!res || toasted.current === res) return;
    toasted.current = res;
    if (!res.ok) {
      toast(res.message, { tone: "error" });
      return;
    }
    // 멱등 재실행("이미 처리된 요청")은 저장 완료로 위장하지 않는다
    if (res.message.startsWith("이미")) {
      toast(res.message, { tone: "info" });
      return;
    }
    toast("홈 화면 배치를 저장했어요 — 변경 내역은 처리 기록에 남았어요.", {
      tone: "success",
    });
  }, [admin.result]);

  // 미저장 안내 — dirty가 "되는 순간" 1회만 토스트(권한 화면과 같은 문법).
  // 저장·원복으로 풀리면 다음 변경 때 다시 1회. 상시 표시는 저장 버튼의
  // 활성/문구("변경 저장"↔"저장됨")가 맡는다 — 레이아웃 시프트 0.
  useEffect(() => {
    if (!draft || !admin.state) return;
    const dirty =
      JSON.stringify(draft) !== JSON.stringify(admin.state.curation);
    if (dirty && !wasDirty.current) {
      toast("저장하지 않은 변경이 있어요 — 저장을 눌러야 홈에 반영돼요.", {
        tone: "info",
      });
    }
    wasDirty.current = dirty;
  }, [draft, admin.state]);

  if (!draft) {
    // 오버레이 도착 전 — 화면 구조를 그대로 미러링한 스켈레톤(헤더까지 사라지면 안 된다)
    return (
      <SkRegion label="큐레이션">
        <div className="ahd">
          <button className="btn line sm" disabled>
            저장됨
          </button>
        </div>
        <div className="curgrid" aria-hidden>
          {SK_CARDS.map((card) => (
            <div className="curcard" key={card.title}>
              <h4>{card.title}</h4>
              {Array.from({ length: card.slots }).map((_, index) => (
                <div className="slot" key={index} style={{ height: 36 }}>
                  <Sk w={16} h={13} />
                  <Sk w="56%" h={13} />
                  <Sk w={40} h={13} style={{ marginLeft: "auto" }} />
                </div>
              ))}
              <button className="slotadd" disabled>
                <Icon name="plus" />
                불러오는 중
              </button>
            </div>
          ))}
          {/* 키워드 카드는 구조가 다르다(안내 문구 + 제외 행) — loading.tsx
              미러와 같은 기하(20.6 + 10 + 36 + 30)로 그린다 */}
          <div className="curcard">
            <h4>인기 키워드 제외</h4>
            <div
              style={{ display: "flex", alignItems: "center", minHeight: 20.6 }}
            >
              <Sk w="72%" h={13} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="slot" style={{ height: 36 }}>
                <Sk w="40%" h={13} />
              </div>
              <button className="slotadd" disabled>
                <Icon name="plus" />
                불러오는 중
              </button>
            </div>
          </div>
        </div>
      </SkRegion>
    );
  }
  const saved = admin.state?.curation;
  const dirty = saved ? JSON.stringify(draft) !== JSON.stringify(saved) : false;

  // 드래그 확정 — from 행을 뽑아 to 자리에 끼운다(스왑이 아니라 이동).
  // 저장 전까지는 로컬 초안만 바뀐다.
  const reorder = (key: Key, from: number, to: number) => {
    const list = [...draft[key]];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setDraft({ ...draft, [key]: list });
  };

  const remove = (key: Key, id: string) =>
    setDraft({ ...draft, [key]: draft[key].filter((slot) => slot.id !== id) });

  const add = (key: Key, slot: Slot) =>
    setDraft({ ...draft, [key]: [...draft[key], slot] });

  return (
    <>
      <div className="ahd">
        <button
          className={dirty ? "btn primary sm" : "btn line sm"}
          disabled={!dirty || admin.busy}
          onClick={() =>
            admin.act("curation.save", "home", {
              reason: "홈 첫 화면 배치 변경",
              payload: {
                curation: draft,
                summary: `추천 회사 ${draft.companies.length} · 인기글 ${draft.posts.length} · 배너 ${draft.banners.length}`,
              },
            })
          }
        >
          {dirty ? "변경 저장" : "저장됨"}
        </button>
      </div>

      <div className="curgrid">
        <SlotCard
          title="추천 회사 (홈 상단)"
          mini="노출 순서"
          slots={draft.companies}
          addLabel="회사 추가"
          full={draft.companies.length >= LIMIT.companies}
          onAdd={() => setAdding("companies")}
          onReorder={(from, to) => reorder("companies", from, to)}
          onRemove={(id) => remove("companies", id)}
          logo
        />

        <SlotCard
          title="인기글 고정"
          mini={`최대 ${LIMIT.posts}개`}
          slots={draft.posts}
          addLabel="글 추가"
          full={draft.posts.length >= LIMIT.posts}
          onAdd={() => setAdding("posts")}
          onReorder={(from, to) => reorder("posts", from, to)}
          onRemove={(id) => remove("posts", id)}
        />

        <SlotCard
          title="메인 공지 · 배너"
          slots={draft.banners}
          addLabel="배너 추가"
          full={draft.banners.length >= LIMIT.banners}
          onAdd={() => setAdding("banners")}
          onReorder={(from, to) => reorder("banners", from, to)}
          onRemove={(id) => remove("banners", id)}
        />

        <div className="curcard">
          <h4>
            인기 키워드 제외
            <span className="mini">집계는 자동 · 여기는 차단만</span>
          </h4>
          <div
            style={{
              fontSize: "12.5px",
              color: "var(--ink-3)",
              lineHeight: "1.65",
            }}
          >
            인기 키워드는 검색·조회로 자동 집계돼요 — 운영자가 손댈 건 없어요.
            여기는 부적절한 키워드를 집계에서 제외합니다.
          </div>
          <div style={{ marginTop: 10 }}>
            {draft.blockedKeywords.map((word) => (
              <div className="slot" key={word}>
                <span className="nm">{word}</span>
                <button
                  className="rm"
                  aria-label={`${word} 제외 해제`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      blockedKeywords: draft.blockedKeywords.filter(
                        (item) => item !== word,
                      ),
                    })
                  }
                >
                  <Icon name="x" />
                </button>
              </div>
            ))}
            {draft.blockedKeywords.length === 0 ? (
              <div className="slot">
                <span
                  className="nm"
                  style={{ fontWeight: 600, color: "var(--ink-3)" }}
                >
                  제외 키워드: 없음
                </span>
              </div>
            ) : null}
            <button className="slotadd" onClick={() => setAdding("keyword")}>
              <Icon name="plus" />
              제외 추가
            </button>
          </div>
        </div>
      </div>

      {adding === "companies" || adding === "posts" ? (
        <CurationPicker
          title={adding === "companies" ? "추천 회사 추가" : "인기글 고정 추가"}
          searchPlaceholder={
            adding === "companies" ? "회사명·업종 검색" : "글 제목·게시판 검색"
          }
          emptyNote={
            adding === "companies"
              ? "모든 회사가 이미 배치돼 있어요"
              : "고정할 수 있는 글이 더 없어요"
          }
          items={
            adding === "companies"
              ? COMPANIES.filter(
                  (company) =>
                    !draft.companies.some((slot) => slot.name === company.name),
                ).map((company) => ({
                  value: company.name,
                  title: company.name,
                  sub: `${company.industry} · ${company.region}`,
                  meta: `★ ${company.score.toFixed(1)} · 리뷰 ${company.reviewCount}`,
                  leading: (
                    <CompanyLogo
                      name={company.name}
                      fallback={company.name.slice(0, 1)}
                    />
                  ),
                }))
              : FEED.filter(
                  (item) =>
                    !draft.posts.some((slot) => slot.name === item.title),
                ).map((item) => ({
                  value: item.title,
                  title: item.title,
                  sub: `${BOARD_LABEL[item.board] ?? item.board} · ${item.author}`,
                  meta: `조회 ${item.views.toLocaleString()}`,
                }))
          }
          onPick={(value) => {
            const company =
              adding === "companies"
                ? COMPANIES.find((item) => item.name === value)
                : undefined;
            add(adding, {
              id: `${adding}-${crypto.randomUUID().slice(0, 8)}`,
              name: value,
              meta: company
                ? `${company.score.toFixed(1)} · 리뷰 ${company.reviewCount}`
                : undefined,
            });
            setAdding(null);
          }}
          onClose={() => setAdding(null)}
        />
      ) : adding ? (
        <FormModal
          title={adding === "keyword" ? "제외 키워드 추가" : "배너 추가"}
          sub={
            adding === "keyword"
              ? "이 키워드는 인기 키워드 집계에서 빠져요"
              : "저장을 눌러야 홈에 반영돼요"
          }
          fields={[
            {
              key: "name",
              label: adding === "keyword" ? "키워드" : "이름",
              required: true,
            },
            ...(adding === "banners"
              ? [{ key: "meta", label: "메모", placeholder: "노출중" }]
              : []),
          ]}
          submitLabel="추가"
          onCancel={() => setAdding(null)}
          onSubmit={(values) => {
            if (adding === "keyword") {
              const word = values.name.trim();
              if (word && !draft.blockedKeywords.includes(word)) {
                setDraft({
                  ...draft,
                  blockedKeywords: [...draft.blockedKeywords, word],
                });
              }
            } else {
              add(adding, {
                id: `${adding}-${crypto.randomUUID().slice(0, 8)}`,
                name: values.name.trim(),
                meta: values.meta?.trim() || undefined,
              });
            }
            setAdding(null);
          }}
        />
      ) : null}
    </>
  );
}

function SlotCard({
  title,
  mini,
  slots,
  addLabel,
  full,
  logo,
  onAdd,
  onReorder,
  onRemove,
}: {
  title: string;
  mini?: string;
  slots: Slot[];
  addLabel: string;
  full: boolean;
  logo?: boolean;
  onAdd: () => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}) {
  // 드래그 정렬 — 핸들을 잡으면 행이 포인터를 따라오고 나머지가 비켜난다.
  // 놓는 순간 onReorder로 초안만 바뀐다(저장은 상단 "변경 저장" 버튼 몫).
  const drag = useDragSort(slots.length, onReorder);

  return (
    <div className="curcard">
      <h4>
        {title}
        {mini ? <span className="mini">{mini}</span> : null}
      </h4>

      {slots.map((slot, index) => (
        <div
          className={drag.dragging === index ? "slot is-drag" : "slot"}
          key={slot.id}
          ref={drag.itemRef(index)}
          style={drag.itemStyle(index)}
        >
          <button
            className="ds-draghandle"
            {...drag.handleProps(index)}
            // 훅의 범용 라벨 대신 어느 항목인지까지 읽어 준다(스프레드 뒤라 이긴다)
            aria-label={`${slot.name} 순서 변경 — 드래그 또는 키보드 ↑/↓`}
          >
            <Icon name="grip" />
          </button>
          <span className="num">{index + 1}</span>
          {logo ? (
            <CompanyLogo name={slot.name} fallback={slot.name.slice(0, 1)} />
          ) : null}
          <span className="nm">{slot.name}</span>
          {slot.meta ? <span className="meta">{slot.meta}</span> : null}
          <button
            className="rm"
            aria-label={`${slot.name} 제거`}
            onClick={() => onRemove(slot.id)}
          >
            <Icon name="x" />
          </button>
        </div>
      ))}

      {slots.length === 0 ? (
        <div className="slot">
          <span
            className="nm"
            style={{ fontWeight: 600, color: "var(--ink-3)" }}
          >
            비어 있어요 — 홈에서 이 영역이 보이지 않아요
          </span>
        </div>
      ) : null}

      <button className="slotadd" disabled={full} onClick={onAdd}>
        <Icon name="plus" />
        {full ? "자리가 다 찼어요" : addLabel}
      </button>
    </div>
  );
}
