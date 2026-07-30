import { Crumb } from "@/components/Crumb";
import { JobDetail } from "@/components/JobDetail";

export const metadata = { title: "채용공고 상세 | W 세일즈" };

/** 공고 상세 — 오버레이가 정본이라(백오피스 등록 공고 포함) 클라이언트가 그린다 */
export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <div className="pagehead">
        <Crumb
          items={[{ label: "채용공고", href: "/jobs" }, { label: "상세" }]}
        />
      </div>
      <div className="sec">
        <JobDetail jobId={id} />
      </div>
    </>
  );
}
