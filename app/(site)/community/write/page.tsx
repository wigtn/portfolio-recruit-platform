import { PostComposer } from "@/components/PostComposer";
import { Crumb } from "@/components/Crumb";

export const metadata = { title: "글 쓰기 — W 세일즈" };

/** 시안 정본 06번 — .pagehead → .sec > .formgrid */
export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const { board } = await searchParams;
  return (
    <>
      <div className="pagehead">
        <Crumb
          items={[
            { label: "커뮤니티", href: "/community" },
            { label: "글 쓰기" },
          ]}
        />
        <div className="ttl">
          <div>
            <h1>글 쓰기</h1>
            <div className="desc">현장 경험을 나눠주세요 — 익명으로 안전하게</div>
          </div>
        </div>
      </div>
      <div className="sec">
        <PostComposer initialBoard={board} />
      </div>
    </>
  );
}
