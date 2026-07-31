/**
 * 챗봇이 부를 수 있는 도구.
 *
 * 상담 챗봇이 말만 하면 "설명 잘하는 FAQ"에서 끝난다. 이 데모의 주장은
 * "말한 게 실제로 돌아간다"이므로, 챗봇도 화면을 실제로 움직일 수 있어야 한다.
 * "백오피스 보여줘"라고 하면 설명 대신 백오피스를 열어주는 쪽이 강하다.
 *
 * 도구는 **데모에서 실제로 되는 것만** 둔다. 모델이 부를 수 있는 도구를
 * 늘려 놓고 절반이 실패하면, 조작할 수 있다는 인상 자체가 무너진다.
 *
 * 서버(app/api/chat)는 이 정의를 OpenAI에 넘기고, 실행은 클라이언트가 한다.
 * 라우팅과 역할 전환은 브라우저에만 있는 상태이기 때문이다.
 *
 * ## 여기 없는 것
 *
 * 운영자 조치의 실행(글 가리기, 계정 정지, 삭제, 신고 처리)은 도구가 아니다.
 * 화면까지 안내하고 손은 사람이 댄다. 이 데모가 "위험한 작업 직전에 본인
 * 확인"을 자랑하는데 챗봇이 그걸 우회하면 자기 주장을 스스로 부순다.
 * 상담 폼도 열어주기만 한다. 이름과 연락처는 대신 적지 않는다.
 * 자세한 경계와 그 이유는 lib/demo/chat-guard.ts에 있다.
 *
 * ## 글과 공고를 id로 받지 않는 이유
 *
 * 모델에게 id 목록을 통째로 주면 프롬프트가 커지고, 없는 id를 지어내면
 * 빈 화면으로 간다. 대신 검색어를 받아 **있는 데이터 중에서** 고른다.
 * 못 찾으면 못 찾았다고 말한다. 그게 정확하다.
 */

import type { Field, ToolSpec } from "./chat-guard";
import { MAX_BODY, MAX_TITLE } from "./chat-guard";
import { TARGET_BY_ID, TARGET_ENUM, TARGET_GUIDE } from "./chat-targets";

/** 게시판. 글쓰기 화면이 가진 그대로 */
export const BOARDS = ["질문답변", "노하우", "실적인증", "자유"] as const;

export const COMPANY_SLUGS = [
  "diamond-tech",
  "block-trading",
  "square-commerce",
  "circle-trading",
  "triangle-electronics",
  "nabla-bio",
] as const;

export const MODULE_IDS = [
  "ui-kit",
  "api-contracts",
  "auth-membership",
  "content-engine",
  "ai-pipeline-sdk",
  "notification-file",
  "backoffice-frame",
] as const;

export const THEMES = ["indigo", "red", "amber", "ink"] as const;
export const ROLES = ["guest", "member", "admin"] as const;

/** 화면 id → 실제 경로. 데모가 가진 화면 전부 */
export const SCREEN_PATH = {
  home: "/",
  community: "/community",
  community_write: "/community/write",
  companies: "/companies",
  compare: "/compare",
  jobs: "/jobs",
  notices: "/notices",
  badges: "/badges",
  my: "/my",
  contact: "/contact",
  admin: "/admin",
  admin_reports: "/admin/reports",
  admin_questions: "/admin/questions",
  admin_members: "/admin/members",
  admin_companies: "/admin/companies",
  admin_jobs: "/admin/jobs",
  admin_notices: "/admin/notices",
  admin_curation: "/admin/curation",
  admin_badges: "/admin/badges",
  admin_ai: "/admin/ai",
  admin_audit: "/admin/audit",
  admin_policies: "/admin/policies",
} as const;

export type ScreenId = keyof typeof SCREEN_PATH;
export const SCREEN_ENUM = Object.keys(SCREEN_PATH) as ScreenId[];

/** 실행 결과를 방문자에게 알리는 한 줄. 무엇이 일어났는지 보이게 한다 */
export const SCREEN_LABEL: Record<string, string> = {
  home: "홈",
  community: "커뮤니티",
  community_write: "글쓰기",
  companies: "회사 리뷰",
  compare: "회사 비교",
  jobs: "채용공고",
  notices: "공지",
  badges: "배지",
  my: "내 정보",
  contact: "상담 요청",
  admin: "백오피스 대시보드",
  admin_reports: "신고 처리",
  admin_questions: "질문 관리",
  admin_members: "회원 관리",
  admin_companies: "회사 관리",
  admin_jobs: "채용공고 관리",
  admin_notices: "공지, 정책",
  admin_curation: "큐레이션",
  admin_badges: "배지 관리",
  admin_ai: "AI 운영",
  admin_audit: "처리 기록",
  admin_policies: "권한 정책",
};

