import { InquiriesQueue } from "@/components/admin/InquiriesQueue";

export const metadata = { title: "1:1 문의, 백오피스" };

/**
 * 1:1 문의 큐 — 사용자 /contact 접수가 이 화면으로 온다.
 * 문의 확인부터 운영자 답변 등록까지 여기서 끝내고, 결과는 문의자의
 * 알림 벨로 돌아간다.
 * (제목은 셸 헤더가 말한다 — 화면에는 본문만 둔다, 다른 admin 라우트와 동일)
 */
export default function InquiriesPage() {
  return <InquiriesQueue />;
}
