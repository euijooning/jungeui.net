# Phase 06: GitHub Utterances 댓글 (레이아웃 조정 및 연동)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [03-post-detail.md](03-post-detail.md)

**Utterances 가이드**: [utteranc.es](https://utteranc.es/) — 앱 설치 후 리다이렉트되는 설정 페이지(`?installation_id=...&setup_action=install`)에서 repo·issue-term·theme 등 위젯 설정 방법 안내.

---

## 개요

- **방안**: Utterances 사용 (GitHub 계정 로그인, 댓글 = GitHub Issues).
- **목표**: 댓글 영역을 **이전글/다음글 네비게이션 바로 위**로 이동하고, 저장소·앱·환경 변수 설정으로 댓글 동작 완료.

---

## 1. 레이아웃 이동 (PostDetail.jsx)

**파일**: [apps/client/src/pages/PostDetail.jsx](../../apps/client/src/pages/PostDetail.jsx)

렌더링 순서를 아래 흐름으로 재배치한다.

```jsx
{/* 1. 본문 영역 */}
<div ref={bodyRef} className="post-detail-prose" dangerouslySetInnerHTML={...} />

{/* 2. 첨부파일 영역 (기존 블록 유지, 순서만 확인) */}
{post.attachments?.length > 0 && (
  <section aria-label="첨부 파일">...</section>
)}

{/* 3. 댓글 영역 — 이 위치로 이동 (이전글/다음글 바로 위) */}
{VITE_UTTERANCES_REPO && (
  <section className="mt-12 pt-8 border-t theme-border" aria-label="댓글">
    <div id="utterances-root" />
  </section>
)}

{/* 4. 이전글/다음글 네비게이션 */}
<nav className="mt-8 py-4 px-4 ...">...</nav>
```

- [ ] **1** 본문 직후에 있던 댓글 `<section>` 블록을 **첨부파일 섹션 다음, `<nav>`(이전글/다음글) 바로 위**로 이동.
- [ ] **2** 이동 후 순서: 본문 → 첨부파일 → 댓글 → 이전글/다음글 인지 확인.

**참고**: Utterances 스크립트를 주입하는 `useEffect`는 기존대로 두면 된다. `id="utterances-root"`인 컨테이너만 위 순서의 위치에 렌더링되도록 하면 됨.

---

## 2. Utterances 연동 체크리스트

- [ ] **3** **Public 저장소 필수**: 댓글용 GitHub 저장소를 **Public**으로 설정. Private이면 다른 방문자에게 에러 발생.
- [ ] **4** **Repo 이름 형식**: `.env` / `.env.staging`에 `VITE_UTTERANCES_REPO=계정명/저장소명` (예: `jungeui/comments`). 슬래시 하나, 공백 없음.
- [ ] **5** **Issue 생성**: 첫 댓글이 달리면 해당 저장소 Issues 탭에 **pathname**을 제목으로 한 이슈가 자동 생성됨. 관리자는 이슈에서 댓글 삭제·고정 가능.

---

## 3. 다크 모드 연동

- [x] **6** 초기 로드 시 테마: `theme === 'dark' ? 'github-dark' : 'github-light'` 로 스크립트에 `theme` 속성 지정되어 있음 (현재 코드 유지).
- [ ] **7** (선택) 사용자가 페이지에서 테마를 **실시간으로** 바꿀 때 댓글창 테마도 즉시 바꾸려면, `useEffect` 내에서 iframe에 `postMessage`를 보내는 로직을 추가할 수 있음. 기본 로드만 필요하면 생략 가능.

---

## 4. 환경 변수 및 배포

- [ ] **8** 루트 `.env` 및 배포용 `.env.staging` 등에 `VITE_UTTERANCES_REPO=소유자/저장소이름` 추가.
- [ ] **9** 클라이언트 **재빌드** 후 배포 (Vite 빌드 시 해당 값이 주입됨).

---

## 실행 순서 (검토 완료)

1. **[Code]** PostDetail.jsx 레이아웃 순서 변경 후 커밋.
2. **[GitHub]** 댓글 전용 public 저장소 생성.
3. **[App]** [Utterances App](https://github.com/apps/utterances) 설치 및 해당 저장소 권한 부여.
4. **[Env]** .env 파일에 `VITE_UTTERANCES_REPO` 저장소 정보 업데이트.
5. **[Deploy]** 재빌드 후 실제 환경에서 댓글 작성·다크모드 테스트.

---

## Phase 06 완료 점검 (구현 후 실행 후 보고)

- [ ] **10** 글 상세에서 본문 → 첨부파일 → **댓글** → 이전글/다음글 순서로 노출되는지 확인.
- [ ] **11** 댓글 영역에서 "Sign in with GitHub" 로그인 후 댓글 작성 가능한지 확인.
- [ ] **12** GitHub 저장소 Issues 탭에 pathname 기준 이슈가 생성되는지 확인.

**Phase 06 완료** (점검일: __________)
