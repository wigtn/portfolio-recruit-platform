"use client";

import { useState } from "react";
import { Select } from "./ds/Select";
import {
  SALES_AXES,
  type Company,
  type SalesAxisKey,
} from "@/lib/seed/companies";
import type { Review } from "@/lib/seed/reviews";
import { useRole } from "@/lib/demo/role";
import { markProgress } from "@/lib/demo/progress";
import { RoleModal } from "./demo/RoleModal";
import { Icon } from "./Icon";
import { toast } from "./ds/Toaster";
import { Coach } from "./Coach";

/**
 * 리뷰 작성 — 시안 정본 07번 `.formgrid`(.formcard / 사이드) 구조 그대로.
 *
 * 별점은 .ratepick > .starpick > svg.icf(.on) 계약. 익명 계약상 제출물에 작성자 식별자를 담지
 * 않고, 체험 입력은 서버에 기록하지 않는다(r4 변경 9번 — DB 신규 행 0).
 *
 * 제출은 연출이 아니다: 이 브라우저(localStorage)에 실제로 저장되고, 회사 상세
 * 리뷰 목록 맨 위에 내 리뷰가 나타나며 평균 별점도 다시 계산된다 — 코치마크가
 * 약속한 "회사 평균에 바로 반영"을 화면이 실제로 지킨다.
 */

const KEY = "wigtn-demo-my-reviews-v1";

/** 체험 중 쓴 리뷰 — 시드 Review와 같은 모양이라 ReviewCard를 그대로 쓴다 */

const TENURES = [
  "현재 재직 중",
  "2026년 상반기까지 근무",
  "2025년",
  "2024년",
  "2023년 이전",
];

/** 직무 갈래 — 영업 조직의 실제 분화. 리뷰 축과 같은 언어를 쓴다 */
const JOBS = ["영업", "영업관리", "기술영업", "해외영업", "영업기획"];

const YEARS = ["1~3년차", "4~7년차", "8년차 이상"];
export function loadMyReviews(companySlug?: string): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    const rows = Array.isArray(parsed) ? (parsed as Review[]) : [];
    return companySlug
      ? rows.filter((row) => row.companySlug === companySlug)
      : rows;
  } catch {
    window.localStorage.removeItem(KEY);
    return [];
  }
}

/** 권한 매트릭스 pl-3 조건("회사당 1건") — 같은 회사에 다시 쓰면 교체한다 */
function saveMyReview(review: Review) {
  if (typeof window === "undefined") return;
  const rest = loadMyReviews().filter(
    (row) => row.companySlug !== review.companySlug,
  );
  window.localStorage.setItem(KEY, JSON.stringify([review, ...rest]));
}

/** 내 리뷰를 얹은 재계산 평균 — 회사 상세 표시와 완료 화면이 같은 식을 쓴다 */
export function scoreWithMine(company: Company, mine: Review[]) {
  const total =
    company.score * company.reviewCount +
    mine.reduce((sum, review) => sum + review.score, 0);
  return total / (company.reviewCount + mine.length);
}

