import { Crumb } from "@/components/Crumb";
import { JobsBoard } from "@/components/JobsBoard";

export const metadata = { title: "채용공고 | W 세일즈" };

/**
 * 채용공고 — 공고 옆에 현직자 평점이 같이 붙는 것이 이 서비스의 차별점.
 * 목록은 백오피스 채용 관리와 같은 오버레이를 읽는다(마감·등록 즉시 반영).
 */
export default function JobsPage() {
  return (
    <>
      <div className="pagehead">
        <Crumb items={[{ label: "채용공고" }]} />
        <div className="ttl">
          <div>
            <h1>채용공고</h1>
            <div className="desc">
              영업 직무만 골라서, 공고 옆에 현직자 평점과 리뷰가 같이 붙어요
            </div>
          </div>
        </div>
      </div>

      <div className="sec">
        <JobsBoard />
      </div>
    </>
  );
}
