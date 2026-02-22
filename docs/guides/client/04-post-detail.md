# Phase 03: 글 상세 (/posts/:id)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [01-implementation-guide.md](01-implementation-guide.md), [../common/02-api-spec.md](../common/02-api-spec.md)

---

## 경로 및 데이터

- [x] **1** 경로: `/posts/:postId`. GET /posts/{id} 로 상세 조회.
- [x] **2** 조회수: 글 상세 페이지에 **조회수 미노출**.
- [x] **3** 존재하지 않는 postId 또는 비공개 글 시 404 또는 적절한 처리.

---

## 3-1. 레이아웃

```
[제목]
[카테고리 · 날짜 · 태그]
--------------------------------
[본문]              [TOC]
(left aligned)      (sticky)
--------------------------------
[이전글]  [다음글]
[Utterances 댓글]
```

- [x] **4** 제목, 메타(카테고리·날짜·태그), 본문(content_html) 렌더링.
- [ ] **5** TOC(목차): 본문 내 헤딩 기반, 클릭 시 해당 섹션 스크롤, **sticky** 배치. *(미구현)*
- [ ] **6** 본문(좌측) | TOC(우측 sticky) 2컬럼 구조. *(TOC 미구현으로 현재 1컬럼)*

### 글 영역 정렬 (목록과 동일 기준선)

상세 페이지도 **Home(목록)과 동일하게 main 영역의 흐름**을 따르면, 별도 위치 보정 없이 글 시작점이 목록 카드 시작점과 일치한다. 가운데 정렬(mx-auto)만 제거하고 **왼쪽 정렬**을 유지한다.

| 항목 | 적용 |
|------|------|
| 정렬 | `md:mr-auto`로 좌측 정렬. Layout이 잡아주는 기본 여백(목록이 시작하는 위치) 그대로 사용 |
| 너비 | `max-w-[740px]`. `w-full`로 작은 화면에서 안정적으로 꽉 채움 |
| 반응형 | 모바일은 `px-4` 유지 |

**파일**: `apps/client/src/pages/PostDetail.jsx` — article `className`. (위치를 당기는 `-ml` 코드는 사용하지 않음)

### 본문 규칙

- [x] **7** text-align: **left**
- [x] **8** line-height: **1.7 ~ 1.8**
- [x] **9** 이미지 클릭 → **라이트박스** 표시.
- [x] **9-1** 본문 제목 계층(h1~h6): h1(1.75rem) ~ h4(1.125rem), **h5**(1.0625rem, 본문과 동일·Bold), **h6**(1rem, 보조색). 스타일: `apps/client/src/index.css` — `.post-detail-prose` [Heading] 섹션. h1~h6가 본문보다 작아지지 않고 위계 유지.

---

## 콘텐츠 처리

- [ ] **10** 코드 블록: 문법 강조 + Copy 버튼. *(미구현)*
- [ ] **11** 유튜브 임베드: 본문 내 유튜브 URL/노드 정상 재생. *(본문 HTML 임베드에 의존)*

---

## 네비게이션 및 댓글

- [x] **12** 이전/다음 글 링크 (같은 카테고리 또는 전체 기준).
- [x] **13** 댓글: **GitHub 기반 Utterances** 연동.
- [x] **14** 다크모드 시 Utterances 위젯 색상/테마 전환.

---

## 광고 (Google AdSense)

글 상세 페이지에 **Google AdSense**를 넣을 수 있도록 구성해 두었다. 수익성과 가독성을 고려해 **2곳**만 사용한다.

### 광고 위치

| 위치 | 삽입 시점 | 추천 형태 |
|------|-----------|-----------|
| **상단** | 헤더(제목·메타) 직후, 본문 시작 전 | 디스플레이 광고 (가로형) |
| **하단** | 본문·첨부파일 종료 후, 댓글/이전·다음글 네비 전 | Multiplex 또는 디스플레이 (사각형) |

### 설정 (환경 변수)

`apps/client` 빌드 시 다음 변수가 주입된다. **비어 있으면** 광고 스크립트를 로드하지 않고, "광고 영역" 플레이스홀더만 표시한다.

| 변수 | 설명 |
|------|------|
| `VITE_ADSENSE_CLIENT_ID` | AdSense 발급 클라이언트 ID (예: `ca-pub-xxxxxxxx`) |
| `VITE_ADSENSE_SLOT_TOP` | 상단 광고 슬롯 ID |
| `VITE_ADSENSE_SLOT_BOTTOM` | 하단 광고 슬롯 ID |

예시는 프로젝트 루트 `.env.example` 참고.

### 컴포넌트

- **파일**: `apps/client/src/components/AdBanner.jsx`
- **props**: `slot` (`"top"` \| `"bottom"`), `className` (선택)
- **동작**  
  - `VITE_ADSENSE_CLIENT_ID`와 해당 슬롯 ID가 모두 있으면: `ins.adsbygoogle` + 반응형(`data-ad-format="auto"`, `data-full-width-responsive="true"`) 렌더, 스크립트 한 번만 동적 로드 후 `(window.adsbygoogle || []).push({})` 호출.  
  - 하나라도 없으면: 테마용 클래스(`theme-bg-card`, `theme-card-border`)로 플레이스홀더만 표시(상단 100px, 하단 120px).
- **접근성**: 컨테이너에 `aria-label="광고"` 적용.

### PostDetail.jsx에서 사용

현재는 **광고 노출을 끈 상태**로, 다음만 주석 처리해 두었다.

1. **import**: `import AdBanner from '../components/AdBanner';`
2. **상단**: `</header>` 직후의 `<AdBanner slot="top" />`
3. **하단**: 첨부파일 섹션 다음, 댓글 섹션 전의 `<AdBanner slot="bottom" />`

광고를 켜려면 위 세 곳의 주석을 해제하고, `.env`에 `VITE_ADSENSE_CLIENT_ID`, `VITE_ADSENSE_SLOT_TOP`, `VITE_ADSENSE_SLOT_BOTTOM`을 설정한 뒤 다시 빌드하면 된다.

---

## Phase 03 완료 점검 (구현 후 실행 후 보고)

- [x] **15** `/posts/:postId` 접속 시 제목·본문(좌정렬)·메타·첨부파일·이전/다음·Utterances 표시. *(TOC 미구현)*
- [x] **16** 이미지 라이트박스 동작. *(코드 블록 Copy·유튜브 전용 처리 미구현)*
- [x] **17** Utterances 댓글 로드 및 다크모드 시 테마 전환.

**Phase 03** 일부 완료 (점검일: 2026-02-06). TOC·코드 블록 Copy·유튜브 전용 처리는 추후.
