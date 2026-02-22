# 클라이언트 구현 가이드 (Jungeui Lab)

참조: [../common/01-db-schema.md](../common/01-db-schema.md), [../common/02-api-spec.md](../common/02-api-spec.md), [../common/03-folder-structure.md](../common/03-folder-structure.md), [../common/04-design-guide.md](../common/04-design-guide.md)

## 0. 전체 설계 철학 (필독)

**UI 핵심 원칙**

- 모든 콘텐츠는 중앙 컨테이너 안에서 **좌우 정렬** (본문 가운데 띄우기 ❌, 좌측 정렬 기본 ⭕)
- 리스트는 무조건 **카드형(Box) + Grid**
- 관리자(Admin)와 클라이언트(Client)는 **색상 체계 분리**
- Tailwind 색상은 "구조/UI용", Theme(MUI)는 "행동/포인트용"

## 목표

방문자용 블로그·포트폴리오 클라이언트. 로그인/회원가입 없음, 공개 읽기 전용.

## 범위

- **조회수**: 클라이언트(글 목록·글 상세)에는 **노출하지 않음**. 조회수·방문자 통계는 **백오피스에서만** 조회 (GET /dashboard/stats, daily_stats 등).
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
| 1 | [02-design-and-ui-kit.md](02-design-and-ui-kit.md) | 글로벌 레이아웃·색상 테마·공통 컴포넌트 |
| 2 | [03-post-list-and-sidebar.md](03-post-list-and-sidebar.md) | 카드 그리드·2컬럼·페이지네이션·카테고리·검색 |
| 3 | [04-post-detail.md](04-post-detail.md) | 글 상세 (/posts/:postId), TOC, Utterances 댓글 |
| 4 | [05-about.md](05-about.md) | 소개 페이지·경력 타임라인·프로젝트 그리드 |
| 5 | [06-common-layout-seo-footer.md](06-common-layout-seo-footer.md) | 헤더·푸터·SEO·sitemap |

## 절대 금지 사항

- 가운데 정렬된 본문
- 카드 크기 제각각
- 리스트 아닌 텍스트 나열
- Tailwind sky 색을 버튼에 사용
- theme primary를 사이드바에 사용

## 구현 현황 요약

- **Phase 1** 일부: 글로벌 레이아웃, 헤더(로고 favicon 36px, Posts/About, 검색창+검색 버튼·다크모드·햄버거), 푸터, 테마 변수, 폰트(Gmarket Sans). 모바일: 검색·다크모드·햄버거 한 덩어리, 375px 미만 시 검색창 숨김. 햄버거 → 카테고리 오버레이.
- **Phase 2** 일부: `/`·`/posts` 동일 목록, 2컬럼(메인+사이드바), 카테고리(전체/필터), 헤더 검색(제목·버튼 클릭), 페이지당 5개·페이지네이션, 카드형 목록(리스트형 가로 카드), 카드 제목 위 카테고리 필·클릭 시 필터. GET /posts·category_id·q 연동. 모바일: 1컬럼·사이드바 숨김·햄버거로 카테고리 오버레이.
- **Phase 3** 일부: 글 상세 `/posts/:postId`, GET /posts/{id}, 비공개·없는 글 404, 조회수 미노출. 제목·메타·본문(좌정렬)·첨부파일·이전/다음·Utterances·이미지 라이트박스. TOC·코드 블록 Copy·유튜브 전용 처리는 미구현.
- **Phase 4**: About 페이지 라우트·기본 구성 완료.
- 목록 UI는 **리스트형 카드**(세로 1열)로 구현됨. 다열 그리드(5/4/3/2열)는 추후 적용 가능.
