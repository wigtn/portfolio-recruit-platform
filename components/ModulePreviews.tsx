"use client";

import { AuditTable } from "./admin/AuditTable";
import { PostRow } from "./PostRow";
import { Icon } from "./Icon";
import { PostRowSkeleton, Sk, SkRegion } from "./Skeleton";
import { Select } from "./ds/Select";
import { toast } from "./ds/Toaster";
import { FEED } from "@/lib/seed/feed";
import { useState } from "react";

/**
 * 화면을 가진 모듈의 미리보기.
 *
 * 여기서 새로 그리는 UI는 없다. 그 화면이 쓰는 컴포넌트를 같은 props로 다시
 * 꽂을 뿐이다. 미리보기용 모형을 따로 만들면 실화면과 어긋나는 순간
 * "모듈을 조립했다"는 주장 자체가 거짓이 된다.
 *
 * 이 데모에 실제로 설치된 모듈은 셋뿐이라(ui-kit, content-engine,
 * backoffice-frame) 실물을 보여줄 수 있는 것도 셋이다. 나머지는
 * ModuleMotion이 동작을 그린다.
 */

/** 게시판 미리보기용 피드 상위 3건 */
const FEED_SAMPLE = FEED.slice(0, 3);

/** 콘텐츠 엔진: 커뮤니티 목록과 같은 행 컴포넌트 */
export function ContentPreview() {
  return (
    <div className="posts">
      {FEED_SAMPLE.map((item) => (
        <PostRow key={item.id} item={item} />
      ))}
    </div>
  );
}

/** 백오피스 프레임: 운영 화면이 쓰는 감사 기록 표 그대로 */
export function AdminPreview() {
  return <AuditTable />;
}

/**
 * UI킷: 토큰 위에 세운 공통 표면들.
 *
 * 스켈레톤·토스트·셀렉트는 전부 이 데모의 실제 화면이 쓰는 그 컴포넌트다.
 * 눌러보면 진짜로 토스트가 뜨고 셀렉트가 열린다.
 */
export function UiKitPreview() {
  const [pick, setPick] = useState("라이트");
  return (
    <div className="uikit-prev">
      <div className="uikit-row">
        <Select
          value={pick}
          ariaLabel="테마 선택"
          options={["라이트", "다크", "브랜드"].map((name) => ({
            value: name,
            label: name,
          }))}
          onChange={setPick}
        />
        <button
          type="button"
          className="btn line sm"
          onClick={() =>
            toast(`${pick} 테마로 바꿨어요`, { tone: "success" })
          }
        >
          <Icon name="palette" />
          토스트 띄우기
        </button>
      </div>
      <div className="uikit-swatches" aria-hidden>
        {["--accent", "--ink", "--line", "--card"].map((token) => (
          <span key={token} className="uikit-sw">
            <i style={{ background: `var(${token})` }} />
            {token}
          </span>
        ))}
      </div>
      <SkRegion label="목록">
        <PostRowSkeleton index={0} />
      </SkRegion>
      <div className="uikit-bars" aria-hidden>
        <Sk w="72%" h={13} r={5} />
        <Sk w="54%" h={13} r={5} />
      </div>
    </div>
  );
}
