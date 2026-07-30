"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderSanitizedHtml, type ContentBlock } from "@wigtn/content-engine";
import { Icon } from "./Icon";
import { Coach } from "./Coach";
import { loadUser, saveUser } from "@/lib/demo/user";
import { useRole } from "@/lib/demo/role";
import { RoleModal } from "./demo/RoleModal";
import { FileDrop, type Accepted } from "./FileDrop";
import { markProgress } from "@/lib/demo/progress";
import { Select } from "./ds/Select";
import { toast } from "./ds/Toaster";
import {
  markRisky,
  sanitizePaste,
  type RiskySegment,
  type SanitizeHit,
} from "@/lib/demo/sanitize";
import { HOT_KEYWORDS } from "@/lib/seed/feed";

/**
 * 글 작성 — 시안 정본 06번 구조 그대로(.formgrid > .formcard, .wtabs/.toolbar/.wcode/.wpreview/.safenote).
 *
 * 살균은 연출이 아니다: 미리보기 HTML은 벤더링한 content-engine의 renderSanitizedHtml이
 * 실제로 만든다(회귀 테스트 content-engine 계약 테스트로 고정).
 * 톤 규칙(스펙 §03:236): 살균은 오류가 아니라 보호 — "차단/오류" 문구를 쓰지 않는다.
 */

const RISKY_RAW = `안녕하세요, 신규 거래처 정리한 내용 공유해요.

**대면 미팅이 콜드콜보다 빨랐어요**
· 전시회에서 담당자 명함 확보
· 1주 내 후속 연락

<script>alert("계정 정보 탈취")</script><img src="x" onerror="sendCookie()">`;

type Phase = "idle" | "scanning" | "striking" | "gone" | "fading";

const BOARDS = ["질문답변", "노하우", "실적인증", "자유"];

/** 고정 추천 태그 — 커뮤니티에서 실제로 자주 붙는 갈래 */
const SUGGESTED_TAGS = [
  "신규영업",
  "B2B",
  "콜드콜",
  "인센티브",
  "이직",
  "제약영업",
  "IT영업",
  "면접후기",
  "실적인증",
];
const DRAFT_KEY = "wigtn-demo-draft-v1";

