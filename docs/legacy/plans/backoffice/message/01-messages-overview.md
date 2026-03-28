# 메시지(인사말) 관리

소개 페이지(about)의 인사말 메시지(과거/현재/미래 스타일)를 백오피스에서 CRUD로 관리.

## 참조

- [guides/common/01-db-schema.md](../../../guides/common/01-db-schema.md): about_messages 테이블
- [guides/common/02-api-spec.md](../../../guides/common/02-api-spec.md): GET /api/about/messages, GET/POST/PUT/DELETE /api/about_messages
- [plans/client/04-1-about-layout-implementation.md](../../client/04-1-about-layout-implementation.md): 전체 구현 계획(백오피스·API·클라이언트)

## 메뉴·라우트

- **소개 관리** 아코디언 하위: 메시지 → `/messages`, 경력, 프로젝트
- `MessageList.jsx`: `/messages` 페이지. 제목, 내용 요약, sort_order, 수정/삭제.

## API

- **공개**: GET /api/about/messages — 클라이언트 /about 인사말 영역
- **Admin**: GET/POST/PUT/DELETE /api/about_messages

## 구현 현황

완료. 백오피스 소개 메뉴에서 메시지 접근, CRUD 동작. 클라이언트 /about에서 인사말(제목·점·메시지 3개·이메일) 표시.
