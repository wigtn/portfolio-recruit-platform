import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AccountMenu } from "@/components/AccountMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NavMenu } from "@/components/NavMenu";
import { TabBar } from "@/components/TabBar";
import { RouteMotion } from "@/components/demo/RouteMotion";
import { PromoBar } from "@/components/demo/PromoBar";

/** 서비스 셸 — 시안 정본의 .promobar / .nav / .footer */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="screen">
      {/* 데모 장치 — 서비스 UI와 분리된 레이어 */}
      <PromoBar />

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
          <div className="ft-brand-block">
            <div className="ft-brand">
              <span className="ft-mark">W</span>
              세일즈
            </div>
            <p className="ft-desc">
              영업직을 위한 커뮤니티와 회사 리뷰, 현장의 답을 현장 사람들에게.
            </p>
          </div>
          {/* 링크 묶음은 <details>다.

              모바일에서 이 셋이 세로로 쌓이면 푸터만 화면 두 개 분량이 된다.
              그런데 여기까지 스크롤한 사람이 찾는 건 대개 하나뿐이라, 제목만
              보여 주고 필요한 것만 펼치게 한다.

              JS 없이 <details>로 가는 이유는 상태가 브라우저에 있기 때문이다 —
              하이드레이션 전에도 눌리고, 스크립트가 실패해도 열린다. 넓은
              화면에서는 CSS가 강제로 펼쳐 두므로 접히는 물건이 아니게 된다. */}
          <details className="fcol">
            <summary>
              <h6>서비스</h6>
            </summary>
            <div className="flinks">
              <Link href="/community">커뮤니티</Link>
              <Link href="/companies">회사 리뷰</Link>
              <Link href="/compare">회사 비교</Link>
              <Link href="/jobs">채용공고</Link>
              <Link href="/badges">실적 인증</Link>
            </div>
          </details>
          <details className="fcol">
            <summary>
              <h6>고객지원</h6>
            </summary>
            <div className="flinks">
              <Link href="/notices?kind=notice">공지사항</Link>
              <Link href="/notices?kind=faq">자주 묻는 질문</Link>
              <Link href="/notices?kind=faq&doc=nt-10">신고 안내</Link>
            </div>
          </details>
          {/* 약관·운영정책·리뷰 정책은 전부 "정책 문서" 한 화면의 문서들 —
              화면 단위로만 건다. 개인정보처리방침은 법정 고지라 이름을 남긴다. */}
          <details className="fcol">
            <summary>
              <h6>정책</h6>
            </summary>
            <div className="flinks">
              <Link href="/notices?kind=terms">정책 문서</Link>
              <Link href="/notices?kind=terms&doc=nt-6">
                <b>개인정보처리방침</b>
              </Link>
            </div>
          </details>
        </div>
        <div className="fbot">
          <div>
            (주)◇◇컴퍼니, 대표 김데모, 사업자등록번호 000-00-00000
            <br />
            서울특별시 ◇◇구 ◇◇로 00, 0층, contact@wigtn.com
          </div>
          <div className="fbot-note">
            © 2026 ◇◇컴퍼니, WIGTN 데모
            <br />
            모든 회사, 회원, 수치는 가상 데이터예요
          </div>
        </div>
      </footer>

      <TabBar />
    </div>
  );
}
