import type { Metadata } from "next";
import { IconSprite } from "@/components/IconSprite";
import { Toaster } from "@/components/ds/Toaster";
import { DemoGuideWidget } from "@/components/demo/DemoGuideWidget";
import { ChatWidget } from "@/components/demo/ChatWidget";
import { RoleProvider } from "@/lib/demo/role";
import "./globals.css";

export const metadata: Metadata = {
  title: "W 세일즈 | 영업 커리어 인텔리전스",
  description:
    "영업직이 직접 남긴 익명 리뷰와 현장 질문답변. 모든 회사·회원·수치는 가상 데이터입니다.",
};

/** 루트 — 서비스 셸(nav·footer)은 (site)가, 백오피스 셸은 /admin이 각자 갖는다 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 첫 페인트 전에 폰트가 도착하면 스왑 리플로우 자체가 없다 */}
        <link
          rel="preload"
          href="/fonts/PretendardVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <IconSprite />
        <Toaster />
        <RoleProvider>
          {children}
          <DemoGuideWidget />
          <ChatWidget />
        </RoleProvider>
      </body>
    </html>
  );
}