export function PostComposer({ initialBoard }: { initialBoard?: string }) {
  // 게시판 탭에서 넘어온 명시적 선택 — 드래프트 복원보다 우선한다
  const boardFromQuery =
    initialBoard && BOARDS.includes(initialBoard) ? initialBoard : null;
  const { role } = useRole();
  const [gateOpen, setGateOpen] = useState(false);
  const [board, setBoard] = useState(boardFromQuery ?? BOARDS[0]);
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [phase, setPhase] = useState<Phase>("idle");
  // 검역 카드 — 방금 붙여넣은 원문(위험 조각 표시)과 걸러낸 내역
  const [quarantine, setQuarantine] = useState<RiskySegment[] | null>(null);
  const [hits, setHits] = useState<SanitizeHit[]>([]);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<Accepted[]>([]);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => timers.current.forEach((id) => window.clearTimeout(id)),
    [],
  );

  // 임시저장한 글이 있으면 되살린다 — 저장만 되고 안 돌아오면 저장이 아니다
  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Record<string, unknown> & Record<string, string>;
      if (!boardFromQuery) setBoard(draft.board ?? BOARDS[0]);
      setTitle(draft.title ?? "");
      setBody(draft.body ?? "");
      const savedTags = draft.tags;
      setTags(
        Array.isArray(savedTags)
          ? (savedTags as string[])
          : typeof savedTags === "string"
            ? savedTags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [],
      );
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  /** 등록 — 살균된 본문만 저장한다(원문이 아니라 모듈이 걸러낸 결과) */
  function publish() {
    // 권한 매트릭스 pl-2: 게스트는 글 작성 불가 — 실행 대신 로그인으로 유도한다
    if (role === "guest") {
      setError(
        "지금은 게스트로 보고 있어요. 글은 로그인해야 등록할 수 있어요.",
      );
      setGateOpen(true);
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const user = loadUser();
    saveUser({
      ...user,
      posts: [
        {
          id: `mine-${user.posts.length + 1}`,
          board,
          title: title.trim(),
          // 붙여넣은 위험 코드는 여기 들어오지 않는다 — content-engine이 걸러낸 뒤다
          body: body.replace(/<[^>]*>/g, "").trim(),
          tags,
          files: files.length,
          at: `${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        },
        ...user.posts,
      ],
    });
    window.localStorage.removeItem(DRAFT_KEY);
    setError(null);
    setSubmitted(true);
  }

  /** 위험 원문 유입 공통 처리 — 데모 버튼도, 실제 붙여넣기도 같은 문을 지난다.
      본문(textarea)에는 처음부터 **걸러진 텍스트**가 들어가 계속 편집 가능하고,
      검역 카드가 원문에서 무엇이 지워졌는지 스캔→취소선→소멸로 보여준다. */
  const runQuarantine = useCallback(
    (raw: string, insertAt?: { start: number; end: number }) => {
      const { clean, hits: found } = sanitizePaste(raw);
      if (insertAt) {
        setBody(
          (prev) =>
            prev.slice(0, insertAt.start) + clean + prev.slice(insertAt.end),
        );
      } else {
        setBody(clean);
      }
      if (found.length === 0) return false;

      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      setQuarantine(markRisky(raw));
      setHits(found);
      setPhase("scanning");
      const at = (ms: number, fn: () => void) =>
        timers.current.push(window.setTimeout(fn, ms));
      at(1000, () => setPhase("striking")); // 감지 → 취소선
      at(2100, () => {
        setPhase("gone"); // 위험 조각 소멸(자리 접힘)
        markProgress("content-safety");
      });
      at(3000, () => setPhase("fading")); // 오버레이가 걷히며 편집 상태로
      at(3350, () => {
        setQuarantine(null);
        setPhase("idle");
        toast(`안전하지 않은 코드 ${found.length}곳을 걸러냈어요. 서식은 그대로예요`, {
          tone: "success",
          pos: "top",
        });
      });
      return true;
    },
    [],
  );

  const pasteRisky = useCallback(() => {
    runQuarantine(RISKY_RAW);
  }, [runQuarantine]);

  /** 실제 붙여넣기 가로채기 — 위험이 있으면 걸러 넣고 검역 연출을 재생한다 */
  const onPaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const text = event.clipboardData.getData("text/plain");
      if (!text) return;
      const { hits: found } = sanitizePaste(text);
      if (found.length === 0) return; // 안전한 붙여넣기는 브라우저 기본 동작
      event.preventDefault();
      const editor = editorRef.current;
      runQuarantine(text, {
        start: editor?.selectionStart ?? body.length,
        end: editor?.selectionEnd ?? body.length,
      });
    },
    [body.length, runQuarantine],
  );

  const risky = hits.length > 0;
  const sanitized = safeRender(body);

  // 태그 — 추천(인기 키워드 포함) 풀에서 입력으로 거르고, 최대 5개
  const suggestedTags = useMemo(() => {
    const pool = Array.from(
      new Set([
        ...SUGGESTED_TAGS,
        ...HOT_KEYWORDS.map((keyword) => keyword.word),
      ]),
    );
    const needle = tagInput.trim().toLowerCase();
    return pool
      .filter(
        (word) =>
          !tags.includes(word) &&
          (!needle || word.toLowerCase().includes(needle)),
      )
      .slice(0, 8);
  }, [tags, tagInput]);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").replace(/,+$/, "");
    setTagInput("");
    if (!tag || tags.includes(tag)) return;
    if (tags.length >= 5) {
      toast("태그는 5개까지 붙일 수 있어요", { tone: "info" });
      return;
    }
    setTags((prev) => [...prev, tag]);
  };

  const format = (before: string, after = before, fallback = "텍스트") => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = body.slice(start, end) || fallback;
    const next = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };

  if (submitted) {
    return (
      <div className="formgrid">
        <div className="formcard">
          <h2
            style={{
              fontSize: 20,
              fontWeight: 850,
              letterSpacing: "-.03em",
              marginBottom: 6,
            }}
          >
            글이 등록됐어요
          </h2>
          <p
            style={{
              fontSize: "13.5px",
              color: "var(--ink-3)",
              marginBottom: 20,
            }}
          >
            살균을 거친 본문만 저장됐어요. 이 브라우저에만 남아요.
            <br />
            마이페이지 <b>내 글</b>에서 확인할 수 있어요.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="btn line" href="/community">
              커뮤니티로
            </a>
            <a className="btn primary" href="/my">
              내 글 보기
            </a>
          </div>
        </div>
        <div />
      </div>
    );
  }

  return (
    <div className="formgrid">
      <div className="formcard">
        <div className="field">
          <label>
            게시판<span className="req">*</span>
          </label>
          <Select
            value={board}
            onChange={setBoard}
            options={BOARDS.map((name) => ({ value: name, label: name }))}
            ariaLabel="게시판 선택"
          />
        </div>

        <div className="field">
          <label>
            제목<span className="req">*</span>
          </label>
          <input
            className="in"
            value={title}
            placeholder="제목을 입력하세요"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="field">
          <label>
            내용<span className="req">*</span>
          </label>

          <div className="weditor">
            <div className="wtabs">
              <span
                className={tab === "write" ? "on" : undefined}
                onClick={() => setTab("write")}
              >
                작성
              </span>
              <span
                className={tab === "preview" ? "on" : undefined}
                onClick={() => setTab("preview")}
              >
                미리보기
              </span>
              <em className="wcount">{body.length.toLocaleString()}자</em>
            </div>

            {tab === "write" ? (
              <>
                <div className="toolbar">
                  <button type="button" onClick={() => format("**", "**")}>
                    B
                  </button>
                  <button type="button" onClick={() => format("*", "*")}>
                    <i>I</i>
                  </button>
                  <button
                    type="button"
                    onClick={() => format("## ", "", "제목")}
                  >
                    H
                  </button>
                  <button
                    type="button"
                    onClick={() => format("> ", "", "인용문")}
                  >
                    “”
                  </button>
                  <button
                    type="button"
                    onClick={() => format("- ", "", "목록 항목")}
                  >
                    목록
                  </button>
                  <button
                    type="button"
                    onClick={() => format("[", "](https://)", "링크")}
                  >
                    링크
                  </button>
                  <button
                    type="button"
                    onClick={() => format("![", "](https://)", "이미지 설명")}
                  >
                    이미지
                  </button>
                </div>

                <div className="wbody">
                  <textarea
                    ref={editorRef}
                    className="in editor"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    onPaste={onPaste}
                    placeholder="내용을 입력하세요. 다른 곳에서 복사해 붙여넣어도 안전하게 정리돼요."
                  />
                  {quarantine ? (
                    /* 검역 연출 — 에디터 그 자리에서 붙여넣은 원문을 덮고,
                       위험 조각이 감지→취소선→소멸 후 걷히면 아래의 걸러진
                       본문(편집 가능)이 그대로 드러난다 */
                    <div className={`qoverlay is-${phase}`} aria-hidden>
                      {phase === "scanning" ? <i className="qscan" /> : null}
                      {quarantine.map((segment, index) =>
                        segment.risky ? (
                          <span
                            key={index}
                            className={
                              phase === "gone" || phase === "fading"
                                ? "riskline gone"
                                : phase === "striking"
                                  ? "riskline cut"
                                  : "riskline"
                            }
                            title={segment.label}
                          >
                            {segment.text}
                          </span>
                        ) : (
                          <span key={index}>{segment.text}</span>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="wpreview">
                {sanitized ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: sanitized }} />
                    <div
                      style={{
                        width: 110,
                        height: 70,
                        borderRadius: 8,
                        background: "var(--bg)",
                        border: "1px solid var(--line)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--ink-4)",
                        marginBottom: 10,
                      }}
                    >
                      <Icon name="image" style={{ width: 20, height: 20 }} />
                    </div>
                    {risky ? (
                      <span className="cut">
                        <Icon name="shield" style={{ width: 12, height: 12 }} />
                        이미지·서식은 남고, 실행 코드 {hits.length}곳만 빠졌어요
                      </span>
                    ) : null}
                  </>
                ) : (
                  <p style={{ color: "var(--ink-4)" }}>
                    작성한 내용이 여기 보여요.
                  </p>
                )}
              </div>
            )}
          </div>


          <div style={{ marginTop: 10 }}>
            <Coach id="write-sanitize">
              <b>위험한 코드가 섞인 글 붙여넣기</b>를 눌러보세요. 무엇이
              걸러지는지 보여드려요
            </Coach>
            <button type="button" className="demobtn" onClick={pasteRisky}>
              <span className="db">데모</span>위험한 코드가 섞인 글 붙여넣기
            </button>
          </div>

        </div>

        <div className="field">
          <label>
            태그{" "}
            <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
              (최대 5개)
            </span>
          </label>
          <div
            className="tagfield"
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className="tagpill">
                #{tag}
                <button
                  type="button"
                  aria-label={`${tag} 태그 제거`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setTags((prev) => prev.filter((item) => item !== tag));
                  }}
                >
                  <Icon name="x" />
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              value={tagInput}
              placeholder={
                tags.length === 0 ? "태그 검색 또는 입력 후 Enter" : "태그 추가"
              }
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addTag(tagInput);
                } else if (
                  event.key === "Backspace" &&
                  !tagInput &&
                  tags.length > 0
                ) {
                  setTags((prev) => prev.slice(0, -1));
                }
              }}
              aria-label="태그 검색 또는 입력"
            />
          </div>
          {suggestedTags.length > 0 && tags.length < 5 ? (
            <div className="tagsug">
              <span className="tagsug-cap">
                {tagInput.trim() ? "검색 결과" : "추천 태그"}
              </span>
              {suggestedTags.map((word) => (
                <button
                  key={word}
                  type="button"
                  className="tagsug-pill"
                  onClick={() => addTag(word)}
                >
                  <Icon name="plus" />
                  {word}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* 증빙 첨부 — 실적인증 게시판을 골랐을 때만 자연스럽게 나타난다 */}
        {board === "실적인증" ? (
          <div className="field ds-fade-in">
            <label>
              증빙 첨부<span className="req">*</span>
            </label>
            <FileDrop
              files={files}
              onChange={setFiles}
              compact
              note="증빙이 검토·승인되면 글에 인증 배지가 붙어요. JPG · PNG · WebP · PDF · 10MB까지"
            />
          </div>
        ) : null}

        <div
          className="formactions"
          style={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <span
            style={{
              fontSize: 12,
              color: error ? "var(--hot)" : "var(--ink-4)",
            }}
          >
            {error ? <b>{error}</b> : null}
            {error ? <br /> : null}
            {/* 실제 동작과 같은 약속만 — 등록한 글은 마이 "내 글"에 남고,
                AI 생성 체험은 커뮤니티 글 상세에서 한다 */}
            등록한 글은 마이페이지{" "}
            <b style={{ color: "var(--ink-2)" }}>내 글</b>에 남아요 ·{" "}
            <b style={{ color: "var(--accent-ink)" }}>AI 답변 생성</b>은
            커뮤니티 글 상세에서 체험할 수 있어요
          </span>
          <span style={{ display: "flex", gap: 10 }}>
            <button
              className="btn line"
              onClick={() => {
                window.localStorage.setItem(
                  DRAFT_KEY,
                  JSON.stringify({ board, title, body, tags }),
                );
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2000);
              }}
            >
              {saved ? "저장했어요" : "임시저장"}
            </button>
            <button className="btn primary" onClick={publish}>
              등록하기
            </button>
          </span>
        </div>
      </div>

      {/* 스크롤을 따라오는 안내 — 긴 본문을 쓰는 동안에도 규칙이 시야에 남는다 */}
      <div className="wside">
        <div className="card tipcard">
          <div className="tiphd">
            <span className="tipic">
              <Icon name="doc" />
            </span>
            <h4>작성 팁</h4>
          </div>
          <ul className="tiplist">
            <li>
              <Icon name="check" />
              구체적인 상황을 적을수록 답이 정확해져요
            </li>
            <li>
              <Icon name="eyeoff" />
              회사명·실명은 자동 비식별 처리돼요
            </li>
            <li>
              <Icon name="award" />
              실적 인증은 증빙 업로드 시 인증 배지가 붙어요
            </li>
          </ul>
        </div>
        <div className="card tipcard">
          <div className="tiphd">
            <span className="tipic warn">
              <Icon name="shield" />
            </span>
            <h4>커뮤니티 규칙</h4>
          </div>
          <ul className="tiplist">
            <li>
              <Icon name="flag" />
              비방·광고·개인정보 노출 글은 신고 후 자동 블라인드돼요
            </li>
          </ul>
        </div>
      </div>

      {gateOpen ? <RoleModal onClose={() => setGateOpen(false)} /> : null}
    </div>
  );
}

/** 평문을 구조화 블록으로 바꿔 content-engine에 넘긴다(살균은 모듈이 실제로 수행) */
function safeRender(raw: string) {
  if (!raw.trim()) return "";
  const blocks = raw
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .flatMap<ContentBlock>((chunk) => {
      const lines = chunk.split("\n").filter(Boolean);
      const items = lines.filter((line) => /^[-·]\s?/.test(line));
      if (items.length === lines.length && items.length > 0) {
        return [
          {
            type: "unordered-list",
            items: items.map((line) => line.replace(/^[-·]\s?/, "")),
          },
        ];
      }
      return [{ type: "paragraph", text: chunk.replace(/\*\*/g, "") }];
    });

  try {
    return renderSanitizedHtml({ version: 1, blocks });
  } catch {
    return "";
  }
}
