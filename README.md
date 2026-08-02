# portfolio-recruit-platform

영업직 커리어 플랫폼을 주제로 만든 **동작하는 데모**입니다.
글을 신고하면 운영자 화면의 처리 큐에 실제로
쌓이고, 운영자가 처리하면 다시 사용자 화면으로 결과가 돌아옵니다.

무엇을 만들 수 있는지 말로 설명하는 대신 눌러볼 수 있게 하려고 만들었습니다.

## 무엇이 들어 있나

| 영역 | 내용 |
|---|---|
| 서비스 | 커뮤니티, 회사 리뷰, 회사 비교, 채용공고, 공지, 배지, 내 정보 |
| 백오피스 | 대시보드, 신고 처리, 회원, 증빙 검토, 콘텐츠, 큐레이션, 감사 기록, 권한 정책 |
| AI | 글 상세의 참고 답변 생성, 화면을 직접 조작하는 상담 챗봇 |

상담 챗봇은 말만 하지 않습니다. 화면을 옮기고, 역할을 바꾸고, 커서로 짚고,
글을 대신 씁니다. 다만 운영자 조치의 실행(글 가리기, 계정 정지, 삭제)은
도구로 두지 않았습니다. 화면까지 안내하고 손은 사람이 댑니다.

## 실행

```bash
npm install
npm run dev
```

### 비공개 패키지

코어 모듈 셋은 GitHub Packages의 비공개 패키지입니다.

- `@wigtn/ui-kit` 디자인 시스템
- `@wigtn/content-engine` 게시판 엔진과 살균
- `@wigtn/backoffice-frame` 백오피스 셸

설치하려면 `read:packages` 권한 토큰이 필요합니다.

```bash
export NODE_AUTH_TOKEN=<토큰>
npm install
```

토큰이 없으면 설치가 401로 멈춥니다.

### 환경변수

`.env.example`을 `.env.local`로 복사해서 채웁니다. **전부 선택입니다.**
아무것도 넣지 않아도 데모는 완결됩니다. AI는 준비된 답변으로, 상담 접수는
503으로 정직하게 응답합니다. 없는 기능을 성공한 척하지 않습니다.

| 변수 | 없으면 |
|---|---|
| `WIGTN_OPENAI_API_KEY` | AI 답변과 챗봇이 준비된 답변으로 동작 |
| `WIGTN_RESEND_API_KEY` | 상담 접수가 503 |
| `CONTACT_FROM`, `CONTACT_TO` | 발신, 수신 주소 |
| `WIGTN_COOKIE_SECRET` | 실호출 한도가 IP 축만으로 degrade |

키를 넣으면 AI를 실제로 부릅니다. 비로그인 데모라 한도가 곧 비용
방어선인데, 그 기준과 걸렸을 때 화면에 뜨는 것은
[docs/ai-rate-limits.md](docs/ai-rate-limits.md)에 정리해 뒀습니다.

## 검증

```bash
npm run typecheck
npm test          # 단위
npm run test:e2e  # 브라우저 (Playwright)
```

E2E는 프로덕션 빌드 기준으로 도는 것이 정확합니다. `next build` 뒤 개발
서버를 띄우면 `.next`가 어긋나 전부 깨집니다.

```bash
npm run build && npx next start -p 3103
npx playwright test
```

## 데이터

모든 회사, 회원, 수치는 가상입니다. 눌러서 만든 것은 그 브라우저에만
저장되고 다른 방문자에게 보이지 않습니다.
