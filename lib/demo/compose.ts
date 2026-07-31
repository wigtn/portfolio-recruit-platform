/**
 * 챗봇이 글쓰기 화면을 대신 채울 때 쓰는 신호.
 *
 * 챗봇이 사용자 상태에 글을 직접 써넣는 게 빠르지만, 그러면 살균과 권한
 * 확인을 건너뛴 길이 하나 더 생긴다. 문이 둘이면 언젠가 한쪽은 안 잠긴다.
 * 그래서 화면을 열고 **그 화면의 등록 절차를 그대로 태운다.** 사람이 손으로
 * 쓸 때와 같은 코드가 돈다.
 *
 * 끝나면 반드시 완료 신호를 되돌려 준다. 안 그러면 챗봇이 등록됐는지 모른 채
 * 다음 걸음으로 넘어가고, 실패했는데 "썼어요"라고 말하게 된다.
 */

/** 챗봇 → 글쓰기 화면. 내용을 채우고 등록해 달라 */
export const COMPOSE_EVENT = "wigtn-demo-compose";

/** 글쓰기 화면 → 챗봇. 끝났다(error가 있으면 실패) */
export const COMPOSE_DONE_EVENT = "wigtn-demo-compose-done";

/**
 * 글쓰기 화면 → 챗봇. 아직 쓰는 중이다.
 *
 * 상한을 초로 재면 안 되는 이유가 있다. 방문자가 다른 탭으로 옮기면 브라우저가
 * 타이머를 1초 단위로 늦춘다. 그러면 1.3초짜리 타이핑이 30초가 되고, 멀쩡히
 * 돌고 있는 일을 실패로 끊게 된다. 실제로 그랬다.
 *
 * 그래서 시간이 아니라 **소식이 끊겼는지**를 본다. 한 걸음 쓸 때마다 살아
 * 있다고 알리고, 챗봇은 그 소식이 멎을 때만 실패로 본다. 느린 것과 죽은 것은
 * 다른 일이다.
 */
export const COMPOSE_TICK_EVENT = "wigtn-demo-compose-tick";

export type ComposeRequest = {
  board: string;
  title: string;
  body: string;
};

export type ComposeResult = {
  /** 실패 사유. 없으면 등록됐다 */
  error?: string;
};
