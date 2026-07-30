import { Icon } from "@/components/Icon";
import { Sk } from "@/components/Skeleton";
import { seed, type PolicyRow } from "@/lib/admin/seed";

/**
 * 권한 정책 화면의 정적부 — 역할·그룹 메타, 스켈레톤 미러, 하단 재인증 표.
 *
 * "use client" 없는 모듈로 뺀 이유:
 * ① PolicyMatrix(클라이언트)가 실데이터·스켈레톤 양쪽 분기에서 같은 메타로 그리고
 * ② 라우트 loading.tsx(서버)도 같은 미러를 그린다 — 구조·라벨이 곧 자리 예약이라
 * 스켈레톤→실물 전환에서 1px도 안 움직인다.
 */

/**
 * 역할 메타 — PolicyRow.grants 배열 인덱스와 같은 순서다(게스트→최고 운영자).
 * note는 P1 문법의 헤더 안내 줄: 잠긴 역할은 "왜 못 바꾸는지"를 여기서 먼저 말한다.
 */
export const POLICY_ROLES = [
  {
    name: "게스트",
    sub: "비로그인",
    icon: "user",
    note: "게스트는 열람만 할 수 있어요. 나머지 권한은 잠겨 있어요",
  },
  {
    name: "회원",
    sub: "영업인",
    icon: "users",
    note: "이 역할이 할 수 있는 일을 켜고 끄세요",
  },
  {
    name: "운영자",
    sub: "admin",
    icon: "shield",
    note: "이 역할이 할 수 있는 일을 켜고 끄세요",
  },
  {
    name: "최고 운영자",
    sub: "super admin",
    icon: "key",
    note: "최고 운영자는 모든 권한을 가져요. 여기서 뺄 수 없어요",
  },
] as const;

/**
 * 권한 그룹 — P1 문법(그룹 카드 + 켜짐 개수). 시드에는 그룹이 없어 화면이
 * 정의한다. id 참조라 시드 순서가 바뀌어도 그룹이 안 깨진다.
 */
export const POLICY_GROUPS = [
  { name: "참여 · 열람", icon: "book-open", ids: ["pl-1", "pl-2", "pl-3"] },
  { name: "운영 조치", icon: "gauge", ids: ["pl-4", "pl-5", "pl-6"] },
  {
    name: "콘텐츠 · 데이터",
    icon: "building",
    ids: ["pl-7", "pl-9", "pl-10"],
  },
  { name: "보호 · 정책", icon: "cog", ids: ["pl-8", "pl-11"] },
] as const;

/** 권한 키별 아이콘 — P1 PERM_ICON 대응. 잠긴 행은 렌더 쪽에서 lock으로 바꾼다 */
export const POLICY_PERM_ICON: Record<string, string> = {
  "pl-1": "view",
  "pl-2": "comment",
  "pl-3": "star",
  "pl-4": "eyeoff",
  "pl-5": "users",
  "pl-6": "doc",
  "pl-7": "building",
  "pl-8": "shield",
  "pl-9": "bot",
  "pl-10": "notice",
  "pl-11": "key",
};

export const policyPermIconOf = (row: PolicyRow) =>
  row.locked ? "lock" : (POLICY_PERM_ICON[row.id] ?? "shield");

/** 하단 각주 — 실물·스켈레톤이 같은 문장을 그린다(자리 예약 = 실물 그대로) */
export const POLICY_FOOT_NOTE =
  "익명 리뷰 작성자 조회는 화면에서 열 수 없어요. 권한 변경은 저장할 때 본인 확인을 한 번 더 해요";

/** 토글 실측 크기 — .ptog(32×18)와 스켈레톤 자리가 같아야 행 높이가 안 튄다 */
const TOGGLE_W = 32;
const TOGGLE_H = 18;

/**
 * 역할별 권한 스켈레톤 미러 — 구조·라벨은 전부 정적(시드)이라 실물 마크업
 * 그대로 내고, 데이터(토글 on/off·켜짐 개수) 자리만 shimmer로 채운다.
 * 초기 선택은 실물과 같은 첫 역할(게스트)이다.
 */
