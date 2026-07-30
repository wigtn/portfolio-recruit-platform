import type { NextConfig } from "next";

// 서버리스 데모 — DB·외부 서비스 의존 없음(기획서 §6).
// 서버 예외는 AI 프록시·상담 접수 라우트 2개뿐이며 둘 다 Vercel Function으로 충분하다.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@wigtn/backoffice-frame",
    "@wigtn/content-engine",
    "@wigtn/ui-kit",
  ],
  webpack(config) {
    // file: 링크로 연결한 SoT 모듈의 의존성을 소비 앱의 node_modules에서 찾는다.
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
