# 예약발행 비노출 및 저장 에러 모달

## 참조

- [01-posts-and-editor.md](01-posts-and-editor.md): 글 목록·에디터·API 연동
- [01-db-schema.md](../../../guides/common/01-db-schema.md): posts 날짜 필드 용어(등록일·발행일)
- [02-api-spec.md](../../../guides/common/02-api-spec.md): API 스펙

---

## 1. 예약발행(미래 발행일) 퍼블릭 비노출

**목적**: status=PUBLISHED이고 published_at이 미래인 글(예약발행)은 클라이언트(퍼블릭)에 노출하지 않는다.

### API 조치 (apps/api/routers/posts.py)

- **list_posts**: `status == 'PUBLISHED'`일 때 WHERE에 `(p.published_at IS NOT NULL AND p.published_at <= NOW())` 추가. 퍼블릭 목록은 “이미 발행된” 글만 반환.
- **get_post**: 비로그인(퍼블릭)이고 status가 PUBLISHED인 경우, `SELECT 1 FROM posts WHERE id = :id AND published_at IS NOT NULL AND published_at <= NOW()` 로 검사해 만족하지 않으면 404. 단건 조회도 “이미 발행된” 글만 노출.
- **get_post_neighbors**: 현재 글 조회 및 이전/다음 후보 모두 `published_at IS NOT NULL AND published_at <= NOW()` 조건 적용. 예약발행 글으로 neighbors 호출 시 404.

### 베스트 프랙티스

- “현재 시각” 판단은 **DB NOW()로 통일**. 앱 서버의 `datetime.now()`가 아닌 SQL `NOW()`를 사용해 list_posts·get_post·get_post_neighbors 간 일관성을 유지하고, DB·앱 타임존 차이로 인한 오동작을 방지.

---

## 2. 저장 실패(400) 에러 모달

**목적**: 발행일 검증 등으로 저장 불가 시 인라인 배너 대신 **모달(Dialog)**로 막아서 표시한다.

### 백오피스 (apps/backoffice/src/pages/posts/PostEditor.jsx)

- 저장 실패 시 `e?.response?.data?.detail || e?.message || '저장에 실패했습니다.'` 로 메시지 설정 후 MUI **Dialog**로 표시.
- 제목: "저장할 수 없음". 확인 버튼 클릭 시 모달 닫기.
- 본문 가독성: `DialogContentText`에 `sx={{ whiteSpace: 'pre-wrap' }}` 적용해 긴 메시지·줄바꿈이 보이도록 함.

### 관련 API 검증

- POST/PUT 시 발행일이 “현재 시각 이전”이면 400, detail: "발행일은 현재 시각 이전으로 설정할 수 없습니다." (naive 입력은 서버 로컬→UTC 변환 후 비교).

---

## 3. 요약

| 항목 | 구현 |
|------|------|
| 예약발행 퍼블릭 비노출 | list_posts·get_post·get_post_neighbors 에서 `published_at IS NOT NULL AND published_at <= NOW()` 사용, DB NOW() 기준 통일 |
| 저장 에러 모달 | PostEditor에서 saveError 시 Dialog 표시, detail 우선, pre-wrap 적용 |

---

## 4. 포스트 일관성 점검 (기준)

- **status enum**: DRAFT, PUBLISHED, PRIVATE, UNLISTED (DB·API·docs 동일).
- **한글 라벨**: PUBLISHED=공개/발행됨, UNLISTED=일부공개, PRIVATE=비공개, DRAFT=임시저장 (백오피스 전반 동일).
- **날짜 용어**: created_at=등록일, published_at=발행일. 목록·상세 UI와 01-db-schema.md 통일. "수정일"은 updated_at 문맥에서만 사용.