export function PolicyMatrixSk() {
  const first = POLICY_ROLES[0];
  return (
    <div className="polgrid" aria-hidden>
      <div className="polroles">
        {POLICY_ROLES.map((role, index) => (
          <button
            key={role.name}
            type="button"
            tabIndex={-1}
            className={index === 0 ? "polrole on" : "polrole"}
          >
            <Icon name={role.icon} />
            <span className="prname">{role.name}</span>
          </button>
        ))}
      </div>

      <div className="polcard">
        <div className="polhead">
          <span className="ric">
            <Icon name={first.icon} />
          </span>
          <div className="pht">
            <b>
              {first.name} <span>{first.sub}</span>
            </b>
            <span className="psub">{first.note}</span>
          </div>
          <button className="btn line sm polsave" disabled>
            저장
          </button>
        </div>
        <div className="polbody">
          <div className="polcols">
            {POLICY_GROUPS.map((group) => (
              <section className="polgroup" key={group.name}>
                <p className="pgh">
                  <Icon name={group.icon} /> {group.name}
                  <span className="pcount">
                    <Sk w={24} h={11} />
                  </span>
                </p>
                <div className="pgrows">
                  {group.ids.map((id) => {
                    const row = seed.policy.find((item) => item.id === id);
                    if (!row) return null;
                    return (
                      <div className="polrow" key={id}>
                        <span className="plab">
                          <Icon name={policyPermIconOf(row)} />
                          <span className="plt">{row.label}</span>
                        </span>
                        <Sk w={TOGGLE_W} h={TOGGLE_H} r={99} />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <p className="polfoot">
            <Icon name="lock" /> {POLICY_FOOT_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}

const RISK_TABLE = [
  { work: "콘텐츠 블라인드 · 삭제", risk: "hi", label: "높음", auth: true },
  { work: "회원 정지 · 해제", risk: "hi", label: "높음", auth: true },
  { work: "중복 회사 병합", risk: "hi", label: "높음", auth: true },
  { work: "권한 정책 변경", risk: "hi", label: "높음", auth: true },
  { work: "AI 안전 장치 끄기", risk: "hi", label: "높음", auth: true },
  { work: "익명 리뷰 작성자 조회", risk: "hi", label: "높음", auth: true },
  { work: "증빙 승인 · 반려", risk: "mid", label: "중간", auth: false },
  { work: "신고 반려 · 문서 내리기", risk: "mid", label: "중간", auth: false },
  { work: "회사 등록 · 큐레이션", risk: "lo", label: "낮음", auth: false },
];

export function PolicyRiskSection() {
  return (
    <div className="dashgrid" style={{ marginBottom: "0" }}>
      <div className="tablecard" style={{ gridColumn: "1 / -1" }}>
        <div className="tabletop">
          <h4>민감 작업 보호: 재인증</h4>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: "var(--ink-3)",
            }}
          >
            위험도는 시스템이 자동 판정해요. 화면에서 바꿀 수 없어요
          </span>
        </div>
        {/* 이 표의 의미 — 되돌리기 어려운 조치는 버튼을 눌러도 바로 실행되지
            않고, 본인 확인(재인증)을 한 번 더 통과해야 실행된다. 세션 탈취·
            자리 비움 오조작을 막는 백오피스 표준 장치다. */}
        <p className="riskintro">
          되돌리기 어려운 작업은 실행 직전에 <b>본인 확인을 한 번 더</b> 거쳐요.
          자리를 비운 사이 남이 조작하거나, 실수로 누르는 사고를 막는 장치예요 -
          아래 표가 그 대상과 기록 방식이에요.
        </p>
        <table className="dtable">
          <thead>
            <tr>
              <th>작업</th>
              <th>위험도</th>
              <th>재인증</th>
              <th>기록</th>
            </tr>
          </thead>
          <tbody>
            {RISK_TABLE.map((item) => (
              <tr key={item.work}>
                <td>{item.work}</td>
                <td>
                  <span className={`risk ${item.risk}`}>
                    <span className="d" />
                    {item.label}
                  </span>
                </td>
                <td>
                  <span className={item.auth ? "bs ok" : "bs neu"}>
                    {item.auth ? "필요" : "불필요"}
                  </span>
                </td>
                <td>{item.auth ? "사유 필수" : "자동 기록"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
