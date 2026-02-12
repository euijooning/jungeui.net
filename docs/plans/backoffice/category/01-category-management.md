# 카테고리 관리 (대카테고리 / 소카테고리)

## 목표

- **백오피스**: 포스트 하위 메뉴에 "카테고리 관리" 추가. 대카테고리(상위) / 소카테고리(하위) 계층 구조로 CRUD·순서 변경(드래그 앤 드롭).
- **클라이언트**: 사이드바에서 대카테고리 → 소카테고리(게시판 느낌)로 표시. 상위 선택 시 해당 대+하위 게시판 글 목록, 하위 선택 시 해당 소카테고리만 필터.

참조: [01-db-schema.md](../../../guides/common/01-db-schema.md), [02-api-spec.md](../../../guides/common/02-api-spec.md).  
UI 참고: 사용자 제공 이미지(티스토리 스타일 카테고리 관리).

---

## 1. DB 스키마 변경

**파일**: [guides/common/01-db-schema.md](../../../guides/common/01-db-schema.md), `scripts/db_reset.py` (실제 DDL 사용 시).

- `categories` 테이블에 **`parent_id`** 추가.
  - `parent_id BIGINT NULL` + `FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE`
  - `NULL` = 대카테고리, 값 있음 = 해당 id를 부모로 하는 소카테고리.
- 기존 데이터 마이그레이션: 현재 카테고리는 모두 `parent_id = NULL`(대카테고리)로 두거나, 필요 시 한 개 루트 아래로 정리.

---

## 2. API

### 2.1 카테고리 API 확장

**파일**: [apps/api/routers/categories.py](../../../apps/api/routers/categories.py).

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/categories | 목록. **트리 구조** 반환 또는 flat + parent_id. 클라이언트/백오피스 공용. | 공개 |
| GET | /api/categories?tree=1 | (선택) 트리 형태로 반환. | 공개 |
| POST | /api/categories | 생성 (name, slug, parent_id, sort_order) | Admin |
| PUT | /api/categories/{id} | 수정 | Admin |
| DELETE | /api/categories/{id} | 삭제 (하위 있으면 거부 또는 cascade 정책에 따라) | Admin |
| PATCH | /api/categories/reorder | 순서 변경 (id 목록 또는 [{id, sort_order}]) | Admin |

- **GET 응답**: 각 항목에 `parent_id`, `sort_order` 포함. 트리로 줄 때는 `children: []` 형태로 중첩 가능.
- **PUT 수정**: `parent_id`를 **null로 설정**(대카테고리로 승격) 가능해야 함. 요청 body에 `parent_id` 키가 있을 때만 갱신하도록 처리.
- **글 배정**: `posts.category_id`는 **소카테고리(leaf) ID**를 두는 것을 권장. 대카테고리만 있는 경우 해당 대카테고리 id를 사용.

### 2.2 글 목록 필터 (대/소 통일)

**파일**: [apps/api/routers/posts.py](../../../apps/api/routers/posts.py).

- `GET /api/posts?category_id=<id>` 동작:
  - `category_id`가 **소카테고리**면: 기존처럼 `p.category_id = :category_id`.
  - `category_id`가 **대카테고리**면: `p.category_id IN (대카테고리 id, 해당 대의 모든 소카테고리 id)` 로 필터.

---

## 3. 백오피스

### 3.1 메뉴 구조 (포스트 하위)

- **포스트** 그룹 하위: 포스트 목록, 새 포스트, **카테고리 관리** (`/posts/categories` 또는 `/categories`)

### 3.2 카테고리 관리 페이지

**파일**: `apps/backoffice/src/pages/categories/CategoryList.jsx` (신규).

- **트리 목록**: 대카테고리 → 소카테고리 들여쓰기. 드래그 핸들, 펼치기/접기, [추가] [수정] [삭제].
- **드래그 앤 드롭**: 같은 레벨 내 순서 변경 + 소카테고리 → 대카테고리로 드래그 이동 지원.
- **순서 저장**: 변경 시에만 버튼 활성화. 부모 변경 시 `PUT /api/categories/{id}` 후 `PATCH /api/categories/reorder`.
- **이탈 경고**: 탭/창 닫을 때만 `beforeunload`로 경고.

### 3.3 글 쓰기/글 목록에서 카테고리 선택

- 카테고리 셀렉트를 **트리(대 → 소)** 형태로 표시.
- 목록: " — 소이름". 선택값: "대이름 > 소이름".

---

## 4. 클라이언트

- 사이드바: 대카테고리 → 소카테고리 계층. 대 선택 시 해당 게시판 전체, 소 선택 시 해당 소만 필터.
- 링크: `/?category_id=<id>`. API가 대/소 모두 처리.

---

## 5. 구현 순서 제안

1. DB: `categories.parent_id` 추가 + 마이그레이션.
2. API: GET/POST/PUT/DELETE/PATCH 확장. posts list category_id 필터 대/소 포함.
3. 백오피스: AdminLayout 포스트 관리 메뉴 + CategoryList 페이지.
4. 백오피스: PostEditor/PostList 카테고리 셀렉트 트리화.
5. 클라이언트: SharedLayout 사이드바 계층 표시.

---

## 6. 완료 기준

- 백오피스 포스트 하위 "카테고리 관리" 메뉴 진입 가능.
- 대/소카테고리 CRUD·드래그 순서 변경 동작.
- 소 → 대 드래그 이동 시 저장 반영.
- 글 쓰기/목록에서 대→소 카테고리 선택 가능.
- 클라이언트 사이드바 대→소 계층 표시 및 필터 동작.
