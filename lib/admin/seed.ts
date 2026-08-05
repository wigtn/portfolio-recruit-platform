/**
 * 백오피스 시드 — 시안 정본의 표 데이터. 읽기 전용이다.
 *
 * 방문자의 조치는 이 시드를 바꾸지 않고 lib/admin/overlay.ts(localStorage)에 덮어쓴다
 * (r4 변경 9번 — 체험 입력은 서버에 기록하지 않는다).
 */

import { FEED } from "@/lib/seed/feed";
import { COMPANIES as SERVICE_COMPANIES } from "@/lib/seed/companies";
import { JOBS as SERVICE_JOBS } from "@/lib/seed/jobs";
import { getPost, type Post } from "@/lib/seed/posts";

export type Report = {
  id: string;
  target: string;
  kind: string;
  reason: string;
  count: number;
  status: string;
  /**
   * 커뮤니티 글 신고면 실재하는 글 id — 사용자 화면 블라인드 게이트가
   * status가 "블라인드"/"삭제"인 행의 postId로 원문을 가린다.
   * 글이 아닌 신고(리뷰·댓글·인증)는 비워 둔다.
   */
  postId?: string;
  /** 신고된 원문 — 내용을 못 보면 블라인드할지 반려할지 판단할 수 없다 */
  author: string;
  at: string;
  body: string;
  /** 첨부·맥락 등 판단에 필요한 부가 정보 */
  note?: string;
  /** 접수된 신고들 — 누가 왜 신고했는지 */
  filings: Array<{ at: string; by: string; reason: string }>;
};

export type Member = {
  id: string;
  nick: string;
  grade: string;
  activity: string;
  status: string;
  joined: string;
  /** 상세 — 제재 판단에 필요한 것만. 실명·연락처는 담지 않는다(익명 보호) */
  email: string;
  verified: boolean;
  lastSeen: string;
  reported: number;
  history: Array<{ at: string; what: string }>;
};

export type Evidence = {
  id: string;
  applied: string;
  nick: string;
  change: string;
  files: number;
  status: string;
  reason?: string;
};

export type AuditRow = {
  at: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
};

export type Company = {
  id: string;
  logo: string;
  name: string;
  industry: string;
  region: string;
  reviews: number;
  rating: number | null;
  /** 노출중 · 중복 의심 · 엑셀 신규 · 숨김 · 병합됨 */
  status: string;
  /** 중복 의심일 때 어느 회사와 겹치는지 */
  dupeOf?: string;
};

export type Notice = {
  id: string;
  kind: "notice" | "faq" | "terms";
  title: string;
  place: string;
  date: string;
  status: string;
  body: string;
  pinned?: boolean;
};

export type Slot = { id: string; name: string; meta?: string };

export type Curation = {
  companies: Slot[];
  posts: Slot[];
  banners: Slot[];
  blockedKeywords: string[];
};

/** 권한 매트릭스 한 줄 — 역할별 allow/deny/conditional */
export type PolicyRow = {
  id: string;
  label: string;
  /** guest·member·admin·super 순서 */
  grants: Array<"yes" | "no">;
  /** 조건부 표기 (역할 index → 문구) */
  cond?: Record<number, string>;
  locked?: boolean;
  lockNote?: string;
};

/**
 * 답변 없는 질문 큐의 한 줄 — 별도 시드 표가 아니라 **서비스 시드에서 파생**한다.
 *
 * 커뮤니티 피드(제목·경과·조회수 정본)와 글 상세(본문·AI 초안 정본)를 조인해,
 * 질문답변 게시판에서 댓글이 0인 글만 추린다. 여기 따로 적으면 대시보드 건수와
 * 커뮤니티 화면이 갈라진다 — 예전 큐의 "12건"이 그 하드코딩이었다.
 */
export type QuestionRow = {
  postId: string;
  title: string;
  board: string;
  /** 표시용 경과 문구 — 정렬은 ageMinutes로 한다(피드 규약 그대로) */
  at: string;
  ageMinutes: number;
  views: number;
  /** 본문 미리보기·AI 참고 답변에 쓰는 원문 */
  post: Post;
};

