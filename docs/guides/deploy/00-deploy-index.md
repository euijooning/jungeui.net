# 배포 매뉴얼

서버 배포 시 참고할 일반 매뉴얼. 프로젝트·서버별 정보는 포함하지 않으며, 복사 후 실제 경로·포트·도메인에 맞게 수정해 사용한다.

## 문서 목록

| 문서 | 내용 |
|------|------|
| [01-systemd-api-service.md](01-systemd-api-service.md) | FastAPI(uvicorn) API를 systemd 서비스로 등록 |
| [02-nginx-staging-basic-auth.md](02-nginx-staging-basic-auth.md) | 스테이징 도메인에 Nginx Basic Auth 적용 |

## 관련 문서

- [../common/07-deploy-strategy.md](../common/07-deploy-strategy.md) — ENV 규칙, .env 구조, 배포 절차
- [../common/09-security-and-shared-config.md](../common/09-security-and-shared-config.md) — SECRET_KEY 필수, API·공통 유틸
