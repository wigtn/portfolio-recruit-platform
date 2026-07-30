import { notFound } from "next/navigation";
import { Crumb } from "@/components/Crumb";
import { COMPANIES, getCompany } from "@/lib/seed/companies";
import { ReviewComposer } from "@/components/ReviewComposer";

export function generateStaticParams() {
  return COMPANIES.map((company) => ({ slug: company.slug }));
}

/** 시안 정본 07번 — .pagehead → .sec > .formgrid */
export default async function ReviewWritePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  return (
    <>
      <div className="pagehead">
        <Crumb
          items={[
            { label: "회사 리뷰", href: "/companies" },
            { label: company.name, href: `/companies/${company.slug}` },
            { label: "리뷰 쓰기" },
          ]}
        />
        <div className="ttl">
          <div>
            <h1>{company.name} 리뷰 쓰기</h1>
            <div className="desc">
              운영팀도 작성자를 알 수 없어요. 솔직하게 남겨주세요
            </div>
          </div>
        </div>
      </div>
      <div className="sec">
        <ReviewComposer company={company} />
      </div>
    </>
  );
}
