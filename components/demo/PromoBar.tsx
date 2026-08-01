"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { CuratedPromo } from "./CuratedPromo";

/**
 * 상단 띠 — WIGTN이 방문자에게 하는 말.
 *
 * 닫을 수 있어야 한다. 이건 우리가 걸고 싶은 말이지 방문자가 요청한 것이
 * 아니고, 화면 맨 위에 고정으로 붙어 매 화면 따라다닌다. 닫는 길이 없으면
 * 광고가 아니라 UI 결함으로 읽힌다.
 *
 * 기억은 이 브라우저에만 남긴다. 데모라 계정에 붙일 자리가 없다.
 */
const DISMISS_KEY = "wigtn-promobar-closed-v1";

export function PromoBar() {
  /* 첫 페인트는 열린 상태로 둔다. localStorage는 서버에서 못 읽으므로
     닫힌 상태로 시작하면 SSR과 어긋나 깜빡인다 — 읽은 뒤에 닫는다 */
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY)) setClosed(true);
  }, []);

  if (closed) return null;

  return (
    <div className="promobar">
      {/* 문구는 화면 정가운데, CTA는 오른쪽 끝. 가운데 칸을 따로 둬야
          버튼 폭이 문구 위치를 밀지 않는다. */}
      <span aria-hidden />
      <CuratedPromo />
      <div className="promo-act">
        <Link className="rbtn" href="/contact">
          <span className="promo-cta-wide">상담 요청</span>
          <span className="promo-cta-mobile">상담</span>
          <Icon name="arrow" />
        </Link>
        <button
          className="promo-x"
          type="button"
          aria-label="상단 안내 닫기"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "1");
            setClosed(true);
          }}
        >
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
