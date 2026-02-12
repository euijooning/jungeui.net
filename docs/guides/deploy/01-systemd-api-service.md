# systemd API 서비스 등록

FastAPI(uvicorn) API를 systemd 서비스로 등록하는 방법. 운영·스테이징 환경을 각각 별도 서비스로 둘 수 있다.

**주의**: 아래 .service 파일은 복사 후 `USER`, `WORKING_DIRECTORY`, `EXEC_PATH`, `PORT`, `ENV`, `SERVICE_NAME`을 실제 환경에 맞게 수정해 사용한다. **수정한 .service 파일은 저장소에 커밋하지 않는다.**

---

## 적용 절차

```bash
# 1. .service 파일 생성 (경로: /etc/systemd/system/)
sudo nano /etc/systemd/system/SERVICE_NAME.service
# 아래 ini 블록 붙여넣기 후 플레이스홀더 수정

# 2. systemd에 새 유닛 등록 반영
sudo systemctl daemon-reload

# 3. 부팅 시 자동 시작 활성화 + 즉시 시작
sudo systemctl enable --now SERVICE_NAME

# 상태 확인
sudo systemctl status SERVICE_NAME

# 실시간 로그 확인 (Ctrl+C로 종료)
journalctl -u SERVICE_NAME -f
```

---

## 플레이스홀더

| 플레이스홀더 | 설명 | 예시 |
|-------------|------|------|
| `USER` | 서비스 실행 Linux 사용자. DB·업로드 디렉터리 접근 권한이 있어야 함 | `deploy`, `www-data` |
| `GROUP` | 서비스 실행 그룹. USER와 동일하게 두는 경우가 많음 | `deploy`, `www-data` |
| `WORKING_DIRECTORY` | 프로젝트 루트 절대 경로. .env, uploads 등 상대 경로의 기준 | `/home/deploy/myapp` |
| `EXEC_PATH` | 가상환경 uvicorn 절대 경로 | `WORKING_DIRECTORY/.venv/bin/uvicorn` |
| `PORT` | API 리스닝 포트. 운영·스테이징은 다른 포트 사용 권장 | 운영 8010, 스테이징 8011 |
| `ENV` | 환경 구분. 앱에서 .env vs .env.staging 로드에 사용 | `production` 또는 `staging` |
| `SERVICE_NAME` | systemd 서비스 이름. `systemctl status SERVICE_NAME` 등에서 사용 | `myapi`, `myapi-staging` |

---

## 운영용 .service 예시

`/etc/systemd/system/myapi.service`

```ini
[Unit]
# 유닛 메타정보: 설명, 의존 관계
Description=API (Production) - FastAPI uvicorn
After=network.target
# network.target 이후에 시작 (네트워크 준비 완료 후)

[Service]
Type=simple
# simple: ExecStart가 메인 프로세스. 종료 시 서비스도 종료
User=USER
Group=GROUP
# 이 사용자·그룹으로 프로세스 실행 (root 대신 권장)

WorkingDirectory=WORKING_DIRECTORY
# 프로세스의 CWD. 상대 경로(uploads, .env 등) 해석 기준
Environment="ENV=production"
# 앱이 .env (운영용) 로드하도록 함

ExecStart=EXEC_PATH apps.api.main:app --host 127.0.0.1 --port PORT
# 모듈경로:앱객체 --host:로컬만 수신(앞단 Nginx가 프록시) --port:리스닝 포트

Restart=always
# 크래시·예외 종료 시 자동 재시작
RestartSec=5
# 재시작 전 5초 대기 (DB 연결 등이 안정화될 시간)
TimeoutStartSec=30
# 시작 후 30초 내 ready 안 되면 실패 처리

StandardOutput=journal
StandardError=journal
# stdout/stderr를 systemd 저널로. journalctl -u SERVICE_NAME -f 로 확인

[Install]
WantedBy=multi-user.target
# multi-user.target 부팅 시 이 서비스도 함께 시작
```

---

## 스테이징용 .service 예시

`/etc/systemd/system/myapi-staging.service`

운영과 다른 점:
- `Environment="ENV=staging"` — 앱이 .env.staging 로드
- `WorkingDirectory` — 스테이징 전용 프로젝트 디렉터리 (운영과 분리 권장)
- `PORT_STAGING` — 운영과 다른 포트 (예: 8011)
- `EXEC_PATH_STAGING` — 해당 디렉터리의 .venv 경로

```ini
[Unit]
Description=API (Staging) - FastAPI uvicorn
After=network.target

[Service]
Type=simple
User=USER
Group=GROUP

WorkingDirectory=WORKING_DIRECTORY_STAGING
# 스테이징 전용 디렉터리. 운영 uploads·DB와 분리
Environment="ENV=staging"
# .env.staging 로드 (별도 DB, 디버그 설정 등)

ExecStart=EXEC_PATH_STAGING apps.api.main:app --host 127.0.0.1 --port PORT_STAGING
# 스테이징 포트(8011 등)로 리스닝. Nginx가 이 포트로 프록시

Restart=always
RestartSec=10
# 스테이징은 재시작 대기 조금 더 길게 (운영 영향 최소화)
TimeoutStartSec=30

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

## 주요 옵션 설명

| 옵션 | 설명 |
|------|------|
| `--host 127.0.0.1` | 로컬에서만 수신. 앞단 Nginx 등 리버스 프록시 사용 시 권장. 외부 직접 접근 차단 |
| `--port` | uvicorn 리스닝 포트. Nginx proxy_pass와 일치해야 함 |
| `--workers N` | 워커 수 (CPU·트래픽에 따라 조정, 생략 시 1) |
| `Restart=always` | 비정상 종료 시 자동 재시작 |
| `RestartSec` | 재시작 전 대기 시간(초). 너무 짧으면 DB·연결 풀 재연결 전에 재시도할 수 있음 |
| `TimeoutStartSec` | 시작 제한 시간. 앱 초기화가 느리면 이 값 늘리기 |
