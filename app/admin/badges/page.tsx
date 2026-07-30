import { EvidenceReview } from "@/components/admin/EvidenceReview";
import { Icon } from "@/components/Icon";

export const metadata = { title: "증빙 검토 | 백오피스" };

/**
 * 시안 정본 13번(증빙 검토).
 * 승인·반려는 중위험이라 재인증을 요구하지 않는다 — 대신 반려 사유가 신청자에게 그대로 간다.
 */
/* 보유 수는 회원 시드 규모(총 6명)와 모순되지 않게 — 화면끼리 숫자가
   갈라지면 안 된다(회원 관리의 등급 분포와 맞춘 값). */
const BADGES = [
  { icon: "check", name: "첫 리뷰", desc: "회사 리뷰 1건", count: "4" },
  { icon: "award", name: "인증왕", desc: "실적 인증 5회", count: "2" },
  { icon: "comment", name: "답변 100+", desc: "채택 답변 100회", count: "1" },
  { icon: "gauge", name: "필드리더", desc: "받은 도움 1,000+", count: "2" },
];

export default function BadgesPage() {
  return (
    <>
      <EvidenceReview />

      <div className="tablecard" style={{ marginTop: "16px" }}>
        <div className="tabletop">
          <h4>배지 종류</h4>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: "var(--ink-3)",
            }}
          >
            활동 기준 충족 시 자동 부여 (검토 불필요)
          </span>
        </div>
        <div className="badgegrid is-badges" style={{ padding: "16px" }}>
          {BADGES.map((badge, index) => (
            /* 유저 등급 사다리와 같은 카드 문법 — 티어 램프 칩을 공유한다 */
            <div className={`bcard is-l${index + 1}`} key={badge.name}>
              <div className="bi">
                <Icon name={badge.icon} />
              </div>
              <div className="bn">{badge.name}</div>
              <div className="bd">{badge.desc}</div>
              <div className="bc">
                보유 <b>{badge.count}</b>명
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