/** 백오피스는 운영자만 본다. 열기 전에 역할을 올려야 하는 화면 */
export const ADMIN_SCREENS = new Set(
  SCREEN_ENUM.filter((id) => id.startsWith("admin")),
);

export const COMPANY_LABEL: Record<string, string> = {
  "diamond-tech": "◇◇테크",
  "block-trading": "▓▓상사",
  "square-commerce": "□□커머스",
  "circle-trading": "○○트레이딩",
  "triangle-electronics": "△△전자",
  "nabla-bio": "▽▽바이오",
};

export const ROLE_LABEL_KO: Record<string, string> = {
  guest: "게스트",
  member: "일반 회원",
  admin: "운영자",
};

/**
 * 조사를 붙인다.
 *
 * "일반 회원로 바꿨어요"가 실제로 화면에 나왔다. 받침이 있으면 '으로',
 * 없거나 ㄹ이면 '로'다. 이름표를 그대로 이어 붙이면 이런 게 샌다.
 */
export function withRo(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  // 한글 음절이 아니면 손대지 않는다
  if (code < 0xac00 || code > 0xd7a3) return `${word}로`;
  const finalConsonant = (code - 0xac00) % 28;
  // 받침이 없거나 ㄹ(8)이면 '로'
  return finalConsonant === 0 || finalConsonant === 8
    ? `${word}로`
    : `${word}으로`;
}

export const MODULE_LABEL: Record<string, string> = {
  "ui-kit": "디자인 시스템",
  "api-contracts": "연동 규격",
  "auth-membership": "인증과 등급",
  "content-engine": "게시판 엔진",
  "ai-pipeline-sdk": "AI 파이프라인",
  "notification-file": "알림과 파일",
  "backoffice-frame": "백오피스",
};

/* ── 도구 정의 ──
   OpenAI에 넘기는 스키마와, 실행 전 검문에 쓰는 명세를 나란히 둔다.
   둘이 떨어져 있으면 한쪽만 고치고 다른 쪽을 잊는다. */

type Tool = {
  name: string;
  description: string;
  /** OpenAI에 넘길 파라미터 스키마 */
  params: Record<string, unknown>;
  required?: string[];
  /** 실행 전 검문 명세 */
  spec: ToolSpec;
  /** 실행 중 표시할 사람 말 */
  running: string;
  /** 실행 중 돌릴 궤도 */
  orb: OrbMood;
};

/** thinking-orbs가 가진 여섯 상태 */
export type OrbMood =
  | "working"
  | "searching"
  | "solving"
  | "listening"
  | "composing"
  | "shaping";

const enumField = (values: readonly string[], required = true): Field => ({
  kind: "enum",
  values,
  required,
});

