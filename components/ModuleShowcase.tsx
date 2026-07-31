"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { AdminPreview, ContentPreview, UiKitPreview } from "./ModulePreviews";
import {
  AiMotion,
  AuthMotion,
  ContractsMotion,
  NotifyMotion,
} from "./ModuleMotion";

/**
 * 모듈 쇼케이스.
 *
 * 이 자리가 파는 것은 이 데모의 기능이 아니라 **재사용되는 코어 모듈**이다.
 * "회사 리뷰"나 "채용공고"는 이번 도메인에서 그렇게 불렸을 뿐이고, 다음
 * 프로젝트에서는 다른 이름을 달고 나간다. 그래서 카드가 말하는 이름은 전부
 * 모듈 매니페스트의 이름이고, 도메인 어휘는 "이 데모에서는" 뒤로 물린다.
 *
 * 화면을 가진 모듈(ui-kit, content-engine, backoffice-frame)은 실물을 그대로
 * 렌더한다. 표면이 없는 기능 모듈은 동작을 애니메이션으로 그린다. 글머리표만
 * 늘어놓으면 무엇을 해주는지 읽는 사람이 머릿속에서 재구성해야 한다.
 *
 * 배치는 세로로 길게 간다. 좁은 카드 여덟 개를 격자에 욱여넣으면 어느 것도
 * 제대로 안 보인다. 한 화면에 모듈 하나씩, 스크롤이 내려갈 때마다 왼쪽/오른쪽이
 * 바뀌며 등장한다.
 */

type Module = {
  id: string;
  /** 매니페스트 name */
  pkg: string;
  /** 매니페스트 title */
  title: string;
  icon: string;
  hue: number;
  /** 이 모듈이 해결하는 것, 한 문장 */
  lead: string;
  /** 핵심 역량 */
  points: string[];
  /** 이 모듈이 올라타는 다른 모듈 */
  requires: string[];
  /** 이번 도메인에서 어떻게 불렸는지 */
  asHere: string;
  /** 이 데모에서 확인할 화면 */
  href: string;
  /** 실물 UI를 가진 모듈인지 */
  live: boolean;
  render: () => React.ReactNode;
};

