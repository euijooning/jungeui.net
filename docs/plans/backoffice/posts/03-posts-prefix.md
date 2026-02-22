# 03. 말머리(Prefix) 기능 관리

게시글에 "수업", "공지", "질문" 등의 라벨을 붙여 분류할 수 있는 **말머리(Prefix)** 기능을 추가한다.
카테고리와 별개로 가벼운 분류 목적으로 사용하며, 백오피스에서 관리하고 클라이언트 상세 페이지에 노출한다.

## 1. 개요

* **목표**: 게시글 분류를 위한 '말머리' 데이터 모델링 및 관리/연동 기능 구현.
* **범위**:
    * **DB**: `post_prefixes` 테이블 생성 및 `posts` 테이블 연동.
    * **API**: 말머리 CRUD 및 게시글 API 연동.
    * **Backoffice**: 말머리 관리 메뉴/페이지, 포스트 에디터 내 선택 기능.
    * **Client**: 게시글 상세 페이지 날짜 옆 말머리 표시.

## 2. 데이터베이스 (DB Schema)

### 2.1 신규 테이블: `post_prefixes`

| 컬럼명 | 타입 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT (PK) | 고유 ID | AUTO_INCREMENT |
| `name` | VARCHAR(20) | 말머리 이름 | Not Null, 최대 20자 |
| `sort_order` | INT | 정렬 순서 | Default 0 |
| `created_at` | DATETIME | 생성일 | Default CURRENT_TIMESTAMP |

### 2.2 기존 테이블 수정: `posts`

* **컬럼 추가**: `prefix_id` (BIGINT, Nullable)
* **제약 조건**: FK (`post_prefixes.id`)
* **삭제 정책**: `ON DELETE SET NULL` (말머리가 삭제되어도 글은 유지됨)
* **인덱스**: FK 생성 시 인덱스가 자동 생성되는 DB가 많지만, "특정 말머리 글만 모아보기" 필터용 조회를 위해 `prefix_id` 인덱스 존재 여부를 확인하거나, 필요 시 `CREATE INDEX`로 명시해 두면 조회 성능에 유리하다.

### 2.3 초기화 스크립트 (`db_init.py`)

* `_ensure_post_prefixes_table()`: 테이블 생성.
* `_ensure_posts_prefix_id()`: `posts` 테이블에 컬럼이 없을 경우 `ALTER TABLE` 수행.

## 3. API 설계

### 3.1 말머리 관리 (`/api/post_prefixes`)

* **GET** `/api/post_prefixes`: 전체 목록 조회 (작성/수정 화면용, `name`, `sort_order`, **`post_count`** 포함). 목록용이므로 인증 없이 호출 가능.
* **POST** `/api/post_prefixes`: 생성 (Body: `{ "name": "..." }`). 관리자 전용.
* **PUT** `/api/post_prefixes/{id}`: 수정. 관리자 전용.
* **DELETE** `/api/post_prefixes/{id}`: 삭제. 관리자 전용.

### 3.2 게시글 API 수정 (`/api/posts`)

* **GET** `/api/posts/{id}`: 응답에 `prefix_id`, `prefix_name` 포함. 기존 응답 형식과의 **일관성**: 현재 단건 조회는 `category_id`와 `category_name`을 따로 반환하므로, 말머리도 `prefix_id` + `prefix_name`으로 동일하게 맞춘다.
* **POST/PUT** `/api/posts`: 요청 Body에 `prefix_id` 필드 추가 및 저장 로직 구현.

## 4. 백오피스 (Backoffice)

### 4.1 메뉴 및 라우팅

* **메뉴**: 포스트 관리 > **말머리 관리** (아이콘: Lucide `Tags`).
* **경로**: `/posts/prefixes`
* **페이지**: `apps/backoffice/src/pages/posts/PrefixList.jsx`

### 4.2 말머리 관리 페이지 (`PrefixList`)

* **목록**: ID, 이름, 해당 말머리 사용 중인 포스트 수(Count), 관리(수정/삭제) 버튼.
* **기능**: 말머리 추가/수정 모달 (이름 입력, **maxLength=20** 적용), 삭제 시 확인 창.

### 4.3 포스트 에디터 (`PostEditor`)

* **UI 위치**: 카테고리 선택 박스 바로 아래.
* **형태**: Select Box (placeholder "선택", 기본값 "미지정").
* **동작**:
    * 페이지 로드 시 말머리 목록 API 호출.
    * 글 저장/수정 시 선택된 `prefix_id` 전송.

## 5. 클라이언트 (Client)

### 5.1 게시글 상세 (`PostDetail`)

* **위치**: 게시글 제목 아래, 작성일(Date) 옆.
* **디자인**:
    * 하늘색 계열의 네모 박스 스타일 (예: Tailwind `bg-sky-100 text-sky-700 px-2 py-0.5 rounded`).
    * 말머리가 `NULL`인 경우 표시하지 않음.

## 6. 작업 순서

1. **DB**: `db_init.py` 수정 및 서버 재시작으로 테이블/컬럼 생성.
2. **API**: `post_prefixes.py` 라우터 구현 및 `posts.py` 수정.
3. **Backoffice**: 메뉴 추가 → 관리 페이지 구현 → 에디터 연동.
4. **Client**: 상세 페이지 UI 수정.

## 7. 구현 시 참고 팁 (Checklist)

* **DB 인덱스**: `posts.prefix_id`에 FK를 걸면 대부분 DB에서 인덱스가 자동 생성되지만, "특정 말머리 글만 모아보기" 기능 확장 시를 위해 인덱스 존재를 확인하거나 필요 시 명시적으로 인덱스를 두는 것이 좋다.
* **API 응답 구조**: 단건 조회(`get_post`)는 이미 `category_id`, `category_name`을 따로 반환하므로, 말머리도 `prefix_id`, `prefix_name`으로 동일한 패턴을 유지한다.
* **말머리 20자 제한**: DB `VARCHAR(20)` 뿐 아니라 백오피스 말머리 입력 Input에 **maxLength={20}** 를 넣어 두면 UX와 검증이 일치한다.
