# Phase 03: 문서화

## 반영 내용

1. **docs/common/05-server-run-guide.md**  
   - "1. 필요 환경" 또는 "2. API 서버" 근처에 한 줄 추가:  
   - "운영: `ENV=production`(또는 생략), 스테이징: `ENV=staging`. systemd에서는 `Environment=`로 설정."

2. **루트 README.md**  
   - 환경변수/배포 관련 문단이 있으면 위와 같은 문장 한 줄 추가.  
   - 없으면 "서버 실행·환경 변수는 docs/common/05-server-run-guide.md 참고" 수준으로 안내.
