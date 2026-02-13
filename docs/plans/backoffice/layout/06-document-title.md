# 백오피스 브라우저 타이틀: 페이지명 | 관리자

구현 후 해당 항목을 체크.

참조: [02-implemented-features.md](02-implemented-features.md), [05-primary-templating-darkmode-completion.md](05-primary-templating-darkmode-completion.md)

---

## 목표

- 현재: 모든 페이지에서 `index.html`의 `<title>정의랩 관리자</title>`만 사용해 탭 제목이 동일함.
- 변경: 라우트/페이지별로 **"페이지명 | 관리자"** 형태로 탭 제목 표시. 단 **대시보드(/)는 "정의랩 관리자"** 그대로 사용.
- 로그인 페이지: **"관리자 로그인 | 정의랩"**.

---

## 수정 파일

- `apps/backoffice/index.html` — 기본값 유지
- `apps/backoffice/src/components/AdminLayout.jsx` — getPageTitle 매핑 정리, document.title useEffect
- `apps/backoffice/src/components/LoginPage.jsx` — 로그인 전용 타이틀 및 cleanup
- `apps/backoffice/src/pages/posts/PostDetail.jsx` — 글 제목 반영 document.title

---

## 구현 체크리스트

- [ ] **1** AdminLayout getPageTitle(): `/messages`→"메시지 관리", `/careers`→"경력 관리", `/careers/new`→"경력 등록", `/projects`→"프로젝트 관리", `/projects/new`→"프로젝트 등록" 반영.
- [ ] **2** AdminLayout에 useEffect: `currentPath === '/'`이면 `document.title = '정의랩 관리자'`, 그 외 `document.title = \`${getPageTitle()} | 관리자\``.
- [ ] **3** LoginPage: 마운트 시 `document.title = '관리자 로그인 | 정의랩'`, 언마운트 시 `document.title = '정의랩 관리자'`.
- [ ] **4** PostDetail: `post` 로드 후 `document.title = \`${post.title || '포스트 보기'} | 관리자\``.
- [ ] **5** 브라우저에서 경로 이동·로그인·포스트 상세 시 탭 제목 확인.

---

## 적용 결과 요약

| 경로/페이지 | 탭 제목 |
|-------------|---------|
| / (대시보드) | 정의랩 관리자 |
| /posts | 포스트 목록 \| 관리자 |
| /posts/new | 새 포스트 \| 관리자 |
| /posts/categories | 카테고리 관리 \| 관리자 |
| /messages | 메시지 관리 \| 관리자 |
| /careers | 경력 관리 \| 관리자 |
| /careers/new | 경력 등록 \| 관리자 |
| /projects | 프로젝트 관리 \| 관리자 |
| /projects/new | 프로젝트 등록 \| 관리자 |
| /posts/:id | (글 제목) \| 관리자 |
| /posts/:id/edit | 포스트 수정 \| 관리자 |
| /login | 관리자 로그인 \| 정의랩 |
| /notifications | 알림 \| 관리자 |
