# Task Plan: chatbot-cost-security

> **Generated from**: docs/prd/PRD_chatbot-cost-security.md
> **Created**: 2026-08-01
> **Status**: pending

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | false | 사용자 확인 후 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 권장(리스크 분리) |
| `quality_gate` | true | 커밋 전 품질 검사 |

## Phases

### Phase 1: 프롬프트 압축 + 캐싱 + 모델 교체 (①④⑤)
- [ ] SYSTEM → SYSTEM_ROUTER / SYSTEM_ANSWER 분할 (FR-001~003)
- [ ] 툴/답변 콜에 각 프롬프트 + prompt_cache_key 적용 (FR-002/004)
- [ ] 모델 gpt-4o-mini → gpt-5.6-luna, 파라미터 호환 검증 (FR-011)
- [ ] ai-answer/route.ts 모델·xff 반영

### Phase 2: 순수 Q&A 툴콜 생략 (①④)
- [ ] INTENTS 키워드 + 화면동사 부재 판별기 (FR-005)
- [ ] 판별 시 툴 판단 콜 스킵 → 답변 직행

### Phase 3: 서버 측 툴 RBAC (②)
- [ ] role 수신·열거 강등 (FR-006)
- [ ] role 기반 CHAT_TOOLS 노출 필터 (FR-007)
- [ ] 반환 tool_calls 서버 재검문(guard 순수화 재사용) (FR-008/012)
- [ ] ChatWidget.tsx가 role 전송

### Phase 4: 비로그인 rate limit 강화 (③)
- [ ] wigtn_anon HMAC 서명 쿠키 (FR-009)
- [ ] IP + 세션 이중 축 allow() (FR-009)
- [ ] xff 신뢰 축소 (FR-010)

### Phase 5: 테스트 & 검증
- [ ] 신규 단위 테스트(재검문/role/순수Q&A/쿠키)
- [ ] chat-guard.test.ts 회귀
- [ ] 데모 수동 회귀 + 토큰/비용 전후 비교

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 0/18 |
| Current Phase | - |
| Status | pending |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| - | - | - | - |