const TOOLS: Tool[] = [
  {
    name: "open_screen",
    description:
      "데모의 특정 화면으로 이동한다. 방문자가 어떤 기능을 '보여달라'고 하거나 " +
      "'어디서 볼 수 있냐'고 물으면 설명만 하지 말고 이 도구로 직접 열어준다. " +
      "admin으로 시작하는 화면은 운영자만 볼 수 있으므로 switch_role을 먼저 부른다.\n" +
      "여기에는 **화면 이름**만 온다. @로 시작하는 이름은 point_at이 짚는 " +
      "지점이지 화면이 아니다. 백오피스는 admin이다.",
    params: {
      screen: {
        type: "string",
        enum: SCREEN_ENUM,
        /* 한 줄에 하나씩 적는다. 쉼표로 이어 붙인 한 덩이로 주면 모델이
           대응을 못 읽는다. "백오피스 화면 열어줘"에 home을, "회원 관리"에
           contact를 고르는 일이 매번 재현됐다. 값은 열거로 강제되니 형태는
           틀리지 않는데, 어느 것인지를 못 고르면 소용이 없다. */
        description: `화면 이름과 그 뜻:\n${Object.entries(SCREEN_LABEL)
          .map(([id, label]) => `- ${id}: ${label}`)
          .join("\n")}`,
      },
    },
    required: ["screen"],
    spec: { fields: { screen: enumField(SCREEN_ENUM) } },
    running: "화면을 여는 중",
    orb: "shaping",
  },
  {
    name: "open_post",
    description:
      "커뮤니티 글 하나를 연다. 제목이나 주제로 찾는다. 방문자가 특정 글을 " +
      "보고 싶어 하거나, 신고와 블라인드가 어떻게 이어지는지 보여줄 때 쓴다.",
    params: {
      query: {
        type: "string",
        description: "찾을 글의 제목이나 주제. 짧게",
      },
    },
    required: ["query"],
    spec: { fields: { query: { kind: "text", limit: 60, required: true } } },
    running: "글을 찾는 중",
    orb: "searching",
  },
  {
    name: "open_job",
    description:
      "채용공고 하나를 연다. 회사명이나 직무로 찾는다. 지원 흐름을 보여줄 때 쓴다.",
    params: {
      query: { type: "string", description: "찾을 공고의 회사명이나 직무" },
    },
    required: ["query"],
    spec: { fields: { query: { kind: "text", limit: 60, required: true } } },
    running: "공고를 찾는 중",
    orb: "searching",
  },
  {
    name: "open_company",
    description:
      "특정 회사의 리뷰 상세를 연다. 평점 축, 연봉 범위, 현직자 리뷰를 " +
      "실제 화면으로 보여줄 때 쓴다.",
    params: {
      company: {
        type: "string",
        enum: COMPANY_SLUGS,
        description: Object.entries(COMPANY_LABEL)
          .map(([slug, label]) => `${slug}=${label}`)
          .join(", "),
      },
    },
    required: ["company"],
    spec: { fields: { company: enumField(COMPANY_SLUGS) } },
    running: "회사 리뷰를 여는 중",
    orb: "shaping",
  },
  {
    name: "search_site",
    description:
      "데모 안에서 검색한다. 방문자가 특정 주제나 회사를 찾고 싶다고 하면 " +
      "설명 대신 검색 결과 화면으로 데려간다.",
    params: {
      query: { type: "string", description: "검색어" },
      where: {
        type: "string",
        enum: ["companies", "community"],
        description: "companies=회사에서 찾기, community=글에서 찾기",
      },
    },
    required: ["query", "where"],
    spec: {
      fields: {
        query: { kind: "text", limit: 40, required: true },
        where: enumField(["companies", "community"]),
      },
    },
    running: "검색하는 중",
    orb: "searching",
  },
  {
    name: "point_at",
    description:
      "화면의 특정 지점으로 커서를 옮겨 짚거나 실제로 누른다. 말로 위치를 " +
      "설명하는 대신 이 도구로 직접 가리킨다. 다른 화면의 지점을 짚으려면 " +
      "open_screen으로 먼저 이동한 뒤 부른다. 여러 곳을 차례로 안내할 때는 " +
      "한 번에 하나씩, 순서대로 부른다.\n" +
      "지점 이름은 모두 @로 시작한다. 이 이름들은 화면 이름이 아니므로 " +
      "open_screen에 넣지 않는다.",
    params: {
      target: {
        type: "string",
        enum: TARGET_ENUM,
        description: `가리킬 지점.\n${TARGET_GUIDE}`,
      },
      note: {
        type: "string",
        description: "커서 옆에 띄울 한 줄 설명. 왜 여기를 보는지 짧게. 25자 안팎",
      },
      click: {
        type: "boolean",
        description:
          "true면 실제로 누른다. 눌러야 다음이 보이는 곳에만 true. " +
          "그냥 위치만 알려줄 땐 false",
      },
    },
    required: ["target", "note"],
    spec: {
      fields: {
        target: enumField(TARGET_ENUM),
        note: { kind: "text", limit: 40, noLinks: true, required: true },
        click: { kind: "flag" },
      },
    },
    running: "화면에서 위치를 찾는 중",
    orb: "searching",
  },
  {
    name: "show_module",
    description:
      "상담 페이지의 모듈 소개 중 특정 모듈로 스크롤한다. 방문자가 어떤 " +
      "모듈이 무엇인지 물으면 설명과 함께 그 자리를 열어 보여준다.",
    params: {
      module: {
        type: "string",
        enum: MODULE_IDS,
        description: Object.entries(MODULE_LABEL)
          .map(([id, label]) => `${id}=${label}`)
          .join(", "),
      },
    },
    required: ["module"],
    spec: { fields: { module: enumField(MODULE_IDS) } },
    running: "모듈 설명으로 이동하는 중",
    orb: "shaping",
  },
  {
    name: "switch_role",
    description:
      "방문자의 역할을 바꾼다. 백오피스는 운영자만 볼 수 있고 글쓰기 같은 " +
      "회원 전용 기능은 회원부터 열린다. 잠긴 화면이나 기능을 쓰려면 먼저 " +
      "이 도구로 역할을 올린다.",
    params: {
      role: {
        type: "string",
        enum: ROLES,
        description: "guest=게스트, member=일반 회원, admin=운영자",
      },
    },
    required: ["role"],
    spec: { fields: { role: enumField(ROLES) } },
    running: "역할을 바꾸는 중",
    orb: "solving",
  },
  {
    name: "set_theme",
    description:
      "화면 테마 색을 바꾼다. 방문자가 '우리 브랜드 색으로 보면 어떠냐'고 " +
      "물을 때 쓴다. 디자인 토큰 하나로 전 화면이 바뀐다는 것을 보여주는 도구다.",
    params: {
      theme: {
        type: "string",
        enum: THEMES,
        description: "indigo=기본 보라, red=빨강, amber=주황, ink=먹색",
      },
    },
    required: ["theme"],
    spec: { fields: { theme: enumField(THEMES) } },
    running: "테마를 입히는 중",
    orb: "solving",
  },
  {
    name: "set_brand_color",
    description:
      "고객사 브랜드 색을 그 자리에서 입혀본다. 정해진 네 가지 테마 밖의 " +
      "색을 원할 때 쓴다.",
    params: {
      hex: {
        type: "string",
        description:
          "적용할 색의 16진수 코드. '#' 포함 7자리(예: #0066ff). " +
          "방문자가 색 이름만 말하면 그에 맞는 코드로 바꿔서 넣는다",
      },
    },
    required: ["hex"],
    spec: { fields: { hex: { kind: "color", required: true } } },
    running: "브랜드 색을 입히는 중",
    orb: "solving",
  },
  {
    name: "write_post",
    description:
      "커뮤니티에 글을 실제로 등록한다. 방문자가 '글 한번 써봐', '이런 " +
      "내용으로 올려줘'라고 하면 쓴다. 글쓰기 화면을 열고 내용을 채운 뒤 " +
      "등록까지 한다. 회원 이상만 쓸 수 있다.",
    params: {
      board: {
        type: "string",
        enum: BOARDS,
        description: "올릴 게시판",
      },
      title: { type: "string", description: `글 제목. ${MAX_TITLE}자 이내` },
      body: {
        type: "string",
        description:
          `글 본문. ${MAX_BODY}자 이내. 주소나 태그는 넣지 않는다. ` +
          "영업 현장에서 있을 법한 내용으로 자연스럽게 쓴다",
      },
    },
    required: ["board", "title", "body"],
    spec: {
      needsRole: "member",
      fields: {
        board: enumField(BOARDS),
        title: { kind: "text", limit: MAX_TITLE, noLinks: true, required: true },
        body: { kind: "text", limit: MAX_BODY, noLinks: true, required: true },
      },
    },
    running: "글을 쓰는 중",
    orb: "composing",
  },
  {
    name: "answer_post",
    description:
      "커뮤니티 글에 답변을 단다. 어떤 글에 달지 검색어로 찾는다. " +
      "회원 이상만 쓸 수 있다.",
    params: {
      query: { type: "string", description: "답변을 달 글의 제목이나 주제" },
      text: { type: "string", description: "답변 내용. 300자 이내" },
    },
    required: ["query", "text"],
    spec: {
      needsRole: "member",
      fields: {
        query: { kind: "text", limit: 60, required: true },
        text: { kind: "text", limit: 300, noLinks: true, required: true },
      },
    },
    running: "답변을 다는 중",
    orb: "composing",
  },
  {
    name: "react_post",
    description:
      "커뮤니티 글에 반응한다. 도움돼요를 누르거나 스크랩한다. " +
      "반응이 화면 곳곳에 바로 반영되는 것을 보여줄 때 쓴다.",
    params: {
      query: { type: "string", description: "반응할 글의 제목이나 주제" },
      action: {
        type: "string",
        enum: ["like", "scrap"],
        description: "like=도움돼요, scrap=스크랩",
      },
    },
    required: ["query", "action"],
    spec: {
      needsRole: "member",
      fields: {
        query: { kind: "text", limit: 60, required: true },
        action: enumField(["like", "scrap"]),
      },
    },
    running: "반응을 남기는 중",
    orb: "working",
  },
  {
    name: "follow_company",
    description:
      "회사를 팔로우하거나 해제한다. 팔로우하면 내 정보와 홈에 반영된다.",
    params: {
      company: { type: "string", enum: COMPANY_SLUGS, description: "회사 slug" },
      follow: {
        type: "boolean",
        description: "true면 팔로우, false면 해제. 기본은 팔로우",
      },
    },
    required: ["company"],
    spec: {
      needsRole: "member",
      fields: { company: enumField(COMPANY_SLUGS), follow: { kind: "flag" } },
    },
    running: "회사를 팔로우하는 중",
    orb: "working",
  },
  {
    name: "apply_job",
    description:
      "채용공고에 지원한다. 어떤 공고인지 검색어로 찾는다. 지원하면 공고 " +
      "상세와 내 정보에 지원 완료로 남는다.",
    params: {
      query: { type: "string", description: "지원할 공고의 회사명이나 직무" },
    },
    required: ["query"],
    spec: {
      needsRole: "member",
      fields: { query: { kind: "text", limit: 60, required: true } },
    },
    running: "공고에 지원하는 중",
    orb: "working",
  },
  {
    name: "submit_evidence",
    description:
      "실적 인증을 신청한다. 신청하면 운영자 화면의 증빙 검토 대기열에 " +
      "실제로 쌓인다. 사용자 화면과 백오피스가 이어지는 것을 보여줄 때 쓴다.",
    params: {
      files: {
        type: "number",
        description: "첨부할 증빙 파일 수. 1에서 5 사이",
      },
    },
    required: ["files"],
    spec: {
      needsRole: "member",
      fields: { files: { kind: "count", min: 1, max: 5, required: true } },
    },
    running: "실적 인증을 신청하는 중",
    orb: "working",
  },
  {
    name: "show_notifications",
    description:
      "알림함을 연다. 방금 한 조작이 알림으로 어떻게 남는지 보여줄 때 쓴다.",
    params: {},
    spec: { fields: {} },
    running: "알림함을 여는 중",
    orb: "shaping",
  },
  {
    name: "show_progress",
    description:
      "방문자가 지금까지 무엇을 체험했는지 알려준다. '뭘 더 보면 되냐', " +
      "'어디까지 봤냐' 같은 질문에 쓴다. 화면은 옮기지 않는다.",
    params: {},
    spec: { fields: {} },
    running: "체험 기록을 확인하는 중",
    orb: "working",
  },
  {
    name: "open_contact",
    description:
      "상담 신청 폼으로 이동한다. 방문자가 견적이나 일정을 요청하거나 " +
      "상담을 원한다고 밝혔을 때만 쓴다. 대화 끝마다 습관적으로 부르지 않는다. " +
      "폼을 대신 채우거나 보내지는 않는다.",
    params: {},
    spec: { fields: {} },
    running: "상담 화면을 여는 중",
    orb: "shaping",
  },
  {
    name: "reset_demo",
    description:
      "이 브라우저의 체험 기록을 지우고 처음 상태로 되돌린다. 방문자가 " +
      "'초기화', '처음부터 다시'를 자기 입으로 요청했을 때만 쓴다. " +
      "되돌릴 수 없으므로 다른 의도로 추측해서 부르지 않는다.",
    params: {},
    spec: { needsIntent: true, fields: {} },
    running: "처음 상태로 되돌리는 중",
    orb: "working",
  },
];

