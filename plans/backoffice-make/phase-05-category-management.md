# Phase 05: 카테고리 관리 (대카테고리 / 소카테고리)

## 목표

- **백오피스**: 포스트 하위 메뉴에 "카테고리 관리" 추가. 대카테고리(상위) / 소카테고리(하위) 계층 구조로 CRUD·순서 변경(드래그 앤 드롭).
- **클라이언트**: 사이드바에서 대카테고리 → 소카테고리(게시판 느낌)로 표시. 상위 선택 시 해당 대+하위 게시판 글 목록, 하위 선택 시 해당 소카테고리만 필터.

참조: [docs/01-db-schema.md](../../docs/common/01-db-schema.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md).  
UI 참고: 사용자 제공 이미지(티스토리 스타일 카테고리 관리).

---

## 1. DB 스키마 변경

**파일**: [docs/common/01-db-schema.md](../../docs/common/01-db-schema.md), `scripts/db_init.py` (실제 DDL 사용 시).

- `categories` 테이블에 **`parent_id`** 추가.
  - `parent_id BIGINT NULL` + `FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE`
  - `NULL` = 대카테고리, 값 있음 = 해당 id를 부모로 하는 소카테고리.
- 기존 데이터 마이그레이션: 현재 카테고리는 모두 `parent_id = NULL`(대카테고리)로 두거나, 필요 시 한 개 루트 아래로 정리.

---

## 2. API

### 2.1 카테고리 API 확장

**파일**: [apps/api/routers/categories.py](../../apps/api/routers/categories.py).

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/categories | 목록. **트리 구조** 반환 또는 flat + parent_id. 클라이언트/백오피스 공용. | 공개 |
| GET | /api/categories?tree=1 | (선택) 트리 형태로 반환. | 공개 |
| POST | /api/categories | 생성 (name, slug, parent_id, sort_order) | Admin |
| PUT | /api/categories/{id} | 수정 | Admin |
| DELETE | /api/categories/{id} | 삭제 (하위 있으면 거부 또는 cascade 정책에 따라) | Admin |
| PATCH | /api/categories/reorder | 순서 변경 (id 목록 또는 [{id, sort_order}]) | Admin |

- **GET 응답**: 각 항목에 `parent_id`, `sort_order` 포함. 트리로 줄 때는 `children: []` 형태로 중첩 가능.
- **글 배정**: `posts.category_id`는 **소카테고리(leaf) ID**를 두는 것을 권장. 대카테고리만 있는 경우 해당 대카테고리 id를 사용.

### 2.2 글 목록 필터 (대/소 통일)

**파일**: [apps/api/routers/posts.py](../../apps/api/routers/posts.py).

- `GET /api/posts?category_id=<id>` 동작:
  - `category_id`가 **소카테고리**면: 기존처럼 `p.category_id = :category_id`.
  - `category_id`가 **대카테고리**면: `p.category_id IN (대카테고리 id, 해당 대의 모든 소카테고리 id)` 로 필터 (해당 “게시판” 전체 글).

---

## 3. 백오피스

### 3.1 메뉴 구조 (포스트 하위)

**파일**: [apps/backoffice/src/layout/AppMenu.jsx](../../apps/backoffice/src/layout/AppMenu.jsx).

- **포스트**를 그룹으로 두고 하위 메뉴 추가:
  - 포스트 목록 (`/posts`)
  - 새 포스트 (`/posts/new`)
  - **카테고리 관리** (`/posts/categories` 또는 `/categories`)
- MUI `Collapse` + `ListItemButton`으로 “포스트” 클릭 시 펼쳐지고, 위 세 개 중 활성 경로 하이라이트.

### 3.2 라우트

**파일**: [apps/backoffice/src/App.jsx](../../apps/backoffice/src/App.jsx).

- `Route path="/posts/categories" element={<CategoryList />}` (또는 `/categories`) 추가.
- `CategoryList` import 및 페이지 컴포넌트 생성.

### 3.3 카테고리 관리 페이지

**파일**: `apps/backoffice/src/pages/categories/CategoryList.jsx` (신규).

- **상단**: 제목 "카테고리 관리", 설명(순서 변경·주제 연결 등), (선택) "전체 펼치기" / "전체 접기".
- **트리 목록**:
  - 대카테고리 → 소카테고리 들여쓰기로 표시.
  - 각 행: 드래그 핸들(≡), 펼치기/접기, 이름, (글 개수), [추가] [수정] [삭제] 등.
