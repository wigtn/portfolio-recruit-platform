import { COMPANIES } from "@/lib/seed/companies";

/**
 * 회사 로고 타일 — admin 시드는 글리프(◇)만 갖고 있어 표가 "이미지 로딩 실패"처럼
 * 보였다. 사이트 정본(lib/seed/companies.ts)의 실이미지를 이름 매칭으로 가져와
 * 회사 관리·큐레이션이 같은 규칙으로 그린다.
 *
 * 이름이 정본과 다르면(엑셀 신규 등록, "▽▽바이오(주)" 같은 중복 의심 표기)
 * 실이미지가 없다는 뜻이므로 기존 글리프 폴백을 유지한다 — 서비스 화면과
 * 백오피스가 서로 다른 회사를 같은 로고로 보여주면 안 된다.
 */

/** 사이트 정본에서 이름 완전 일치로 로고 경로를 찾는다 — 못 찾으면 undefined */
export function companyLogoOf(name: string): string | undefined {
  return COMPANIES.find((company) => company.name === name)?.logo;
}

export function CompanyLogo({
  name,
  fallback,
}: {
  name: string;
  /** 매칭 실패 시 보여줄 글리프 — 호출부가 가진 시드 값(row.logo 등) */
  fallback: string;
}) {
  const src = companyLogoOf(name);
  return (
    // 로고는 장식이다 — 회사명이 항상 옆에 있어 스크린리더에는 숨긴다.
    // 크기를 인라인으로 박는 이유: .dtable .lgc만 26px 규칙이 있고 .slot .lgc는
    // 크기 규칙이 없어, img가 원본 크기(258px)로 터진다. globals.css는 타 레인
    // 소유라 여기서 고정한다 — 값은 .dtable .lgc(26px·radius 6px)와 동일.
    <span
      className="lgc"
      aria-hidden
      style={{ width: 26, height: 26, borderRadius: 6 }}
    >
      {src ? <img src={src} alt="" /> : fallback}
    </span>
  );
}