/** OpenAI에 넘기는 정의. 이름과 설명이 곧 모델이 읽는 사용법이다 */
/**
 * OpenAI에 넘기는 정의.
 *
 * `strict: true`로 넘긴다. 그러면 모델이 스키마를 **지킬 수밖에 없다.**
 * 설명에 "이 값들 중에서 고르세요"라고 적는 건 부탁이고, 실제로 안 지켰다.
 * "백오피스 화면 열어줘"에 목록에 없는 `demo`를 넣는 일이 매번 재현됐다.
 * 열거값 밖은 아예 만들어질 수 없게 하는 편이 확실하다.
 *
 * 대신 규격이 까다롭다. 모든 인자가 required에 들어가야 하고
 * additionalProperties를 닫아야 한다. 선택 인자는 빼는 대신 null을 받을 수
 * 있게 해서 "안 씀"을 표현한다.
 */
export const CHAT_TOOLS = TOOLS.map((tool) => {
  const keys = Object.keys(tool.params);
  const need = new Set(tool.required ?? keys);
  const properties = Object.fromEntries(
    keys.map((key) => {
      const field = tool.params[key] as { type?: string } & Record<
        string,
        unknown
      >;
      // 선택 인자는 null을 함께 받는다. strict에서 required를 뺄 수 없다
      return [
        key,
        need.has(key) ? field : { ...field, type: [field.type, "null"] },
      ];
    }),
  );

  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      strict: true,
      parameters: {
        type: "object",
        properties,
        required: keys,
        additionalProperties: false,
      },
    },
  };
});

