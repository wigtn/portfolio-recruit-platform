"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { myEvidenceStatus, submitEvidence } from "@/lib/demo/submit";
import { DEMO_PROFILE, levelFor } from "@/lib/demo/profile";
import { FileDrop, type Accepted } from "./FileDrop";
import { Icon } from "./Icon";
import { Sk, SkRegion, useMockLoading } from "./Skeleton";

/**
 * 실적 인증 — 푸터가 이름은 부르는데 화면이 없어 `/my`로 보내던 자리다.
 *
 * 마이페이지의 인증 카드는 "내 상태"만 보여준다. 여기서는 그 앞 단계 —
 * 인증이 무엇이고, 등급이 어떻게 갈리고, 무엇을 올려야 하는지 — 를 다룬다.
 * 제출은 같은 `submitEvidence`를 쓰므로 운영자 증빙 검토 큐로 그대로 넘어간다.
 *
 * 등급 사다리(Lv.1~5)가 등급 명칭의 정본이다 — 프로필·마이가 이 이름을 쓴다.
 */
const LEVELS = [
  {
    name: "Lv.1 신입",
    desc: "가입 직후",
    need: "이메일 인증",
    icon: "user",
  },
  {
    name: "Lv.2 현직",
    desc: "재직 확인 완료",
    need: "회사 이메일 또는 재직증명",
    icon: "building",
  },
  {
    name: "Lv.3 리뷰어",
    desc: "리뷰 3건 이상",
    need: "본인 작성 리뷰 3건",
    icon: "star",
  },
  {
    name: "Lv.4 필드리더",
    desc: "받은 도움 1,000+",
    need: "커뮤니티 활동",
    icon: "like",
  },
  {
    name: "Lv.5 세일즈마스터",
    desc: "실적 증빙 승인",
    need: "실적 자료 제출, 운영자 검토",
    icon: "award",
  },
];

/** 실측 높이(1440px) — 제출 폼 카드. 스켈레톤이 이 자리를 그대로 예약한다 */
const FORMCARD_H = 241.2;

