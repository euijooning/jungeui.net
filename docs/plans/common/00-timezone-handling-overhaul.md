# 타임존 처리 전면 수정 계획

## 현재 문제

- **Auth**: `datetime.utcnow()` (Naive UTC) 사용. Python 3.12+ deprecated 예정이며, posts와 혼용 시 naive/aware 에러 가능.
- **Posts**: `datetime.now(timezone.utc)` (Aware UTC) 사용. Auth와 방식 불일치.
- **Frontend (PostEditor)**: 즉시공개는 UTC+Z로 보내고, 예약공개는 `replace('T', ' ')` 로 로컬 포맷(Naive)을 섞어 보냄. 포맷 이원화.
- **Backend (posts.py)**: "Z가 있으면 파싱하고 없으면..." 하면서 분기 처리하다 로직이 복잡해짐.

## 수정 원칙

- **Transport (API 요청/응답)**: 무조건 ISO 8601 + Z (UTC).
- **DB 저장**: Naive UTC (타임존 껍데기 제거, UTC 숫자만).
- **Display (화면)**: 로컬 시각으로 변환.

## 수정 1 – Frontend (PostEditor.jsx)

저장 시 포맷 통일.

- **현재**: 즉시공개는 `toISOString().slice(0,19).replace('T',' ')+'Z'`, 예약공개는 datetime-local 값을 `replace('T',' ')` 등으로 문자열 조작해 전송. 백엔드는 이게 한국 시간인지 알 수 없음.
- **수정**: `visibility === 'PUBLISHED'` 인 경우만 `published_at` 설정.
  - **예약발행**: `form.published_at`(datetime-local 값, 예: `"2025-02-14T15:00"`)을 `new Date(form.published_at).toISOString()` 로 변환. 브라우저가 로컬 시간으로 인식 → toISOString()이 UTC로 변환 (예: `2025-02-14T06:00:00.000Z`).
  - **즉시공개**: `new Date().toISOString()` 그대로 전송.
- **결과**: `published_at`은 항상 `2025-xx-xxTxx:xx:xx.xxxZ` 형태로만 백엔드에 전달.

## 수정 2 – Backend (auth.py)

UTC 생성 방식 최신화 (Deprecation 해결).

- **현재**: `expire = datetime.utcnow() + timedelta(...)`.
- **수정**: `from datetime import datetime, timedelta, timezone` 추가. `now_utc = datetime.now(timezone.utc)` 한 번 계산 후, `expire = now_utc + timedelta(...)` 로 분기(remember_me 여부)만 다르게 적용.
- **효과**: JWT exp가 UTC 기준 aware datetime으로 통일, posts와 naive/aware 불일치 제거.

## 수정 3 – Backend (posts.py)

파싱 및 저장 로직 단순화.

- **3-1. `_parse_published_at`**
  - 프론트가 무조건 ISO(Z 포함)로 보낸다고 가정.
  - `fromisoformat(s.replace("Z", "+00:00"))` 후, tz 있으면 `astimezone(timezone.utc).replace(tzinfo=None)`.
  - tz 없으면(레거시 대비) UTC로 간주하고 `replace(tzinfo=timezone.utc)` 후 동일하게 naive UTC 반환.
  - naive 입력을 서버 로컬로 해석하는 분기 제거.

- **3-2. create_post / update_post 의 store_published**
  - `store_published = parsed.strftime(...) if "Z" in ... else published` 제거.
  - `store_published = parsed` (파싱된 naive UTC datetime 객체)로 통일.
  - DB INSERT/UPDATE 시 `:published_at`에 datetime 객체 전달. 드라이버가 MySQL DATETIME에 맞게 바인딩.

- **3-3. update_post 내 기존 발행일 비교**
  - DB에서 나온 `existing_published_at`은 이미 UTC 기준 naive. `existing_str = existing_published_at.isoformat()[:19]` 만으로 비교. 서버 로컬 해석 분기 제거.

## 수정 4 – Frontend (PostEditor.jsx) Load 시 UTC → 로컬

글 수정 시 불러오기(loadPost)에서 발행일 표시.

- **문제**: API는 `published_at`을 UTC+Z(예: `2025-02-14T06:00:00Z`)로 내려줌. 기존에는 `slice(0, 16)` 만 해서 `"2025-02-14T06:00"` 를 datetime-local에 넣었고, datetime-local은 타임존 없이 로컬로 해석해 UTC 06:00이 "오전 6시"로 표시됨(한국 15:00인데 9시간 차이).
- **수정**: `toLocalISOString(utcStr)` 헬퍼 추가. UTC 문자열을 `new Date(utcStr)` 로 파싱한 뒤 `getTimezoneOffset() * 60000` 보정으로 로컬 시각의 `YYYY-MM-DDTHH:mm` 생성. loadPost에서 `pubAt = d.published_at ? toLocalISOString(d.published_at) : ''` 로 사용.
- **결과**: 수정 화면 진입 시 예약 발행일이 사용자 로컬 시각으로 올바르게 표시됨.

## 흐름 요약

1. **Frontend 저장**: 예약/즉시 모두 `toISOString()` → UTC ISO 문자열 (`...Z`) 전송.
2. **Backend 수신**: `_parse_published_at`으로 파싱 → naive UTC datetime.
3. **DB 저장**: 해당 datetime 그대로 저장 (UTC 숫자).
4. **API 응답**: `_isoformat_utc`로 Z 붙여 반환.
5. **Frontend 표시**: 목록/상세는 `new Date(published_at)` 후 로컬 변환. **에디터 로드** 시에는 `toLocalISOString(published_at)` 으로 datetime-local 입력값을 로컬 시각 문자열로 채움.