- **기능**:
  - 추가: 대카테고리 추가 / 선택한 대 아래 소카테고리 추가.
  - 수정: 이름·slug·parent_id·sort_order.
  - 삭제: 하위 있으면 경고 후 cascade 또는 거부 정책에 따라 처리.
  - 드래그 앤 드롭으로 순서 변경 → `PATCH /api/categories/reorder` 호출.
- **글 개수**: 해당 카테고리(대면 대+하위)에 속한 글 수 표시. GET /api/categories 시 count 포함하거나 별도 집계.

### 3.4 글 쓰기/글 목록에서 카테고리 선택

**파일**: [apps/backoffice/src/pages/posts/PostEditor.jsx](../../apps/backoffice/src/pages/posts/PostEditor.jsx), [PostList.jsx](../../apps/backoffice/src/pages/posts/PostList.jsx).

- 카테고리 셀렉트를 **트리(대 → 소)** 형태로 표시. 값은 소카테고리 id(또는 대만 있으면 대 id).
- API에서 트리로 내려주면 "대이름 > 소이름" 또는 들여쓰기로 표시.

---

## 4. 클라이언트

### 4.1 카테고리 API 사용

**파일**: [apps/client/src/api.js](../../apps/client/src/api.js).

- `fetchCategories()`: 기존 `/api/categories` 호출 유지. 응답이 트리(parent_id 또는 children)이면 그대로 사용.

### 4.2 사이드바 (대 → 소, 게시판 느낌)

**파일**: [apps/client/src/components/SharedLayout.jsx](../../apps/client/src/components/SharedLayout.jsx).

- **현행**: flat 목록(전체 + categories.map).
- **변경**: 
  - 대카테고리만 상위에 노출 (또는 "전체" 다음에 대 목록).
  - 각 대카테고리 클릭 시:
    - 해당 대의 소카테고리 목록을 들여쓰기/하위 메뉴로 표시(상위메뉴 게시판 → 하위메뉴 게시판).
  - 링크:
    - **대카테고리**: `/?category_id=<대카테고리_id>` → API가 대+하위 포함해서 필터.
    - **소카테고리**: `/?category_id=<소카테고리_id>` → 해당 소만 필터.
- 활성: `currentCategoryId`와 일치하는 대/소 강조.

### 4.3 목록/상세 연동

**파일**: [apps/client/src/pages/Home.jsx](../../apps/client/src/pages/Home.jsx), [PostDetail.jsx](../../apps/client/src/pages/PostDetail.jsx).

- Home: `category_id` 쿼리 유지. API가 대/소 모두 처리하므로 클라이언트 변경 최소화.
- PostDetail: 글의 `category_id`가 소카테고리(또는 대)이므로, 필요 시 카테고리 이름 표시는 "대 > 소" 형태로 확장 가능(API에서 부모 이름 포함해 주거나 클라이언트에서 트리에서 조회).

---

## 5. 구현 순서 제안

1. **DB**: `categories.parent_id` 추가 + 마이그레이션/시드 반영.
2. **API**: GET /categories에 parent_id·트리 옵션, POST/PUT/DELETE/PATCH reorder 추가. posts list의 category_id 필터를 대/소 포함하도록 수정.
3. **백오피스**: AppMenu에 포스트 그룹 + "카테고리 관리" 추가, 라우트, CategoryList 페이지(트리·CRUD·드래그 순서).
4. **백오피스**: PostEditor/PostList 카테고리 셀렉트를 대→소 트리로 변경.
5. **클라이언트**: SharedLayout 사이드바를 대→소 계층 표시, 링크 및 활성 상태.

---

## 6. 완료 기준

- 백오피스에서 포스트 하위에 "카테고리 관리" 메뉴로 진입 가능.
- 대카테고리/소카테고리 생성·수정·삭제·순서 변경(드래그 앤 드롭) 동작.
- 글 쓰기/글 목록에서 대→소 구조로 카테고리 선택 가능.
- 클라이언트 사이드바에 대카테고리 → 소카테고리(게시판 느낌)로 표시되고, 상위 선택 시 해당 게시판 전체, 하위 선택 시 해당 소카테고리만 필터된 글이 보임.
