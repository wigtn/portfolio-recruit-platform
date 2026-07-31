import { NoticeList } from "@/components/NoticeList";
import { Crumb } from "@/components/Crumb";
import type { Notice } from "@/lib/admin/seed";

export const metadata = { title: "공지, 정책 | W 세일즈" };

/**
 * 서비스 쪽 공지·약관 — 백오피스 `공지 · 정책`이 올리고 내리는 대상이다.
 * 푸터 링크가 전부 여기로 온다(탭만 다르게).
 */
export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; doc?: string }>;
}) {
  const { kind = "notice", doc } = await searchParams;

  return (
    <>
      <div className="pagehead">
        <Crumb items={[{ label: "고객지원" }, { label: "공지, 정책" }]} />
        <div className="ttl">
          <div>
            <h1>공지, 정책</h1>
            <div className="desc">서비스 안내와 약관을 확인하세요</div>
          </div>
        </div>
      </div>

      <div className="sec">
        <NoticeList kind={kind as Notice["kind"]} doc={doc} />
      </div>
    </>
  );
}
