import { QuestionsQueue } from "@/components/admin/QuestionsQueue";

export const metadata = { title: "질문 관리 | 백오피스" };

/**
 * 답변 없는 질문 큐 — 대시보드 운영 큐의 "답변 없는 질문"이 이 화면으로 온다.
 * 예전에는 커뮤니티 목록(사용자 화면)으로 내보내 백오피스를 벗어났다 —
 * 질문 확인부터 운영자 답변 등록까지 여기서 끝낸다.
 * (제목은 셸 헤더가 말한다 — 화면에는 본문만 둔다, 다른 admin 라우트와 동일)
 */
export default function QuestionsPage() {
  return <QuestionsQueue />;
}