const MODULES: Module[] = [
  {
    id: "ui-kit",
    pkg: "@wigtn/ui-kit",
    title: "화면 톤을 한 번에 갈아끼웁니다",
    icon: "palette",
    hue: 12,
    lead: "브랜드 색을 바꾸려고 화면을 하나씩 열어보지 않으셔도 됩니다. 색과 서체를 한 곳에서 정하면 전 화면이 같이 따라옵니다.",
    points: [
      "밝은 화면과 어두운 화면이 한 벌로 같이 맞춰집니다",
      "입력 폼은 받을 항목만 정해주시면 화면이 알아서 그려집니다",
      "버튼과 팝업, 로딩 모양이 화면마다 제각각 되지 않습니다",
    ],
    requires: [],
    asHere: "지금 보고 계신 모든 화면이 이 위에 올라가 있습니다.",
    href: "/",
    live: true,
    render: () => <UiKitPreview />,
  },
  {
    id: "api-contracts",
    pkg: "@wigtn/api-contracts",
    title: "연동이 조용히 깨지지 않습니다",
    icon: "shield",
    hue: 200,
    lead: "붙는 서비스가 늘수록 주고받는 데이터 모양이 조금씩 어긋나고, 그게 몇 달 뒤 장애로 돌아옵니다. 규격을 미리 정해두고 어긋난 요청은 앞단에서 막습니다.",
    points: [
      "설정값이 하나라도 비어 있으면 서비스가 뜨기 전에 멈춥니다",
      "문제가 생겼을 때 어디서 어긋났는지 바로 짚입니다",
      "새 시스템을 붙일 때 규격을 처음부터 다시 맞추지 않습니다",
    ],
    requires: [],
    asHere: "상담 접수가 그 예입니다. 보낼 곳이 준비되지 않으면 접수된 척하지 않고 실패를 그대로 알립니다.",
    href: "/contact",
    live: false,
    render: () => <ContractsMotion />,
  },
  {
    id: "auth-membership",
    pkg: "@wigtn/auth-membership",
    title: "누가 어디까지 볼지 한 곳에서 정합니다",
    icon: "key",
    hue: 252,
    lead: "권한 판단이 화면마다 흩어지면 나중에는 아무도 전체 그림을 모릅니다. 등급과 권한을 한 군데 모아두고 화면은 그 결과만 받습니다.",
    points: [
      "가입부터 서류 승인, 등급 부여까지 흐름이 이미 들어 있습니다",
      "잠긴 화면을 감추지 않고 잠겼다고 보여줘 가입할 이유를 만듭니다",
      "등급 기준이 바뀌어도 고칠 곳은 한 군데뿐입니다",
    ],
    requires: ["api-contracts", "ui-kit"],
    asHere: "오른쪽 위에서 계정을 바꿔보시면 잠겨 있던 리뷰가 그 자리에서 열립니다.",
    href: "/companies",
    live: false,
    render: () => <AuthMotion />,
  },
  {
    id: "content-engine",
    pkg: "@wigtn/content-engine",
    title: "글이 오가는 자리를 통째로 가져옵니다",
    icon: "comment",
    hue: 217,
    lead: "게시판은 어느 서비스나 비슷하게 생겼는데 매번 처음부터 만듭니다. 목록과 작성, 댓글, 신고까지 한 벌로 넣고 게시판 종류만 늘립니다.",
    points: [
      "공지와 질문, 후기 같은 게시판을 설정만으로 늘립니다",
      "신고가 들어오면 운영자 화면에 곧바로 쌓입니다",
      "목록은 페이지로 넘기는 방식과 계속 이어지는 방식 둘 다 됩니다",
    ],
    requires: ["api-contracts", "auth-membership"],
    asHere: "커뮤니티가 이 모듈이고, 채용공고 목록도 같은 엔진 위에 있습니다.",
    href: "/community",
    live: true,
    render: () => <ContentPreview />,
  },
  {
    id: "ai-pipeline-sdk",
    pkg: "@wigtn/ai-pipeline-sdk",
    title: "AI가 쓴 문장을 그대로 올리지 않습니다",
    icon: "bot",
    hue: 276,
    lead: "AI를 붙이는 건 어렵지 않습니다. 사고는 그다음에 납니다. 생성한 문장을 한 번 더 훑어 실명이나 확인되지 않은 숫자를 걸러낸 뒤에 올립니다.",
    points: [
      "위험한 표현을 지워버리는 게 아니라 자연스러운 말로 바꿉니다",
      "얼마나 엄격하게 볼지 운영자가 화면에서 조절합니다",
      "비용이 걱정되는 만큼 호출 한도를 미리 걸어둡니다",
    ],
    requires: ["api-contracts"],
    asHere: "커뮤니티 글에서 답변을 생성해보시면 검사와 교정 과정이 그대로 보입니다.",
    href: "/community/p-4821",
    live: false,
    render: () => <AiMotion />,
  },
  {
    id: "notification-file",
    pkg: "@wigtn/notification-file",
    title: "처리 결과가 사용자에게 돌아갑니다",
    icon: "bell",
    hue: 340,
    lead: "신고를 했는데 아무 소식이 없으면 처리하지 않은 것과 같습니다. 결과가 메일과 앱 알림으로 되돌아가게 미리 배선해 둡니다.",
    points: [
      "누구에게 어느 경로로 보낼지 규칙으로 정해두면 알아서 갈라집니다",
      "메일이 실패해도 다른 경로로 넘겨 접수를 잃지 않습니다",
      "첨부 파일은 서버를 거치지 않아 용량이 커도 부담이 없습니다",
    ],
    requires: ["api-contracts"],
    asHere: "신고한 글이 운영자 손을 거치면 알림으로 돌아옵니다.",
    href: "/my",
    live: false,
    render: () => <NotifyMotion />,
  },
  {
    id: "backoffice-frame",
    pkg: "@wigtn/backoffice-frame",
    title: "운영자가 쓸 화면이 처음부터 있습니다",
    icon: "gauge",
    hue: 152,
    lead: "서비스는 만들어도 관리자 화면은 늘 뒤로 밀립니다. 열어보면 엑셀로 관리하고 계신 이유가 그것입니다. 권한과 기록이 붙은 운영 화면을 함께 드립니다.",
    points: [
      "누가 언제 무엇을 했는지 지울 수 없는 기록으로 남습니다",
      "되돌리기 어려운 작업은 실행 전에 한 번 더 확인합니다",
      "표와 검색, 정렬, 내려받기를 화면마다 다시 만들지 않습니다",
    ],
    requires: ["api-contracts", "auth-membership", "ui-kit"],
    asHere: "백오피스 전체가 이 모듈이고, 거기서 한 조치가 사용자 화면에 그대로 나타납니다.",
    href: "/admin/audit",
    live: true,
    render: () => <AdminPreview />,
  },
];

