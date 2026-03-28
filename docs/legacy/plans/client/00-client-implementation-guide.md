# 클라이언트 구현 가이드 (Jungeui Lab)

참조: [01-db-schema.md](../../guides/common/01-db-schema.md), [02-api-spec.md](../../guides/common/02-api-spec.md), [03-folder-structure.md](../../guides/common/03-folder-structure.md), [04-design-guide.md](../../guides/common/04-design-guide.md)

## 0. 전체 설계 철학 (필독)

**UI 핵심 원칙**

- 모든 콘텐츠는 중앙 컨테이너 안에서 **좌우 정렬** (본문 가운데 띄우기 ❌, 좌측 정렬 기본 ⭕)
- 리스트는 무조건 **카드형(Box) + Grid**
- 관리자(Admin)와 클라이언트(Client)는 **색상 체계 분리**
- Tailwind 색상은 "구조/UI용", Theme(MUI)는 "행동/포인트용"

## 목표

방문자용 블로그·포트폴리오 클라이언트. 로그인/회원가입 없음, 공개 읽기 전용.

## 범위

- **조회수**: 클라이언트(글 목록·글 상세)에는 **노출하지 않음**. 조회수·방문자 통계는 **백오피스에서만** 조회·팔로우업 (GET /dashboard/stats, daily_stats 등).
- **메뉴**: Posts(루트), 소개(About), 이력서(추후 추가). 방명록은 선택 사항.

## 라우팅

| 경로 | 설명 |
|------|------|
| `/` | 게시글 목록 (메인) |
| `/posts` | 게시글 목록 (동일 페이지) |
| `/posts/:postId` | 글 상세 |
| `/about` | 소개 (경력·프로젝트) |
| 이력서 | 추후 추가 |

## 레퍼런스

- [sungbin.dev](https://sungbin.dev/) — 메인·목록·헤더 메뉴
- [codegradation.tistory.com](https://codegradation.tistory.com/) — 2컬럼·사이드바·검색·카테고리명 표시
- [sungbin.dev/about](https://sungbin.dev/about/) — 소개 페이지·경력·프로젝트

## 구현 순서

| Phase | 문서 | 내용 |
|-------|------|------|
| 1 | [01-design-and-ui-kit.md](01-design-and-ui-kit.md) | 글로벌 레이아웃·색상 테마·공통 컴포넌트 |
| 2 | [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md) | 카드 그리드·2컬럼·페이지네이션·카테고리·검색 |
| 3 | [03-post-detail.md](03-post-detail.md) | 글 상세 (/posts/:postId), TOC, Utterances 댓글 |
| 4 | [04-about.md](04-about.md) | 소개 페이지·경력 타임라인·프로젝트 그리드 |
| 5 | [05-common-layout-seo-footer.md](05-common-layout-seo-footer.md) | 헤더·푸터·SEO·sitemap |
| 6 | [06-github-utterances-comments.md](06-github-utterances-comments.md) | GitHub Utterances 댓글 위치 조정·연동 |

요약 체크리스트: [client-phase-checklist.md](client-phase-checklist.md)

## 8. 절대 금지 사항

- 가운데 정렬된 본문
- 카드 크기 제각각
- 리스트 아닌 텍스트 나열
- Tailwind sky 색을 버튼에 사용
- theme primary를 사이드바에 사용

## 초기기획서 대비 변경 사항

- 상세 스펙은 본 폴더의 phase 문서 및 docs·client-guide 기준으로 확정. PDF 초기기획서와 차이가 있으면 이 문서에 요약하여 반영.

## 구현 현황 (갱신)

- **Phase 1** 일부: 글로벌 레이아웃, 헤더(로고 favicon 36px, Posts/About 간격 2rem,
                  **헤더 검색창+검색 버튼**·다크모드·**햄버거 버튼**), 푸터, 테마 변수, 폰트(Gmarket Sans).
  - 메뉴 호버 시 **border-bottom** 밑줄(잘림 방지). **scrollbar-gutter: stable** 적용.
  - 모바일(768px 이하): 검색·다크모드·햄버거를 **한 덩어리**로 줄바꿈, 375px 미만 시 검색창 숨김.
  - 햄버거 클릭 시 **카테고리 오버레이** 패널(백드롭·닫기·body 스크롤 잠금).

- **Phase 2** 일부: `/`·`/posts` 동일 목록, 2컬럼(메인+사이드바), 사이드바 구분선·카테고리(전체/필터,
                  **단순 텍스트 링크**, 카테고리 텍스트 크기 조정).
  - **헤더 검색(제목 기준·버튼 클릭)** → 검색 결과 문구는 **헤더-메인 사이 스트립**에 "검색어 검색 결과 n건" 표시.
  - 페이지당 5개·**페이지네이션** (< << 숫자 >> > 둥근 사각형 버튼, 활성 파란색, 1페이저도 표시).
  - 카드형 목록(리스트형 가로 카드), **카드 제목 위 카테고리 필(둥근 원)·클릭 시 해당 카테고리 필터**,
    목록 제목 중복 제거. 카드 테두리 **#C2CFDA**로 다소 진하게.
  - GET /posts·category_id·q 연동, 카드 클릭 시 `/posts/:postId` 이동.
  - **모바일**: 1컬럼·사이드바 숨김·햄버거로 카테고리 오버레이.

- **Phase 3** 일부: 글 상세 경로 `/posts/:postId`, GET /posts/{id}, 비공개·없는 글 404. **조회수 미노출**.
  - 제목·메타(카테고리·날짜·태그)·본문(좌정렬)·**첨부파일**(아이콘 다운로드 버튼)
    ·**이전/다음 글**·**Utterances** 댓글(다크모드 테마 연동)·**이미지 라이트박스**.
  - TOC·코드 블록 Copy·유튜브 전용 처리는 미구현.

- **Phase 4** 일부: About 페이지 라우트·기본 구성.

- 목록 UI는 **리스트형 카드**(세로 1열)로 구현됨. 다열 그리드(5/4/3/2열)는 추후 적용 가능.