export const QUESTION_SEED: QuestionRow[] = FEED.flatMap((item) => {
  if (item.board !== "qna" || !item.postId) return [];
  const post = getPost(item.postId);
  if (!post || post.comments.length > 0) return [];
  return [
    {
      postId: item.postId,
      title: item.title,
      board: post.board,
      at: item.at,
      ageMinutes: item.ageMinutes,
      views: item.views,
      post,
    },
  ];
  // 오래 기다린 질문이 위로 — 큐는 최신순이 아니라 방치된 순으로 봐야 한다
}).sort((a, b) => b.ageMinutes - a.ageMinutes);

/** 아직 운영자 답변이 없는 질문 — 오버레이 answers가 달리면 큐에서 빠진다 */
export function openQuestions(
  answers: Array<{ postId: string }>,
): QuestionRow[] {
  return QUESTION_SEED.filter(
    (row) => !answers.some((answer) => answer.postId === row.postId),
  );
}

/** 채용공고 한 건 — 서비스 /jobs와 같은 정본(서비스 시드 파생) */
export type JobRow = {
  id: string;
  companySlug: string;
  company: string;
  title: string;
  employment: string;
  career: string;
  payLow: number;
  payHigh: number;
  /** null이면 상시 채용 */
  daysLeft: number | null;
  status: "노출중" | "마감";
};

/** 운영자 계정 한 명 — 권한 정책 화면의 계정 관리 탭이 쓴다 */
export type AdminAccount = {
  id: string;
  /** 로그인 아이디 (표시용) */
  handle: string;
  name: string;
  role: "super" | "admin" | "viewer";
  twoFA: boolean;
  lastActive: string;
  status: "활성" | "정지" | "초대됨";
};

/**
 * 1:1 문의 — 서비스 안 고객센터 문의가 운영자 큐로 들어온다.
 *
 * 문의는 익명 커뮤니티와 달리 "내 계정의 일"이라 닉네임으로 남는다.
 * 답변이 달리면 문의자에게 알림으로 돌아간다(notifications 파생) — 신고·증빙과
 * 같은 왕복 문법이다. 나중에 실서비스 모듈로 뗄 때 슬랙/메일 연동이 이
 * 자리(답변 등록 지점)에 붙는다.
 */
export type InquiryRow = {
  id: string;
  /** 문의 분류 — 사용자 폼의 선택지와 같은 목록이어야 한다 */
  category: string;
  message: string;
  /** 문의자 닉네임 */
  by: string;
  at: string;
  status: "대기" | "답변완료";
  answer?: string;
  /** ISO — 표시할 때 화면에서 접는다 */
  answeredAt?: string;
};

export type Store = {
  reports: Report[];
  members: Member[];
  evidence: Evidence[];
  audit: AuditRow[];
  companies: Company[];
  notices: Notice[];
  curation: Curation;
  policy: PolicyRow[];
  admins: AdminAccount[];
  jobs: JobRow[];
  inquiries: InquiryRow[];
};

