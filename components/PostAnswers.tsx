"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/seed/posts";
import { AiAnswerCard } from "./AiAnswerCard";
import { Icon } from "./Icon";
import { AnonymousIdentity } from "./AnonymousIdentity";
import { ReportModal } from "./ReportModal";
import { RoleModal } from "./demo/RoleModal";
import { useRole } from "@/lib/demo/role";
import { loadUser, saveUser, type MyAnswer } from "@/lib/demo/user";
import {
  loadState,
  subscribeState,
  type OperatorAnswer,
} from "@/lib/admin/overlay";

/**
 * 답변 영역 — 시안 정본 05번 `.cmts` 구조 그대로.
 * .cmts-head(제목 + .statetoggle 데모 장치) → 운영자 답변 → 회원 답변(.comment)
 * → AI 카드 → .commentinput
 *
 * 회원 답변 유무를 토글로 바꿔볼 수 있다. "있음"으로 두고 AI를 생성하면 순차 등록 후
 * AI 카드가 접힌다 — "사람이 답하면 AI는 물러난다"가 이 화면이 파는 메시지다.
 *
 * 운영자 답변은 백오피스 질문 큐(question.answer)의 오버레이를 읽어 병합한다 —
 * 토글과 무관하게 항상 보인다. 운영자가 등록한 공식 답변이 데모 장치에 숨으면
 * "등록 즉시 사용자에게 보인다"는 왕복이 끊긴다.
 */
