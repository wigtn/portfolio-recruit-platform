"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

/**
 * 포트폴리오용 광고 슬롯.
 *
 * 처음엔 상담으로, 다음엔 채용공고로 이어 봤지만 어느 쪽도 광고의 약속과
 * 도착지가 맞지 않았다(리뷰 지적: 기획에 없는 동선). 가짜 광고가 진짜
 * 화면으로 이어지는 순간 그 화면의 신뢰까지 같이 깎인다.
 *
 * 그래서 눌리면 정체를 밝힌다 — 데모용 배너고 링크는 없다고. 버튼처럼
 * 생겼는데 아무 반응이 없으면 죽은 링크로 읽히므로, 반응은 하되 정직하게
 * 한다.
 */
export function DemoAdCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="adcard" type="button" onClick={() => setOpen(true)}>
        <div className="adimg c">
          <span className="art" />
          <div className="k">채용 정보</div>
          <div className="h">
            영업직 공고를
            <br />
            한눈에 비교
          </div>
        </div>
        <div className="adbody">
          <span className="adt">포트폴리오용 광고 슬롯 데모</span>
          <span className="adgo">보기</span>
        </div>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="modalwrap"
              role="dialog"
              aria-modal="true"
              aria-label="광고 슬롯 안내"
              onClick={() => setOpen(false)}
            >
              <div className="modal" onClick={(event) => event.stopPropagation()}>
                <h3>데모용 광고 배너입니다</h3>
                <div className="msub">
                  광고 지면이 이렇게 붙는다는 걸 보여주는 자리예요. 링크는
                  연결하지 않았어요.
                </div>
                <button
                  className="btn primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setOpen(false)}
                >
                  확인
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