export function ReviewComposer({ company }: { company: Company }) {
  const { role } = useRole();
  const [tenure, setTenure] = useState(TENURES[0]);
  const [axes, setAxes] = useState<Partial<Record<SalesAxisKey, number>>>({});
  const [headline, setHeadline] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [employment, setEmployment] = useState<"현직원" | "전직원">("현직원");
  const [job, setJob] = useState(JOBS[0]);
  const [years, setYears] = useState(YEARS[0]);
  const [submitted, setSubmitted] = useState<Review | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  const missing = SALES_AXES.filter((axis) => !axes[axis.key]);

  function submit() {
    // 권한 매트릭스 pl-3: 게스트는 리뷰 작성 불가 — 실행 대신 로그인으로 유도한다
    if (role === "guest") {
      toast("지금은 게스트로 보고 있어요, 리뷰는 로그인해야 남길 수 있어요.", {
        tone: "warn",
      });
      setGateOpen(true);
      return;
    }
    if (missing.length > 0) {
      toast(
        `${missing.map((axis) => axis.label).join(", ")} 별점을 매겨주세요.`,
        { tone: "warn" },
      );
      return;
    }
    // *가 붙은 필드는 실제로 검증한다 — 빈 리뷰가 등록되면 필수 표시가 거짓이 된다
    if (!headline.trim() || !pros.trim() || !cons.trim()) {
      toast("한줄 총평, 장점, 단점을 모두 적어주세요.", { tone: "warn" });
      return;
    }

    const now = new Date();
    const score =
      Math.round(
        (SALES_AXES.reduce((sum, axis) => sum + (axes[axis.key] ?? 0), 0) /
          SALES_AXES.length) *
          10,
      ) / 10;
    const review: Review = {
      id: `myrev-${company.slug}`,
      companySlug: company.slug,
      headline: headline.trim(),
      score,
      pros: pros.trim(),
      cons: cons.trim(),
      employment,
      // 데모 페르소나(김영업 · 4년차)와 맞춘다 — 연차 입력은 받지 않는다
      years: 4,
      writtenAt: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`,
      helpful: 0,
    };
    saveMyReview(review);
    markProgress("company-review");
    setSubmitted(review);
  }

  if (submitted) {
    const average = scoreWithMine(company, [submitted]);
    return (
      <div className="formcard">
        <h2
          style={{
            fontSize: 20,
            fontWeight: 850,
            letterSpacing: "-.03em",
            marginBottom: 6,
          }}
        >
          리뷰가 익명으로 등록되었습니다.
        </h2>
        <p
          style={{
            fontSize: "13.5px",
            color: "var(--ink-3)",
            marginBottom: 18,
          }}
        >
          매긴 별점 <b>{submitted.score.toFixed(1)}</b>이 반영돼 {company.name}{" "}
          평균이 <b>{average.toFixed(1)}</b>이 됐어요, 회사 상세 리뷰 맨 위에서
          내 리뷰를 볼 수 있어요.
          <br />
          체험용이라 이 브라우저에만 남아요.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="btn primary" href={`/companies/${company.slug}`}>
            내 리뷰 확인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      className="formgrid"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="formcard">
        <div className="field">
          <label>
            항목별 평가<span className="req">*</span>
          </label>

          <Coach id="review-average">
            별점 5개만 매기면 끝, 제출하면{" "}
            <b>회사 평균이 그 자리에서 재계산</b>돼요
          </Coach>

          {SALES_AXES.map((axis) => (
            <div className="ratepick" key={axis.key}>
              <span className="k">{axis.label}</span>
              <span className="starpick">
                {[1, 2, 3, 4, 5].map((value) => (
                  <svg
                    key={value}
                    className={
                      (axes[axis.key] ?? 0) >= value ? "icf on" : "icf"
                    }
                    role="button"
                    aria-label={`${axis.label} ${value}점`}
                    onClick={() =>
                      setAxes((prev) => ({ ...prev, [axis.key]: value }))
                    }
                  >
                    <use href="#i-star" />
                  </svg>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className="field">
          <label>
            한줄 총평<span className="req">*</span>
          </label>
          <input
            className="in"
            value={headline}
            placeholder="예: 인센티브 구조가 투명하고 코칭이 확실해요"
            onChange={(event) => setHeadline(event.target.value)}
          />
        </div>
        <div className="field">
          <label>
            장점<span className="req">*</span>
          </label>
          <textarea
            className="in"
            value={pros}
            placeholder="좋았던 점을 구체적으로"
            onChange={(event) => setPros(event.target.value)}
          />
        </div>
        <div className="field">
          <label>
            단점<span className="req">*</span>
          </label>
          <textarea
            className="in"
            value={cons}
            placeholder="아쉬웠던 점을 구체적으로"
            onChange={(event) => setCons(event.target.value)}
          />
        </div>

        <div className="formactions">
          <a className="btn line" href={`/companies/${company.slug}`}>
            취소
          </a>
          <button className="btn primary" type="submit">
            리뷰 등록
          </button>
        </div>
      </div>

      {/* 사이드 — 스크롤을 따라온다(별점·본문을 오가는 동안 조건이 시야에) */}
      <div className="wside">
        <div className="card tipcard">
          <div className="tiphd">
            <span className="tipic">
              <Icon name="user" />
            </span>
            <h4>작성자 조건</h4>
          </div>

          <label className="sidelabel">재직 상태</label>
          <div className="checkrow" style={{ marginBottom: 14 }}>
            {(["현직원", "전직원"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={employment === option ? "checkitem on" : "checkitem"}
                onClick={() => setEmployment(option)}
              >
                {employment === option ? (
                  <span className="bx">
                    <Icon name="check" />
                  </span>
                ) : null}
                {option}
              </button>
            ))}
          </div>

          <label className="sidelabel">직무</label>
          <div className="checkrow wrap" style={{ marginBottom: 14 }}>
            {JOBS.map((option) => (
              <button
                key={option}
                type="button"
                className={job === option ? "checkitem on" : "checkitem"}
                onClick={() => setJob(option)}
              >
                {job === option ? (
                  <span className="bx">
                    <Icon name="check" />
                  </span>
                ) : null}
                {option}
              </button>
            ))}
          </div>

          <label className="sidelabel">연차</label>
          <div className="checkrow" style={{ marginBottom: 14 }}>
            {YEARS.map((option) => (
              <button
                key={option}
                type="button"
                className={years === option ? "checkitem on" : "checkitem"}
                onClick={() => setYears(option)}
              >
                {years === option ? (
                  <span className="bx">
                    <Icon name="check" />
                  </span>
                ) : null}
                {option}
              </button>
            ))}
          </div>

          <label className="sidelabel">근무 시점</label>
          <Select
            value={tenure}
            onChange={setTenure}
            options={TENURES.map((item) => ({ value: item, label: item }))}
            ariaLabel="근무 시점 선택"
          />
        </div>

        <div className="card tipcard">
          <div className="tiphd">
            <span className="tipic warn">
              <Icon name="lock" />
            </span>
            <h4>익명 보장</h4>
          </div>
          <ul className="tiplist">
            <li>
              <Icon name="eyeoff" />
              작성자 정보는 암호화되어 저장돼요
            </li>
            <li>
              <Icon name="shield" />
              운영팀도 작성자를 열람할 수 없어요
            </li>
          </ul>
        </div>
      </div>

      {gateOpen ? <RoleModal onClose={() => setGateOpen(false)} /> : null}
    </form>
  );
}