export const seed: Store = {
  reports: [
    {
      id: "rp-1",
      target: "[광고] 이직 컨설팅 DM 주세요",
      kind: "커뮤니티 글",
      reason: "스팸, 광고",
      count: 5,
      status: "임시 블라인드",
      postId: "p-4822",
      author: "스팸계정01",
      at: "07.25 09:15",
      body:
        "이직 고민 있으신 분들 DM 주세요. 대기업 위주로 컨설팅 진행하고 있습니다.\n" +
        "상담은 무료고, 합격 시에만 수수료 받습니다. 010-1234-5678 편하게 연락 주세요.",
      note: "3회 누적으로 자동 임시 블라인드된 상태예요, 삭제할지 복원할지 판단이 필요해요",
      filings: [
        { at: "07.25 09:41", by: "익명1102", reason: "스팸, 광고" },
        { at: "07.25 10:03", by: "영업7년차", reason: "연락처 노출" },
        { at: "07.25 10:18", by: "익명5533", reason: "스팸, 광고" },
        { at: "07.25 11:22", by: "익명0917", reason: "스팸, 광고" },
        { at: "07.25 13:40", by: "필드러너", reason: "상업적 홍보" },
      ],
    },
    {
      id: "rp-2",
      target: "팀장 실명 험담 리뷰",
      kind: "회사 리뷰",
      reason: "실명, 비방",
      count: 3,
      status: "검토 대기",
      author: "익명1102",
      at: "07.24 21:07",
      body:
        "○○팀 김□□ 팀장 밑에서는 절대 일하지 마세요. 사람 갈아넣는 스타일이고,\n" +
        "성과는 본인이 다 챙깁니다. 3년 동안 그 팀에서만 5명 나갔어요.",
      note: "실명이 들어간 개인 지목이라 규칙상 블라인드 대상이지만, 근무 환경 정보로서의 가치도 있어요",
      filings: [
        { at: "07.24 22:15", by: "익명3390", reason: "실명, 비방" },
        { at: "07.25 08:02", by: "익명7781", reason: "개인 지목" },
        { at: "07.25 09:30", by: "익명2214", reason: "실명, 비방" },
      ],
    },
    {
      id: "rp-3",
      target: "허위 실적 인증 의심",
      kind: "실적 인증",
      reason: "허위 정보",
      count: 2,
      status: "검토 대기",
      author: "영업7년차",
      at: "07.23 14:55",
      body:
        "2025년 연간 목표 340% 달성 인증합니다. 첨부한 실적표 확인 부탁드려요.\n" +
        "(첨부: 실적표 이미지 1장)",
      note: "첨부 이미지의 회사 로고가 프로필에 등록된 소속 회사와 달라요, 확인이 필요해요",
      filings: [
        { at: "07.24 10:11", by: "익명4402", reason: "허위 정보" },
        { at: "07.24 16:38", by: "익명8890", reason: "증빙 불일치" },
      ],
    },
    {
      id: "rp-4",
      target: "경쟁사 비방 목적 리뷰 반복 등록",
      kind: "회사 리뷰",
      reason: "허위 정보",
      count: 4,
      status: "검토 대기",
      author: "익명9006",
      at: "07.22 11:30",
      body:
        "여기 진짜 최악입니다. 다른 데 가세요. 여기 진짜 최악입니다. 다른 데 가세요.\n" +
        "(같은 내용으로 4개 회사 페이지에 반복 등록)",
      note: "동일 계정이 같은 문장을 여러 회사에 반복 등록했어요",
      filings: [
        { at: "07.22 12:04", by: "익명1188", reason: "도배" },
        { at: "07.22 15:20", by: "익명6650", reason: "허위 정보" },
        { at: "07.23 09:12", by: "필드러너", reason: "도배" },
        { at: "07.23 17:45", by: "익명3301", reason: "허위 정보" },
      ],
    },
    {
      id: "rp-5",
      target: "어제 회식 사진 올립니다",
      kind: "커뮤니티 글",
      reason: "선정성",
      count: 6,
      status: "블라인드",
      postId: "p-4809",
      author: "익명7420",
      at: "07.21 02:11",
      body: "(이미지 3장 첨부, 본문 없음)",
      note: "이미 블라인드 처리된 건이에요. 복원하려면 근거가 필요해요",
      filings: [
        { at: "07.21 02:40", by: "익명2214", reason: "선정성" },
        { at: "07.21 03:02", by: "익명9931", reason: "선정성" },
        { at: "07.21 07:55", by: "영업7년차", reason: "선정성" },
        { at: "07.21 08:30", by: "익명5533", reason: "부적절한 이미지" },
        { at: "07.21 09:14", by: "익명0917", reason: "선정성" },
        { at: "07.21 10:02", by: "익명4402", reason: "선정성" },
      ],
    },
    {
      // 반려 예시도 실재 글(p-f14)을 가리킨다 — 반려면 게이트는 아무것도 가리지 않는다
      id: "rp-6",
      target: "월요일 아침 파이프라인 회의, 우리 회사만 긴가요",
      kind: "커뮤니티 글",
      reason: "회사 비방",
      count: 1,
      status: "반려",
      postId: "p-f14",
      author: "조영업",
      at: "07.20 19:22",
      body: "매주 월요일 9시부터 두 시간씩 합니다. 팀원 전원이 딜을 하나씩 다 읽는 구조라 제 차례는 30분 뒤에 오고, 그 전까지는 그냥 앉아 있어요.",
      note: "회사를 특정할 수 없는 일반적인 근무 경험담이라 반려한 건이에요",
      filings: [{ at: "07.20 20:10", by: "익명8890", reason: "회사 비방" }],
    },
  ],

  members: [
    {
      id: "m-1",
      nick: "김영업",
      grade: "Lv.4 필드리더",
      activity: "글 24, 리뷰 3",
      status: "정상",
      joined: "2025.11",
      email: "kim****@example.com",
      verified: true,
      lastSeen: "오늘 09:12",
      reported: 0,
      // 실적 인증 신청은 시드에 없다 — 방문자가 체험으로 제출하면 그때 큐(ev-me)에 생긴다
      history: [{ at: "2026.03.02", what: "필드리더 등급 승인" }],
    },
    {
      id: "m-2",
      nick: "박세일",
      grade: "Lv.5 세일즈마스터",
      activity: "글 57, 리뷰 8",
      status: "정상",
      joined: "2025.08",
      email: "park****@example.com",
      verified: true,
      lastSeen: "어제 18:40",
      reported: 1,
      history: [
        { at: "2026.06.11", what: "신고 1건 접수, 반려 처리" },
        { at: "2025.12.20", what: "세일즈마스터 등급 승인" },
      ],
    },
    {
      id: "m-3",
      nick: "스팸계정01",
      grade: "Lv.1 신입",
      activity: "글 12, 리뷰 0",
      status: "정지",
      joined: "2026.07",
      email: "ad****@example.com",
      verified: false,
      lastSeen: "07.25 13:40",
      reported: 5,
      history: [
        { at: "2026.07.25", what: "신고 5회 누적, 정지" },
        { at: "2026.07.25", what: "광고 글 3건 자동 블라인드" },
      ],
    },
    {
      id: "m-4",
      nick: "정주임",
      grade: "Lv.2 현직",
      activity: "글 8, 리뷰 1",
      status: "정상",
      joined: "2026.05",
      email: "jung****@example.com",
      verified: false,
      lastSeen: "3일 전",
      reported: 0,
      history: [{ at: "2026.07.24", what: "등급 인증 신청 (검토 대기)" }],
    },
    {
      id: "m-5",
      nick: "오사원",
      grade: "Lv.1 신입",
      activity: "글 3, 리뷰 0",
      status: "정상",
      joined: "2026.07",
      email: "oh****@example.com",
      verified: false,
      lastSeen: "오늘 11:03",
      reported: 0,
      history: [{ at: "2026.07.23", what: "등급 인증 신청 (검토 대기)" }],
    },
    {
      id: "m-6",
      nick: "필드러너",
      grade: "Lv.3 리뷰어",
      activity: "글 31, 리뷰 5",
      status: "정상",
      joined: "2026.01",
      email: "run****@example.com",
      verified: true,
      lastSeen: "오늘 08:22",
      reported: 0,
      history: [
        { at: "2026.07.25", what: "등급 인증 신청 (검토 대기)" },
        { at: "2026.04.18", what: "인증 회원 전환" },
      ],
    },
  ],

  // 등급 표기는 badges 페이지의 사다리(Lv.1 신입 ~ Lv.5 세일즈마스터)를 따른다.
  // 김영업 행은 시드에 두지 않는다 — 방문자가 제출하는 ev-me와 같은 닉·같은 변경이라
  // 큐에 똑같은 신청이 두 줄 보였다.
  evidence: [
    {
      id: "ev-1",
      applied: "07.25",
      nick: "필드러너",
      change: "Lv.3 리뷰어 → Lv.4 필드리더",
      files: 2,
      status: "대기",
    },
    {
      id: "ev-2",
      applied: "07.24",
      nick: "정주임",
      change: "Lv.2 현직 → Lv.3 리뷰어",
      files: 1,
      status: "대기",
    },
    {
      id: "ev-3",
      applied: "07.23",
      nick: "오사원",
      change: "Lv.1 신입 → Lv.2 현직",
      files: 3,
      status: "대기",
    },
  ],

  // 신고 큐 rp-1(p-4822)의 자동 조치 기록 — 3회 누적 규칙과 시각이 맞아야 한다
  audit: [
    {
      at: "07.25 10:18",
      actor: "system",
      action: "자동 임시 블라인드",
      target: "커뮤니티 글 p-4822",
      reason: "신고 3회 누적",
    },
  ],

  companies: [
    {
      id: "co-1",
      logo: "◇",
      name: "◇◇테크",
      industry: "IT",
      region: "판교",
      reviews: 212,
      rating: 4.3,
      status: "노출중",
    },
    {
      id: "co-2",
      logo: "△",
      name: "△△전자",
      industry: "제조",
      region: "수원",
      reviews: 94,
      rating: 3.7,
      status: "노출중",
    },
    {
      id: "co-3",
      logo: "▽",
      name: "▽▽바이오(주)",
      industry: "제약",
      region: "대전",
      reviews: 0,
      rating: null,
      status: "중복 의심",
      dupeOf: "▽▽바이오",
    },
    {
      id: "co-4",
      logo: "○",
      name: "○○물산",
      industry: "유통",
      region: "부산",
      reviews: 61,
      rating: 3.4,
      status: "엑셀 신규",
    },
    {
      id: "co-5",
      logo: "▓",
      name: "▓▓상사",
      industry: "종합상사",
      region: "서울",
      reviews: 128,
      rating: 4.1,
      status: "노출중",
    },
    {
      id: "co-6",
      logo: "□",
      name: "□□커머스",
      industry: "이커머스",
      region: "서울",
      reviews: 87,
      rating: 3.9,
      status: "노출중",
    },
    {
      id: "co-7",
      logo: "▽",
      name: "▽▽바이오",
      industry: "제약",
      region: "대전",
      // 서비스 시드(lib/seed/companies.ts)의 reviewCount와 같은 값이어야 한다
      reviews: 45,
      rating: 4.0,
      status: "노출중",
    },
  ],

  notices: [
    {
      id: "nt-1",
      kind: "notice",
      title: "리뷰 운영정책 개정 안내",
      place: "공지사항, 상단 고정",
      date: "2026.07.20",
      status: "노출중",
      pinned: true,
      body:
        "리뷰에 개인 실명이 포함된 경우 블라인드 대상이 됩니다.\n" +
        "근무 환경에 대한 의견은 계속 자유롭게 남기실 수 있어요.",
    },
    {
      id: "nt-2",
      kind: "notice",
      title: "실적 인증 증빙 기준 변경",
      place: "공지사항",
      date: "2026.07.12",
      status: "노출중",
      body: "증빙 이미지에 회사명과 기간이 함께 보여야 승인됩니다.",
    },
    {
      id: "nt-3",
      kind: "notice",
      title: "서비스 점검 안내 (완료)",
      place: "공지사항",
      date: "2026.06.28",
      status: "종료",
      body: "6월 28일 02:00~04:00 정기 점검이 완료되었습니다.",
    },
    {
      id: "nt-4",
      kind: "faq",
      title: "리뷰는 누가 볼 수 있나요?",
      place: "자주 묻는 질문",
      date: "2026.07.02",
      status: "노출중",
      body: "작성자는 익명으로 표시되며, 운영자도 작성자를 조회할 수 없어요.",
    },
    {
      id: "nt-5",
      kind: "faq",
      title: "실적 인증은 어떻게 받나요?",
      place: "자주 묻는 질문",
      date: "2026.06.15",
      status: "노출중",
      body: "마이페이지에서 증빙 이미지를 올리면 운영자가 검토합니다.",
    },
    {
      id: "nt-6",
      kind: "terms",
      title: "개인정보처리방침 v2.1",
      place: "푸터, 약관",
      date: "2026.05.02",
      status: "시행중",
      body: "수집 항목과 보관 기간을 명시합니다. 개정 시 30일 전 공지합니다.",
    },
    {
      id: "nt-7",
      kind: "terms",
      title: "이용약관 v3.0",
      place: "푸터, 약관",
      date: "2026.04.18",
      status: "시행중",
      body:
        "제1조(목적) 이 약관은 회원이 서비스를 이용할 때의 권리, 의무와 책임을 정합니다.\n" +
        "제2조(회원) 가입 시 영업 직무 재직, 재직 이력 확인 절차를 거칩니다.\n" +
        "제3조(게시물) 회원이 작성한 리뷰, 글의 저작권은 작성자에게 있으며, 서비스는 노출, 보관에 필요한 범위에서만 이용합니다.\n" +
        "제4조(제한) 허위 사실, 특정 개인 식별, 광고성 게시물은 사전 통보 없이 블라인드될 수 있습니다.",
    },
    {
      id: "nt-8",
      kind: "terms",
      title: "운영정책 v1.4",
      place: "푸터, 약관",
      date: "2026.06.11",
      status: "시행중",
      body:
        "블라인드 기준, 개인 식별 정보, 명백한 허위, 동일 문구 반복 게시.\n" +
        "제재 단계, 1회 경고, 2회 7일 정지, 3회 영구 정지. 각 단계는 사유와 함께 기록되고 회원에게 통지됩니다.\n" +
        "이의 신청, 조치 후 14일 이내 신청할 수 있고, 담당자가 아닌 별도 검토자가 판단합니다.\n" +
        "운영자 조치는 모두 처리 기록에 남아 사후 확인이 가능합니다.",
    },
    {
      id: "nt-9",
      kind: "terms",
      title: "리뷰 정책 v2.0",
      place: "푸터, 약관",
      date: "2026.06.11",
      status: "시행중",
      body:
        "작성 자격, 해당 회사 재직 또는 퇴사 후 2년 이내, 영업 직무에 한합니다.\n" +
        "익명 보장, 작성자 정보는 운영자에게도 표시되지 않습니다. 신고 처리 시에도 계정 식별자만 다룹니다.\n" +
        "평점 축, 인센티브, 목표현실성, 매니저코칭, 계정배분, 성과압박 5개 축으로만 받습니다. 성과압박은 낮을수록 좋은 값으로 계산합니다.\n" +
        "수정, 삭제, 작성 후 30일 이내 수정 가능하며, 삭제 시 평점 집계에서도 즉시 제외됩니다.",
    },
    {
      id: "nt-10",
      kind: "faq",
      title: "신고는 어떻게 하고, 어떻게 처리되나요?",
      place: "푸터, 고객지원",
      date: "2026.06.20",
      status: "노출중",
      body:
        "글, 리뷰 우측의 신고를 누르고 사유를 고르면 접수됩니다. 접수 즉시 운영 큐에 쌓이고 담당자가 확인합니다.\n" +
        "처리 결과는 신고자에게 알림으로 전달되며, 조치가 있었다면 사유가 함께 표시됩니다.\n" +
        "허위 신고가 반복되면 신고 기능 이용이 제한될 수 있습니다.",
    },
  ],

  curation: {
    companies: [
      { id: "cs-1", name: "◇◇테크", meta: "4.3, 리뷰 212" },
      { id: "cs-2", name: "▓▓상사", meta: "4.1, 리뷰 128" },
      { id: "cs-3", name: "□□커머스", meta: "3.9, 리뷰 87" },
    ],
    // 홈 고정은 FEED title 문자열로 매칭된다 — 제목이 한 글자라도 다르면 조용히 탈락한다
    posts: [
      { id: "ps-1", name: "신규 거래처 뚫는 노하우 있나요?" },
      { id: "ps-2", name: "인센티브 구조, 5개 회사 비교해봤습니다" },
    ],
    banners: [
      { id: "bn-1", name: "가입하면 현직자 리뷰 전체 열람", meta: "노출중" },
    ],
    blockedKeywords: [],
  },

  jobs: SERVICE_JOBS.map((job) => ({
    id: job.id,
    companySlug: job.companySlug,
    company:
      SERVICE_COMPANIES.find((c) => c.slug === job.companySlug)?.name ??
      job.companySlug,
    title: job.title,
    employment: job.employment,
    career: job.career,
    payLow: job.payLow,
    payHigh: job.payHigh,
    daysLeft: job.daysLeft,
    status: "노출중" as const,
  })),

  admins: [
    {
      id: "adm-1",
      handle: "owner@demo.wigtn.dev",
      name: "김데모",
      role: "super",
      twoFA: true,
      lastActive: "오늘 09:12",
      status: "활성",
    },
    {
      id: "adm-2",
      handle: "admin.kim@demo.wigtn.dev",
      name: "김운영",
      role: "admin",
      twoFA: true,
      lastActive: "오늘 08:41",
      status: "활성",
    },
    {
      id: "adm-3",
      handle: "admin.lee@demo.wigtn.dev",
      name: "이관리",
      role: "admin",
      twoFA: false,
      lastActive: "3일 전",
      status: "활성",
    },
    {
      id: "adm-4",
      handle: "viewer.park@demo.wigtn.dev",
      name: "박열람",
      role: "viewer",
      twoFA: false,
      lastActive: "2주 전",
      status: "활성",
    },
    {
      id: "adm-5",
      handle: "audit.choi@demo.wigtn.dev",
      name: "최감사",
      role: "viewer",
      twoFA: true,
      lastActive: "-",
      status: "초대됨",
    },
  ],

  /* 1:1 문의 — 대기 둘, 답변완료 하나. 빈 큐로 시작하면 화면이 무엇을
     하는 곳인지 안 보이고, 전부 대기면 "답변완료로 옮겨진다"는 왕복도
     안 보인다. 분류는 사용자 폼(ContactForm)의 선택지와 같은 목록이다. */
  inquiries: [
    {
      id: "inq-1",
      category: "계정, 로그인",
      message:
        "닉네임을 바꾸고 싶은데 설정에서 찾지 못했어요. 익명 활동 기록과 분리해서 변경할 수 있나요?",
      by: "미림동재규어",
      at: "08.05 21:14",
      status: "대기",
    },
    {
      id: "inq-2",
      category: "회사 리뷰",
      message:
        "제가 쓴 리뷰를 회사에서 특정할 수 있는지 걱정돼요. 재직 인증 정보가 리뷰와 같이 보관되나요?",
      by: "필드세일러",
      at: "08.05 18:02",
      status: "대기",
    },
    {
      id: "inq-3",
      category: "실적 인증",
      message: "증빙 서류를 잘못 올렸는데 반려 전에 다시 제출할 수 있나요?",
      by: "성수클로저",
      at: "08.04 11:37",
      status: "답변완료",
      answer:
        "네, 검토 대기 상태에서는 실적 인증 화면에서 다시 제출하시면 최신 서류로 검토돼요. 이전 제출본은 자동으로 대체됩니다.",
      answeredAt: "2026-08-04T14:20:00+09:00",
    },
  ],

  policy: [
    {
      id: "pl-1",
      label: "글, 리뷰 열람",
      grants: ["yes", "yes", "yes", "yes"],
    },
    {
      id: "pl-2",
      label: "글, 댓글 작성",
      grants: ["no", "yes", "yes", "yes"],
    },
    {
      id: "pl-3",
      label: "회사 리뷰 작성",
      grants: ["no", "yes", "yes", "yes"],
      cond: { 1: "회사당 1건" },
    },
    {
      id: "pl-4",
      label: "콘텐츠 블라인드",
      grants: ["no", "no", "yes", "yes"],
      cond: { 2: "재인증 필요" },
    },
    {
      id: "pl-5",
      label: "회원 정지, 해제",
      grants: ["no", "no", "yes", "yes"],
      cond: { 2: "재인증 필요" },
    },
    {
      id: "pl-6",
      label: "증빙 승인, 반려",
      grants: ["no", "no", "yes", "yes"],
    },
    {
      id: "pl-7",
      label: "회사 등록, 엑셀 일괄",
      grants: ["no", "no", "yes", "yes"],
    },
    {
      id: "pl-8",
      label: "익명 리뷰 작성자 조회",
      grants: ["no", "no", "no", "yes"],
      cond: { 3: "감사 기록 필수" },
      locked: true,
      lockNote:
        "익명 보호는 서비스 신뢰의 근거라 운영자에게 열어줄 수 없어요, 최고 운영자만 사유를 남기고 조회합니다",
    },
    {
      id: "pl-9",
      label: "AI 운영 설정",
      grants: ["no", "no", "yes", "yes"],
    },
    {
      id: "pl-10",
      label: "공지, 큐레이션 발행",
      grants: ["no", "no", "yes", "yes"],
    },
    {
      id: "pl-11",
      label: "권한 정책 변경",
      grants: ["no", "no", "yes", "yes"],
      cond: { 2: "재인증 필요" },
    },
  ],
};

/* 표기 수치 동기화 — 백오피스 회사관리·큐레이션의 "리뷰 N"도 서비스 쪽과
   같은 정본(리뷰 시드 실개수)을 쓴다. 화면끼리 숫자가 갈라지면 안 된다. */
const serviceByName = new Map(
  SERVICE_COMPANIES.map((company) => [company.name, company]),
);
for (const row of seed.companies) {
  const service = serviceByName.get(row.name);
  if (service) {
    row.reviews = service.reviewCount;
    row.rating = service.score;
  }
}
for (const slot of seed.curation.companies) {
  const service = serviceByName.get(slot.name);
  if (service) {
    slot.meta = `${service.score.toFixed(1)}, 리뷰 ${service.reviewCount}`;
  }
}

