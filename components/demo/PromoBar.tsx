"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { loadState, subscribeState } from "@/lib/admin/overlay";
import { seed, type Slot } from "@/lib/admin/seed";

/**
 * 상단 띠 — 서비스의 이벤트 배너. 내용은 백오피스 큐레이션(상단 이벤트
 * 배너)의 **첫 번째 슬롯**이 정한다.
 *
 * 원래는 WIGTN이 방문자에게 하는 말("전부 실제로 동작해요")이었는데, 그
 * 역할은 가이드 코치 말풍선이 이미 하고 있고 CTA(1:1 문의)와도 목소리가
 * 어긋났다(리뷰 지적). 이 자리는 픽션 안 이벤트로 돌리고, 운영자가
 * 큐레이션에서 순서를 바꿔 저장하면 띠가 갈리는 왕복 데모를 겸한다.
 *
 * 닫을 수 있어야 한다 — 매 화면 따라다니는 고정 띠라 닫는 길이 없으면
 * 광고가 아니라 UI 결함으로 읽힌다. 다만 기억은 배너 **내용 서명**으로
 * 남긴다: 운영자가 배너를 갈면 새 이벤트이므로 다시 보인다.
 */
const DISMISS_KEY = "wigtn-promobar-closed-v2";

/** 닫음 기억용 서명 — 같은 배너인지의 기준은 자리(id)가 아니라 내용이다 */
const sigOf = (banner: Slot) => `${banner.id}:${banner.name}`;

export function PromoBar() {
  /* 첫 페인트는 시드 배너로 그린다. 오버레이는 localStorage라 서버가 못
     읽는다 — 시드로 시작해야 SSR과 첫 클라이언트 렌더가 어긋나지 않고,
     실제 오버레이 값과 닫음 기억은 마운트 뒤에 덮는다 */
  const [banner, setBanner] = useState<Slot | null>(
    seed.curation.banners[0] ?? null,
  );
  const [closedSig, setClosedSig] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setBanner(loadState().curation.banners[0] ?? null);
    sync();
    setClosedSig(window.localStorage.getItem(DISMISS_KEY));
    return subscribeState(sync);
  }, []);

  // 운영자가 배너를 전부 내리면 띠도 내려간다 — 빈 띠를 세워두지 않는다
  if (!banner || closedSig === sigOf(banner)) return null;

  const href = banner.meta?.startsWith("/") ? banner.meta : null;

  return (
    <div className="promobar">
      {/* 문구는 화면 정가운데, CTA는 오른쪽 끝. 가운데 칸을 따로 둬야
          버튼 폭이 문구 위치를 밀지 않는다. */}
      <span aria-hidden />
      <span className="promo-line">
        <i className="promo-tag" aria-hidden>
          EVENT
        </i>
        <span className="promo-wide">
          <b>{banner.name}</b>
        </span>
        <span className="promo-mobile">
          <b>{banner.name}</b>
        </span>
      </span>
      <div className="promo-act">
        {href ? (
          <Link className="rbtn" href={href}>
            <span className="promo-cta-wide">자세히 보기</span>
            <span className="promo-cta-mobile">보기</span>
            <Icon name="arrow" />
          </Link>
        ) : null}
        <button
          className="promo-x"
          type="button"
          aria-label="상단 배너 닫기"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, sigOf(banner));
            setClosedSig(sigOf(banner));
          }}
        >
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
