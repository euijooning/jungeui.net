# Jungeui Labs

사고 과정(Process)과 결과물(Output)을 보여주는 브랜딩 채널.  
기술 블로그 + 포트폴리오(경력/프로젝트) + 커스텀 백오피스.

## 구조 (Monorepo)

- **docs/** — 구현 가이드·스펙 (DB 스키마, API 명세, 폴더 구조)
- **scripts/** — DB 초기화, 시딩, 배포 스크립트
- **shared/ui-kit/** — 클라이언트·백오피스 공통 UI 컴포넌트
- **apps/api/** — Python FastAPI REST API 서버
- **apps/client/** — 방문자용 블로그/포트폴리오 프론트
- **apps/backoffice/** — 관리자용 어드민 (글/경력/프로젝트/에디터, assets)

## 로컬 실행

### 1. Python 백엔드

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```
(가상환경이 이미 있으면 활성화 후 `pip install -r requirements.txt`만 실행. **권한 오류( WinError 5 ) 시**: 터미널을 관리자 권한으로 열거나, Cursor/VS Code를 종료한 뒤 일반 터미널에서 `pip install -r requirements.txt` 실행.)

`.env`에 DB 접속 정보 설정 후:

```bash
python scripts/db_init.py    # DB·테이블 생성
python scripts/seed_data.py  # 초기 카테고리·관리자
# 프로젝트 루트에서 실행 → API http://localhost:8009
uvicorn apps.api.main:app --reload --port 8009
```

### 2. 백오피스 (관리자) — http://localhost:5181

```bash
cd apps/backoffice
npm install
npm run dev
```

### 3. 클라이언트 (방문자용) — http://localhost:5182

```bash
cd apps/client
npm install
npm run dev
```

## 문서

- [01-db-schema.md](docs/01-db-schema.md) — DB 테이블 정의
- [02-api-spec.md](docs/02-api-spec.md) — API 명세
- [03-folder-structure.md](docs/03-folder-structure.md) — 폴더 구조 상세