/** 스크롤로 들어올 때 한 번만 살아나는 블록 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, seen };
}

/**
 * 모듈 한 칸.
 *
 * 실물 UI를 가진 모듈은 무겁다(오버레이 구독·목 로딩·표 가상화). 화면에
 * 들어오기 전에는 만들지 않는다. 애니메이션 쪽은 CSS라 그냥 둔다.
 */
function ModuleBlock({ module, index }: { module: Module; index: number }) {
  const { ref, seen } = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`modrow${seen ? " is-in" : ""}${index % 2 ? " is-flip" : ""}`}
      style={{ "--hue": module.hue } as React.CSSProperties}
    >
      {/* 챗봇의 show_module 도구가 이 표식으로 자리를 찾는다 */}
      <div className="modrow-copy" data-module={module.id}>
        <span className="modrow-no">{String(index + 1).padStart(2, "0")}</span>
        <span className="modrow-ic">
          <Icon name={module.icon} />
        </span>
        <code className="modrow-pkg">{module.pkg}</code>
        <h3>{module.title}</h3>
        <p className="modrow-lead">{module.lead}</p>

        <ul className="modrow-points">
          {module.points.map((point, order) => (
            <li key={point} style={{ "--i": order } as React.CSSProperties}>
              <Icon name="check" />
              {point}
            </li>
          ))}
        </ul>

        <div className="modrow-meta">
          {module.requires.length ? (
            <span className="modrow-dep">
              <Icon name="link" />
              {module.requires.join(", ")} 위에 섭니다
            </span>
          ) : (
            <span className="modrow-dep is-base">
              <Icon name="layout" />
              의존 없는 바닥 모듈
            </span>
          )}
        </div>

        <p className="modrow-here">
          <b>이 데모에서는</b> {module.asHere}
        </p>
      </div>

      <div className="modrow-view">
        <span className={module.live ? "modrow-tag is-live" : "modrow-tag"}>
          {module.live ? "지금 실제로 동작 중" : "동작 방식"}
        </span>
        <div className={module.live ? "modrow-stage is-live" : "modrow-stage"}>
          {module.live ? (
            seen ? (
              module.render()
            ) : (
              <div className="modrow-hold" aria-hidden />
            )
          ) : (
            module.render()
          )}
        </div>
      </div>
    </section>
  );
}

export function ModuleShowcase() {
  const { ref, seen } = useReveal<HTMLDivElement>();
  const live = MODULES.filter((module) => module.live).length;

  return (
    <div className="modshow">
      <div className={seen ? "modshow-hd is-in" : "modshow-hd"} ref={ref}>
        <span className="modshow-kicker">
          <Icon name="check" />
          WIGTN 방식
        </span>
        <h2>
          지금 보신 화면은 <em>모듈 {MODULES.length}개</em>를 조립한 것입니다
        </h2>
        <p>
          영업 커리어 서비스처럼 보이지만, 안에 들어간 것은 업종과 상관없는
          부품입니다. 같은 부품으로 쇼핑몰도 만들고 사내 시스템도 만듭니다.
          이미 다른 프로젝트에서 검증을 마쳤기 때문에, 새로 만드는 것보다 훨씬
          빨리 그리고 덜 위험하게 갑니다.
        </p>
        <div className="modshow-nums">
          <span>
            <b>{MODULES.length}</b>개 부품으로 조립
          </span>
          <span>
            <b>{live}</b>개는 아래에서 직접 만져보실 수 있어요
          </span>
          <span>필요한 것만 골라 담습니다</span>
        </div>
      </div>

      <div className="modrows">
        {MODULES.map((module, index) => (
          <ModuleBlock key={module.id} module={module} index={index} />
        ))}
      </div>

      <div className="modshow-close">
        <h3>필요한 것만 고르시면 됩니다</h3>
        <p>
          전부 다 넣을 필요가 없습니다. 어떤 화면이 필요한지 말씀해주시면 어떤
          모듈이 들어가고 얼마나 걸리는지 아래에서 정리해 보내드립니다.
        </p>
        <span className="modshow-arrow" aria-hidden>
          <Icon name="down" />
        </span>
      </div>
    </div>
  );
}