export function PostAnswers({ post }: { post: Post }) {
  const { role } = useRole();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateNote, setGateNote] = useState(false);
  const [answer, setAnswer] = useState("");
  const [mine, setMine] = useState<MyAnswer[]>([]);
  const [official, setOfficial] = useState<OperatorAnswer[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [reporting, setReporting] = useState<number | null>(null);
  // 인라인 대댓글 — 어느 댓글 아래에 입력창이 열려 있나
  const [replyTo, setReplyTo] = useState<string | null>(null);
  // AI 참고 답변이 게시됐는지 — 답변 카운트에 포함한다
  const [aiPosted, setAiPosted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMine(loadUser().answers.filter((item) => item.postId === post.id));
    return () => timers.current.forEach((timer) => window.clearTimeout(timer));
  }, [post.id]);

  // 운영자 답변은 구독으로 따라간다 — 다른 탭의 백오피스에서 등록해도
  // 이 화면이 즉시 반영돼야 "등록 즉시 보인다"가 거짓말이 아니다
  useEffect(() => {
    const sync = () =>
      setOfficial(
        loadState().answers.filter((item) => item.postId === post.id),
      );
    sync();
    return subscribeState(sync);
  }, [post.id]);

  const topMine = mine.filter((item) => !item.parentId);
  const replies = mine.filter((item) => item.parentId);

  /* 시드 답변만 리빌 연출 대상 — 내 답변은 토글과 무관하게 항상 보인다.
     (예전엔 "회원 답변 없음" 상태로 재방문하면 내 답변까지 숨어
     "초기화된 것"처럼 보였다) */
  const comments = post.comments.map((comment, index) => ({
    id: `${post.id}-seed-${index}`,
    author: comment.author,
    years: comment.years,
    text: comment.text,
    // 시드 추천수 — 자리별 고정값(들쭉하지만 재현 가능)
    baseLikes: ((index + 1) * 7) % 13 + 4,
  }));

  const submitAnswer = () => {
    // 권한 매트릭스 pl-2: 게스트는 댓글 작성 불가 — 실행 대신 로그인으로 유도한다
    if (role === "guest") {
      setGateNote(true);
      setGateOpen(true);
      return;
    }
    setGateNote(false);
    const text = answer.trim();
    if (!text) {
      inputRef.current?.focus();
      return;
    }
    const next: MyAnswer = {
      id: `${post.id}-mine-${crypto.randomUUID()}`,
      postId: post.id,
      text,
      at: new Date().toISOString(),
    };
    const user = loadUser();
    saveUser({ ...user, answers: [...user.answers, next] });
    setMine((items) => [...items, next]);
    setAnswer("");
  };

  const removeMine = (id: string) => {
    const user = loadUser();
    saveUser({
      ...user,
      // 대댓글의 부모를 지우면 딸린 대댓글도 함께 지운다
      answers: user.answers.filter(
        (item) => item.id !== id && item.parentId !== id,
      ),
    });
    setMine((items) =>
      items.filter((item) => item.id !== id && item.parentId !== id),
    );
  };

  const submitReply = (parentId: string) => {
    if (role === "guest") {
      setGateNote(true);
      setGateOpen(true);
      return;
    }
    const text = replyText.trim();
    if (!text) return;
    const next: MyAnswer = {
      id: `${post.id}-mine-${crypto.randomUUID()}`,
      postId: post.id,
      text,
      at: new Date().toISOString(),
      parentId,
    };
    const user = loadUser();
    saveUser({ ...user, answers: [...user.answers, next] });
    setMine((items) => [...items, next]);
    setReplyText("");
    setReplyTo(null);
  };

  return (
    <div className="cmts">
      <div className="cmts-head">
        <h4>
          답변
          {/* 총수 = 시드 답변 + 내 답변 + 운영자 답변 + AI(게시 시) —
              화면에 실제로 보이는 것과 같은 수만 센다 */}
          {(() => {
            const total =
              comments.length +
              mine.length +
              official.length +
              (aiPosted ? 1 : 0);
            if (total === 0) return null;
            return (
              <span style={{ color: "var(--ink-4)", fontWeight: 600 }}>
                {" "}
                {total}
              </span>
            );
          })()}
        </h4>
      </div>

      {/* 운영자 답변 — 토글 밖에 둔다(공식 답변은 데모 상태와 무관하게 항상 보인다) */}
      {official.length > 0 ? (
        <div id="operatorAnswers">
          {official.map((item, index) => (
            <div className="comment" key={`${post.id}-op-${index}`}>
              <div className="cbody">
                <div className="cwho">
                  <span className="tag">운영자</span>
                  <span>공식 답변</span>
                </div>
                <div className="ctext">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div id="memberAnswers">
        {comments.map((comment, index) => (
          <div className="comment is-in" key={comment.id}>
            <div className="cbody">
              <div className="cwho">
                <AnonymousIdentity />
                <span>영업 {comment.years}년차</span>
              </div>
              <div className="ctext">{comment.text}</div>
              <div className="cact">
                <button
                  className={liked.has(comment.id) ? "on" : undefined}
                  onClick={() =>
                    setLiked((current) => {
                      const next = new Set(current);
                      if (next.has(comment.id)) next.delete(comment.id);
                      else next.add(comment.id);
                      return next;
                    })
                  }
                >
                  <Icon name="like" />
                  {comment.baseLikes + (liked.has(comment.id) ? 1 : 0)}
                </button>
                <button
                  onClick={() => {
                    // 해당 댓글 바로 아래 인라인 입력창을 연다
                    setReplyTo((current) =>
                      current === comment.id ? null : comment.id,
                    );
                    setReplyText("");
                  }}
                >
                  답글
                </button>
                <button
                  style={{ marginLeft: "auto", color: "var(--ink-5)" }}
                  onClick={() => setReporting(index)}
                >
                  신고
                </button>
              </div>

              {/* 이 댓글에 달린 내 대댓글 */}
              {replies
                .filter((reply) => reply.parentId === comment.id)
                .map((reply) => (
                  <div className="creply" key={reply.id}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="cwho">
                        <AnonymousIdentity />
                        <span>영업 4년차 · 방금</span>
                      </div>
                      <div className="ctext">{reply.text}</div>
                      <div className="cact">
                        <button
                          style={{ color: "var(--ink-5)" }}
                          onClick={() => removeMine(reply.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* 답글 인라인 입력 — 누른 자리 바로 아래 */}
              {replyTo === comment.id ? (
                <div className="replybox">
                  <input
                    className="in"
                    autoFocus
                    value={replyText}
                    placeholder="이 답변에 답글을 남겨보세요"
                    onChange={(event) => setReplyText(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing
                      )
                        submitReply(comment.id);
                      if (event.key === "Escape") setReplyTo(null);
                    }}
                  />
                  <button
                    className="btn primary sm"
                    onClick={() => submitReply(comment.id)}
                  >
                    등록
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* 내가 단 답변 — 데모 토글과 무관하게 항상 보인다(재방문 포함) */}
      {topMine.length > 0 ? (
        <div id="myAnswers">
          {topMine.map((item) => (
            <div className="comment is-in" key={item.id}>
              <div className="cbody">
                <div className="cwho">
                  <AnonymousIdentity />
                  <span>영업 4년차 · 내가 쓴 답변</span>
                </div>
                <div className="ctext">{item.text}</div>
                <div className="cact">
                  <button
                    onClick={() => {
                      setReplyTo((current) =>
                        current === item.id ? null : item.id,
                      );
                      setReplyText("");
                    }}
                  >
                    답글
                  </button>
                  <button
                    style={{ marginLeft: "auto", color: "var(--ink-5)" }}
                    onClick={() => removeMine(item.id)}
                  >
                    삭제
                  </button>
                </div>

                {replies
                  .filter((reply) => reply.parentId === item.id)
                  .map((reply) => (
                    <div className="creply" key={reply.id}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="cwho">
                          <AnonymousIdentity />
                          <span>영업 4년차 · 방금</span>
                        </div>
                        <div className="ctext">{reply.text}</div>
                        <div className="cact">
                          <button
                            style={{ color: "var(--ink-5)" }}
                            onClick={() => removeMine(reply.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {replyTo === item.id ? (
                  <div className="replybox">
                    <input
                      className="in"
                      autoFocus
                      value={replyText}
                      placeholder="이 답변에 답글을 남겨보세요"
                      onChange={(event) => setReplyText(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.nativeEvent.isComposing
                        )
                          submitReply(item.id);
                        if (event.key === "Escape") setReplyTo(null);
                      }}
                    />
                    <button
                      className="btn primary sm"
                      onClick={() => submitReply(item.id)}
                    >
                      등록
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <AiAnswerCard
        postId={post.id}
        draft={post.aiDraft}
        guarded={post.guarded}
        onPosted={() => setAiPosted(true)}
      />

      {/* 모달에서 로그인하면 안내도 함께 걷는다 — 로그인했는데 남아 있으면 거짓말 */}
      {gateNote && role === "guest" ? (
        <div className="safenote" style={{ margin: "18px 0 0" }}>
          <b>지금은 게스트로 보고 있어요. 답변은 로그인해야 남길 수 있어요.</b>
        </div>
      ) : null}

      <div className="commentinput" style={{ margin: "18px 0 0" }}>
        <input
          ref={inputRef}
          className="in"
          value={answer}
          placeholder="답변을 남겨보세요"
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing)
              submitAnswer();
          }}
        />
        <button className="btn primary" onClick={submitAnswer}>
          등록
        </button>
      </div>

      {gateOpen ? <RoleModal onClose={() => setGateOpen(false)} /> : null}

      {reporting !== null && comments[reporting] ? (
        <ReportModal
          subject={{
            id: `comment-${comments[reporting].id}`,
            target: "익명 댓글",
            kind: "댓글",
            body: comments[reporting].text,
            author: "익명",
          }}
          onClose={() => setReporting(null)}
        />
      ) : null}
    </div>
  );
}
