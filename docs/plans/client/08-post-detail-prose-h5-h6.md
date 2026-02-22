# 08. 본문 제목 h5·h6 스타일 (WYSIWYG 통합)

TinyMCE에서 h5/h6를 사용할 때 브라우저 기본값으로 본문보다 작아지는 문제를 방지하고, **Client·Backoffice 에디터·Backoffice 미리보기** 3곳에 동일한 제목 계층을 적용해 WYSIWYG을 맞춘 플랜.

참조: [03-post-detail.md](03-post-detail.md), [guides/client/04-post-detail.md](../../guides/client/04-post-detail.md), 백오피스 포스트/에디터 가이드.

---

## 배경

- **문제**: h5/h6에 CSS를 주지 않으면 브라우저 기본(h5: 0.83em, h6: 0.67em)이 적용되어 본문(1.0625rem)보다 작게 보임.
- **목표**: 3곳 모두 h1~h6를 동일한 크기·색·여백으로 맞춤.

| 위치 | 파일 | 역할 |
|------|------|------|
| 1 | apps/client/src/index.css | 사용자 글 상세 (.post-detail-prose) |
| 2 | apps/backoffice/.../PostEditor.jsx | 관리자 글 작성 (TinyMCE content_style) |
| 3 | apps/backoffice/.../PostDetail.jsx | 관리자 미리보기 (.admin-prose) |

---

## 크기 정리 (Client 기준)

| 요소 | 크기 | 비고 |
|------|------|------|
| 본문 (p) | 1.0625rem (약 17px) | 표준 |
| h1 | 1.75rem (28px) | 콘텐츠 최상위 제목 |
| h2 | 1.5rem (24px) | 밑줄로 구분 |
| h3 | 1.25rem (20px) | 중간 소제목 |
| h4 | 1.125rem (18px) | 문단 강조 |
| h5 | 1.0625rem | 본문과 동일, Bold로 구분 |
| h6 | 1rem | 보조색(회색), margin-top 2rem |

---

## 적용 내용 요약

1. **index.css**: `.post-detail-prose` [Heading] 섹션에 h5, h6 추가. 공통에 `word-break: keep-all`. h5=1.0625rem, h6=1rem+보조색.
2. **PostEditor.jsx**: `content_style`에 h1~h6 블록 추가 (28/24/20/18/16/15px, h6만 color #666).
3. **PostDetail.jsx**: `.admin-prose` 제목 선택자에 h5, h6 포함. h5/h6 규칙 추가. 다크 모드에서 h5(#f3f4f6), h6(#9ca3af) 색상 적용.

---

## 검증

- **Client**: 글 상세에서 h5/h6가 본문보다 작지 않고, h5=본문 크기(Bold), h6=1rem·보조색.
- **Backoffice 에디터**: TinyMCE에서 h5/h6 입력 시 16px·15px(회색)로 표시.
- **Backoffice 미리보기**: admin-prose에서 h5/h6가 Client와 동일한 크기·색·여백, 다크 모드 색상 적용.