/** 실행 전 검문에 쓰는 명세 */
export const TOOL_SPECS: Record<string, ToolSpec> = Object.fromEntries(
  TOOLS.map((tool) => [tool.name, tool.spec]),
);

/**
 * 실행 중에 보여줄 이름.
 *
 * 방문자에게 `switch_role`이라고 보여줄 이유가 없다. 무엇을 하는 중인지
 * 사람 말로 알려주되, 끝난 뒤가 아니라 **하는 동안** 보여야 한다. 화면이
 * 저절로 바뀌는 몇 초 동안 아무 설명이 없으면 오작동으로 읽힌다.
 */
export const TOOL_RUNNING: Record<string, string> = {
  ...Object.fromEntries(TOOLS.map((tool) => [tool.name, tool.running])),
  /* 도구가 아니라 표시용. 조작을 마치고 마무리 말을 기다리는 동안 세워 둔다.
     이 줄이 없으면 걸음은 다 끝났는데 테두리만 계속 돌아서 고장으로 읽힌다 */
  __wrap: "답을 정리하는 중",
};

/**
 * 실행 중에 돌릴 궤도.
 *
 * 도구마다 성격이 다른데 로더가 하나면 표시가 상태를 말하지 않는 장식이 된다.
 * 찾는 일, 여는 일, 바꾸는 일, 쓰는 일을 각각 다른 결로 돌린다.
 */
