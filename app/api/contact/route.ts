import { NextResponse } from "next/server";

/**
 * 실제 상담 접수는 제공하지 않는다. 1:1 문의는 클라이언트의 데모 오버레이
 * (운영자 문의 큐)에만 저장되며, 오래된 클라이언트가 이 경로를 호출해도
 * 외부 발송은 일어나지 않는다.
 */
export function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "1:1 문의는 데모 안에만 저장되며 외부로 전송되지 않아요.",
    },
    { status: 410 },
  );
}
