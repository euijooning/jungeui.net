# 04-5. About 페이지 경력 모달 (타임라인·컨테이너)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [04-about.md](04-about.md), [01-db-schema.md](../../guides/common/01-db-schema.md), [02-api-spec.md](../../guides/common/02-api-spec.md), [06-ui-ux-guide.md](../../guides/common/06-ui-ux-guide.md)

---

## 개요

- **위치**: `/about` 페이지, 프로젝트 옆 **경력** 버튼 클릭 시 모달.
- **형태**: 모달 확대 + **세로 타임라인**(선 + 원형 마커) + **카드 컨테이너** per 경력.
- **04-about.md 4-4** 항목 10~12와 연동. 완료 시 해당 항목 충족.

---

## 1. 모달 레이아웃

- [x] **1** 모달 너비 확대: `max-w-lg` → `max-w-2xl` 또는 `max-w-3xl`, `max-h-[85vh]` 유지.
- [x] **2** 왼쪽 **세로 타임라인**: 연한 세로선 + 항목별 원형 마커.
- [x] **3** 오른쪽(또는 카드 영역) **카드 컨테이너**: 흰색/테마 카드, 둥근 모서리, 그림자.

---

## 2. 카드 내 항목 (순서 고정)

- [x] **4** **기간**: `yyyy.mm ~ yyyy.mm` 또는 종료일 없으면 `yyyy.mm ~ (현재)`. 마커 옆 또는 카드 상단 뱃지.
- [x] **5** **회사 이미지**: logo_asset_id → URL 있으면 작은 정사각형(예: w-12 h-12) 노출; 없으면 해당 영역 생략.
- [x] **6** **회사명**: 굵은 글씨.
- [x] **7** **역할**: 회사명 아래.
- [x] **8** **링크**: 프로젝트와 동일 — 웹사이트/깃허브/유튜브/인스타그램/기타, 아이콘 + 외부 링크. 최대 5개.
- [x] **9** **한 일**: `<ul>` 개조식, 최대 5개 (career_highlights).
- [x] **10** **태그**: pill 형태, 최대 5개 (career_tags).

---

## 3. 스타일 (강조 색상)

- [x] **11** 타임라인 선·원형 마커·기간 뱃지·태그 pill: **하늘색·파란색** 계열. `--color-primary` / `theme-*` 또는 Tailwind primary 계열 사용 (06-ui-ux-guide.md).

---

## 4. API·DB

- [x] **12** GET /careers: `logo`(URL), `career_links`, `career_highlights`, `career_tags` 포함 응답.
- [x] **13** POST /careers, PUT /careers/{id}: Body에 `career_links`, `career_highlights`, `career_tags` 포함. DB 테이블 career_links, career_highlights, career_tags 반영.
- [x] **14** [01-db-schema.md](../../guides/common/01-db-schema.md), [02-api-spec.md](../../guides/common/02-api-spec.md) 업데이트.

---

## 5. 백오피스 (선택 체크리스트)

- [x] **15** 경력 등록/수정 폼: 링크(link_name + link_url, 최대 5), 한 일(텍스트 5개), 태그(최대 5) 입력.

---

## 6. 04-about.md 연동

- [x] **16** 04-about.md 4-4 항목 12를 "항목: 기간, 회사 이미지(선택), 회사명, 역할, 링크, 한 일(최대 5), 태그(최대 5)"로 구체화하고 본 문서 참조 연결.

---

## 완료 점검

- [x] `/about`에서 경력 버튼 클릭 시 넓은 모달 + 세로 타임라인·카드 형식 표시.
- [x] 기간/로고/회사명/역할/링크/한 일/태그 노출. 강조 색상 하늘색·파란색.
- [x] API 연동으로 데이터 노출.

**Phase 완료** (점검일: 2025-02-10)