export function BadgePanel() {
  const [evidence, setEvidence] = useState<ReturnType<
    typeof myEvidenceStatus
  > | null>(null);
  const [files, setFiles] = useState<Accepted[]>([]);
  const [sent, setSent] = useState(false);

  // 홈과 같은 강제 지연 — 인증 상태가 빈 화면 뒤에 튀어 들어오지 않게 한다
  const delaying = useMockLoading();
  const [ready, setReady] = useState(false);
  const loading = delaying || !ready;

  useEffect(() => {
    setEvidence(myEvidenceStatus());
    setReady(true);
  }, []);

  const submit = () => {
    submitEvidence(files.length);
    setEvidence(myEvidenceStatus());
    setSent(true);
  };

  const status = evidence?.status;

  return (
    <>
      <div className="badgestate">
        <div className="badgestate-now">
          <span className="badgestate-ic">
            <Icon name="award" />
          </span>
          {loading ? (
            // Sk는 block이라 strut이 없다 — 글줄 높이(실측)를 직접 예약한다
            <div>
              <b
                style={{ height: 25.6, display: "flex", alignItems: "center" }}
              >
                <Sk w={110} h={16} />
              </b>
              <span
                style={{ height: 21.6, display: "flex", alignItems: "center" }}
              >
                <Sk w={230} h={12} />
              </span>
            </div>
          ) : (
            <div>
              <b>{levelFor(status)}</b>
              <span>
                {status
                  ? `실적 증빙 ${status}`
                  : "실적 증빙을 올리면 Lv.5로 올라갈 수 있어요"}
              </span>
            </div>
          )}
        </div>
        {!loading && status === "반려" && evidence?.reason ? (
          <p className="badgestate-why">
            <Icon name="alert" />
            반려 사유, {evidence.reason}
          </p>
        ) : null}
      </div>

      <div className="sec-head" style={{ marginTop: 30 }}>
        <h2>
          등급 기준<span className="sub">무엇을 확인하나요</span>
        </h2>
      </div>
      <div className="badgegrid is-ladder">
        {LEVELS.map((level, index) => {
          const now = !loading && levelFor(status) === level.name;
          return (
            <div
              className={[
                "bcard",
                `is-l${index + 1}`,
                index === LEVELS.length - 1 ? "is-top" : "",
                now ? "is-now" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={level.name}
            >
              {now ? <span className="bnow">현재 등급</span> : null}
              <span className="blv">Lv.{index + 1}</span>
              <span className="bi">
                <Icon name={level.icon} />
              </span>
              <div className="bn">{level.name.replace(/^Lv\.\d+\s*/, "")}</div>
              <div className="bd">{level.desc}</div>
              <div className="bc">
                <b>{level.need}</b>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sec-head" style={{ marginTop: 34 }}>
        <h2>
          실적 증빙 제출<span className="sub">운영자가 직접 확인해요</span>
        </h2>
      </div>
      {loading ? (
        // 상태에 따라 폼/완료 화면이 갈린다 — 읽기 전엔 폼 높이로 자리를 못 박는다
        <SkRegion label="증빙 제출">
          <div
            className="formcard"
            aria-hidden
            style={{ height: FORMCARD_H, boxSizing: "border-box" }}
          >
            <Sk w={52} h={13} style={{ marginBottom: 10 }} />
            <Sk w="100%" h={128} r={12} style={{ marginBottom: 10 }} />
            <Sk w="64%" h={12} style={{ marginBottom: 24 }} />
            <Sk
              w={96}
              h={38}
              r={9}
              style={{ marginLeft: "auto", display: "block" }}
            />
          </div>
        </SkRegion>
      ) : (
        <div className="formcard sk-arrive">
          {sent || status ? (
            <div className="badgesent">
              <span className="badgesent-ic">
                <Icon name="check" />
              </span>
              <b>
                {status === "승인"
                  ? "승인됐어요"
                  : status === "반려"
                    ? "반려됐어요"
                    : "검토 중이에요"}
              </b>
              <p>
                {status === "검토 대기" || !status
                  ? "운영자 증빙 검토 큐로 넘어갔어요. 결과는 마이에서 확인할 수 있어요."
                  : "결과와 사유는 마이에서도 볼 수 있어요."}
              </p>
              <Link className="btn line" href="/my">
                마이에서 보기
              </Link>
            </div>
          ) : (
            <div className="evsubmit">
              {/* 좌: 무엇이 일어나는지 — 세 단계로 절차를 미리 보여준다 */}
              <div className="evsteps">
                <div className="evstep">
                  <span className="evstep-no">1</span>
                  <div>
                    <b>증빙 올리기</b>
                    <span>실적표, 수상 내역, 계약 요약, 회사명, 금액은 가려도 돼요</span>
                  </div>
                </div>
                <div className="evstep">
                  <span className="evstep-no">2</span>
                  <div>
                    <b>운영자 검토</b>
                    <span>운영자가 직접 확인해요, 판단에 필요한 만큼만 봐요</span>
                  </div>
                </div>
                <div className="evstep">
                  <span className="evstep-no">3</span>
                  <div>
                    <b>배지, 등급 반영</b>
                    <span>승인되면 인증 배지가 붙고 등급이 실제로 올라가요</span>
                  </div>
                </div>
              </div>
              {/* 우: 제출 폼 */}
              <div className="evform">
                <FileDrop files={files} onChange={setFiles} />
                <div className="evform-foot">
                  <span className="hint" style={{ margin: 0 }}>
                    검토 결과는 마이와 알림으로 알려드려요
                  </span>
                  <button
                    className="btn primary"
                    disabled={files.length === 0}
                    onClick={submit}
                  >
                    검토 요청
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
