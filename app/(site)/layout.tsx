import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AccountMenu } from "@/components/AccountMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NavMenu } from "@/components/NavMenu";
import { RouteMotion } from "@/components/demo/RouteMotion";
import { CuratedPromo } from "@/components/demo/CuratedPromo";
import { EventPopup } from "@/components/demo/EventPopup";

/** 서비스 셸 — 시안 정본의 .promobar / .nav / .footer */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="screen">
      {/* 데모 장치 — 서비스 UI와 분리된 레이어 */}
      <div className="promobar">
        {/* 문구는 화면 정가운데, CTA는 오른쪽 끝. 가운데 칸을 따로 둬야
            버튼 폭이 문구 위치를 밀지 않는다. */}
        <span aria-hidden />
        <CuratedPromo />
        <Link className="rbtn" href="/contact">
          상담 요청
          <Icon name="arrow" />
        </Link>
      </div>

      <nav className="nav">
        <div className="inner">
          <Link className="brand" href="/">
            <span className="mark">W</span> 세일즈
          </Link>
          <NavMenu />
          <div className="right">
            <GlobalSearch />
            {/* 알림이 계정보다 앞 — 신고·증빙 결과가 돌아오는 자리라 눈에 먼저 걸려야 한다 */}
            <NotificationBell />
            <AccountMenu />
          </div>
        </div>
      </nav>

      <RouteMotion>{children}</RouteMotion>

      <footer className="footer">
        <div className="ftop">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                fontWeight: 800,
                fontSize: 17,
                letterSpacing: "-.03em",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: 7,
                  background: "var(--accent)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                W
              </span>{" "}
              세일즈
            </div>
            <p
              style={{
                fontSize: "12.5px",
                color: "var(--ink-3)",
                lineHeight: 1.6,
                maxWidth: "26ch",
              }}
            >
              영업직을 위한 커뮤니티와 회사 리뷰: 현장의 답을 현장 사람들에게.
            </p>
          </div>
          <div>
            <h6>서비스</h6>
            <div className="flinks">
              <Link href="/community">커뮤니티</Link>
              <Link href="/companies">회사 리뷰</Link>
              <Link href="/compare">회사 비교</Link>
              <Link href="/jobs">채용공고</Link>
              <Link href="/badges">실적 인증</Link>
            </div>
          </div>
          <div>
            <h6>고객지원</h6>
            <div className="flinks">
              <Link href="/notices?kind=notice">공지사항</Link>
              <Link href="/notices?kind=faq">자주 묻는 질문</Link>
              <Link href="/notices?kind=faq&doc=nt-10">신고 안내</Link>
            </div>
          </div>
          {/* 약관·운영정책·리뷰 정책은 전부 "정책 문서" 한 화면의 문서들 —
              화면 단위로만 건다. 개인정보처리방침은 법정 고지라 이름을 남긴다. */}
          <div>
            <h6>정책</h6>
            <div className="flinks">
              <Link href="/notices?kind=terms">정책 문서</Link>
              <Link href="/notices?kind=terms&doc=nt-6">
                <b>개인정보처리방침</b>
              </Link>
            </div>
          </div>
        </div>
        <div className="fbot">
          <div>
            (주)◇◇컴퍼니 · 대표 김데모 · 사업자등록번호 000-00-00000
            <br />
            서울특별시 ◇◇구 ◇◇로 00, 0층 · contact@demo.wigtn.dev
          </div>
          <div style={{ textAlign: "right" }}>
            © 2026 ◇◇컴퍼니 · WIGTN 데모
            <br />
            모든 회사·회원·수치는 가상 데이터예요
          </div>
        </div>
      </footer>

      <EventPopup />
    </div>
  );
}