export const TOOL_ORB: Record<string, OrbMood> = Object.fromEntries(
  TOOLS.map((tool) => [tool.name, tool.orb]),
);

/* 인자는 모델이 만든 JSON이라 문자열만 오지 않는다. click처럼 boolean으로
   오는 것도 있고, 아예 빠지기도 한다. 검문(chat-guard)이 모양을 맞춰 준다 */
export type ToolArgs = Record<string, unknown>;
export type ToolCall = { name: string; args: ToolArgs };

/**
 * 자리를 잘못 찾아온 값을 제자리로 접는다.
 *
 * 이름에 표식(@)을 붙여 화면과 지점을 갈랐지만, 그것으로 다 막았다고 보지
 * 않는다. 지점이 늘어나면 같은 혼동이 다른 모양으로 또 온다. 표식이 본
 * 수단이고 이건 그물이다.
 *
 * 화면 자리에 지점 이름이 오면 그 지점이 사는 화면으로 바꾼다. "백오피스
 * 열어줘"에 `admin_sidebar`가 왔다면 방문자가 원한 건 백오피스 화면이
 * 맞다. 거절하고 한 걸음을 버리는 것보다 알아듣는 편이 정확하다.
 *
 * 반대 방향은 접지 않는다. 지점 자리에 화면 이름이 오면 그 화면 어디를
 * 짚으라는 뜻인지 알 수 없고, 아무 데나 고르면 엉뚱한 곳을 강조한다.
 * 모르면 모른다고 하는 편이 낫다.
 */
export function repairArgs(name: string, args: ToolArgs): ToolArgs {
  if (name !== "open_screen") return args;
  const screen = args.screen;
  if (typeof screen !== "string") return args;
  if (screen in SCREEN_PATH) return args;

  const spot = TARGET_BY_ID[screen];
  // 어느 화면에나 있는 지점은 어디로 보낼지 정할 수 없다
  if (!spot || spot.where === "any") return args;

  const to = SCREEN_BY_PATH[spot.where.replace(/\/$/, "")];
  return to ? { ...args, screen: to } : args;
}

/* 지점이 사는 곳은 경로로 적혀 있고 화면 이름은 id다. 둘을 잇는 표.
   여기서 접두 경로가 겹치는 것들(/admin, /admin/reports)은 정확히 일치할
   때만 잡는다. 어림잡아 고르면 엉뚱한 화면을 여는 쪽이 더 나쁘다 */
const SCREEN_BY_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(SCREEN_PATH).map(([id, path]) => [path, id]),
);
