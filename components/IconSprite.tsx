/**
 * 아이콘 스프라이트 — 시안 정본의 <symbol> 31종을 그대로 옮긴다.
 * 레퍼런스 마크업이 <use href="#i-xxx"/>로 참조하므로 루트에 한 번 심어둔다.
 * (r4 규칙: 이모지 금지, 인라인 SVG만)
 */
export function IconSprite() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </symbol>
      <symbol id="i-star" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
      </symbol>
      <symbol id="i-like" viewBox="0 0 24 24">
        <path d="M7 11v10H3V11z" />
        <path d="M7 11l4-8a2.5 2.5 0 0 1 2.5 3L12.5 9H20a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 18.7 21H7" />
      </symbol>
      <symbol id="i-comment" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </symbol>
      <symbol id="i-view" viewBox="0 0 24 24">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </symbol>
      <symbol id="i-chevL" viewBox="0 0 24 24">
        <polyline points="15 18 9 12 15 6" />
      </symbol>
      <symbol id="i-chevR" viewBox="0 0 24 24">
        <polyline points="9 18 15 12 9 6" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </symbol>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </symbol>
      <symbol id="i-x" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </symbol>
      <symbol id="i-up" viewBox="0 0 24 24">
        <polyline points="6 15 12 9 18 15" />
      </symbol>
      <symbol id="i-down" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9" />
      </symbol>
      {/* 정렬 가능(미정렬) — 위/아래 화살표를 겹쳐 "어느 쪽으로도 정렬된다"를 알린다 */}
      <symbol id="i-sort" viewBox="0 0 24 24">
        <polyline points="7 10 12 5 17 10" />
        <polyline points="7 14 12 19 17 14" />
      </symbol>
      <symbol id="i-bot" viewBox="0 0 24 24">
        {/* 귀여운 AI 봇 얼굴 — codex 생성 글리프 */}
        <rect x="5" y="8" width="14" height="11" rx="5" />
        <path d="M12 8V5.7" />
        <circle cx="12" cy="4.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="9.3" cy="13" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="14.7" cy="13" r="1.3" fill="currentColor" stroke="none" />
        <path d="M9.5 16c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1" />
      </symbol>
      <symbol id="i-flag" viewBox="0 0 24 24">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </symbol>
      <symbol id="i-users" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      </symbol>
      {/* 단일 인물 — i-users는 여러 명이라 "내 계정"에 안 맞는다 */}
      <symbol id="i-user" viewBox="0 0 24 24">
        <path d="M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2" />
        <circle cx="12" cy="7" r="4" />
      </symbol>
      {/* 전환 — 계정 "변경"의 초점은 사람이 아니라 바꾸는 동작이다 */}
      <symbol id="i-swap" viewBox="0 0 24 24">
        <polyline points="17 2 21 6 17 10" />
        <path d="M21 6H8a4 4 0 0 0-4 4" />
        <polyline points="7 22 3 18 7 14" />
        <path d="M3 18h13a4 4 0 0 0 4-4" />
      </symbol>
      <symbol id="i-award" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
      </symbol>
      <symbol id="i-fire" viewBox="0 0 24 24">
        <path d="M13.4 2.6c.5 3.7-2.1 5.1-3.7 7.2-1.2 1.6-1.3 3.1-.3 4.5.1-2 1.2-3.2 2.7-4.4-.1 2.5 2.5 3.2 2.5 5.7 0 1.2-.5 2.2-1.3 2.9 2.7-.6 4.6-2.8 4.6-5.8 0-3.7-2.3-7.3-4.5-10.1z" />
        <path d="M9.4 21c-2.7-.9-4.5-3.2-4.5-6.2 0-2.4 1.1-4.4 2.9-6.2-.2 2 .2 3.4 1.2 4.5" />
      </symbol>
      <symbol id="i-book-open" viewBox="0 0 24 24">
        <path d="M3 5.5c3.4-.8 6.3 0 9 2.2v12c-2.7-2.2-5.6-3-9-2.2z" />
        <path d="M21 5.5c-3.4-.8-6.3 0-9 2.2v12c2.7-2.2 5.6-3 9-2.2z" />
      </symbol>
      <symbol id="i-trending" viewBox="0 0 24 24">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="15 7 21 7 21 13" />
      </symbol>
      <symbol id="i-share" viewBox="0 0 24 24">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </symbol>
      <symbol id="i-bookmark" viewBox="0 0 24 24">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </symbol>
      <symbol id="i-link" viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </symbol>
      <symbol id="i-edit" viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </symbol>
      <symbol id="i-doc" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </symbol>
      <symbol id="i-gauge" viewBox="0 0 24 24">
        <path d="M12 20a8 8 0 1 0-8-8" />
        <path d="M12 12l4-3" />
      </symbol>
      <symbol id="i-building" viewBox="0 0 24 24">
        <path d="M6 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v18" />
        <path d="M2 22h20" />
        <path d="M10 7h4M10 11h4M10 15h4" />
      </symbol>
      <symbol id="i-mail" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 5L2 7" />
      </symbol>
      {/* 집. 하단 탭바의 홈 자리에 쓴다. layout(칸 나뉜 사각형)을 쓰고
          있었는데 그건 대시보드로 읽힌다 */}
      <symbol id="i-home" viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </symbol>
      {/* 서류 가방. 채용공고 자리. trending(우상향 화살표)은 지표로 읽힌다 */}
      <symbol id="i-briefcase" viewBox="0 0 24 24">
        <rect x="2.5" y="7.5" width="19" height="12.5" rx="2" />
        <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2" />
        <path d="M2.5 12.5h19" />
      </symbol>
      <symbol id="i-layout" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </symbol>
      <symbol id="i-upload" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </symbol>
      <symbol id="i-lock" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </symbol>
      <symbol id="i-image" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </symbol>
      <symbol id="i-play" viewBox="0 0 24 24">
        <polygon points="6 3 20 12 6 21" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="i-chart" viewBox="0 0 24 24">
        <line x1="3" y1="21" x2="21" y2="21" />
        <rect x="5" y="11" width="4" height="7" />
        <rect x="11" y="6" width="4" height="12" />
        <rect x="17" y="14" width="4" height="4" />
      </symbol>
      <symbol id="i-alert" viewBox="0 0 24 24">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </symbol>
      <symbol id="i-shield" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </symbol>
      {/* 종 — 알림 벨 전용. i-notice(스피커)는 공지의 것이라 겸용하지 않는다 */}
      <symbol id="i-bell" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </symbol>
      <symbol id="i-notice" viewBox="0 0 24 24">
        <path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
        <path d="M17 9a4 4 0 0 1 0 6" />
        <path d="M20 6.5a8 8 0 0 1 0 11" />
      </symbol>
      <symbol id="i-palette" viewBox="0 0 24 24">
        <path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 3-3.5 3H16a2 2 0 0 0-2 2c0 1 .5 1.5.5 2.5S13.5 22 12 22z" />
        <circle cx="7.5" cy="11.5" r="1" />
        <circle cx="10.5" cy="7.5" r="1" />
        <circle cx="15" cy="8" r="1" />
      </symbol>
      {/* 열쇠 — 권한 정책 화면(P1 KeyRound 대응). 자물쇠(잠김)와 구분되는 "권한 자체" */}
      <symbol id="i-key" viewBox="0 0 24 24">
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
        <circle cx="16.5" cy="7.5" r="0.5" />
      </symbol>
      {/* 톱니 — 시스템·정책 그룹(P1 Cog 대응) */}
      <symbol id="i-cog" viewBox="0 0 24 24">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </symbol>
      {/* 그립(⋮⋮) — 드래그 정렬 핸들. "잡는 곳"이라는 관례 기호라 점 6개로 그린다 */}
      <symbol id="i-grip" viewBox="0 0 24 24">
        <circle cx="9" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="9" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
      </symbol>
      {/* 눈 가림 — 콘텐츠 블라인드. i-view(열람)의 부정형이라 쌍으로 읽힌다 */}
      <symbol id="i-eyeoff" viewBox="0 0 24 24">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </symbol>
    </svg>
  );
}
