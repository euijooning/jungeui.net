# 502 / 로그인 실패 시 확인할 곳

`/api/auth/login` 502가 나오면 **프록시(nginx)가 백엔드(API)에서 응답을 못 받은 상태**다. 아래 순서대로 확인한다.

---

## 1. API 프로세스가 떠 있는지 (서버 SSH 후)

```bash
# 서비스 이름은 배포 시 정한 이름 (예: myapi-staging, jungeui-api 등)
sudo systemctl status myapi-staging
```

- **active (running)** 이어야 함. **inactive** / **failed** 면 API가 안 떠 있는 것.
- 재시작: `sudo systemctl restart myapi-staging`
- 실시간 로그(에러 확인): `journalctl -u myapi-staging -f`

**서비스 이름·경로를 모르면**  
→ systemd 서비스 파일 위치: **`/etc/systemd/system/`**  
→ `ls /etc/systemd/system/*.service` 후 API용 서비스 찾기.

---

## 2. ENV / .env 로드 (스테이징이면 .env.staging 써야 함)

- **systemd 서비스 파일**: `/etc/systemd/system/내API서비스이름.service`
  - 스테이징이면 반드시 **`Environment="ENV=staging"`** 있어야 함.
  - 없으면 앱이 `.env`만 읽고 `.env.staging`은 안 읽음 (CORS 등이 스테이징 값으로 안 들어감).
- **프로젝트 루트**에 `.env.staging` 파일이 있고, `CORS_ORIGINS`에 로그인 쓰는 도메인(예: `https://new-admin.jungeui.net`)이 포함돼 있는지 확인.

수정 후: `sudo systemctl daemon-reload` → `sudo systemctl restart 내API서비스이름`

---

## 3. Nginx 프록시 (proxy_pass 포트 = API 포트)

- **설정 파일 위치** (서버마다 다름):
  - Ubuntu/Debian: **`/etc/nginx/sites-available/`** 또는 **`/etc/nginx/sites-enabled/`**
  - CentOS/RHEL: **`/etc/nginx/conf.d/`**
- **new-admin.jungeui.net** (또는 백오피스 도메인)용 `server` 블록에서 `location /api/` 찾기.
  - **`proxy_pass http://127.0.0.1:XXXX;`** 의 포트 `XXXX`가 **systemd에서 API가 리스닝하는 포트와 동일**한지 확인 (스테이징 예: 8011).
- 문법 검사 후 재적용: `sudo nginx -t` → `sudo systemctl reload nginx`

---

## 4. API에 직접 요청해서 502인지 확인

서버에서 (API 포트가 8011이라 가정):

```bash
curl -v -X POST http://127.0.0.1:8011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jungeui.net","password":"비밀번호"}'
```

- **127.0.0.1:8011** 에서 정상 응답이 나오면 → API는 동작하는 것이고, **nginx 쪽 proxy_pass/포트 문제**일 가능성이 큼.
- 여기서도 실패/연결 거부면 → **API가 해당 포트에서 안 떠 있거나, 크래시** → `journalctl -u myapi-staging -f` 로 에러 확인.

---

## 요약: 확인 위치

| 확인 항목 | 어디서 |
|-----------|--------|
| API 실행 여부 | `systemctl status 서비스이름`, `journalctl -u 서비스이름 -f` |
| 서비스 파일(ENV, 포트) | `/etc/systemd/system/*.service` |
| .env / CORS | 프로젝트 루트 `.env`, `.env.staging` |
| 프록시 포트 | `/etc/nginx/sites-available/` 또는 `sites-enabled/`, `conf.d/` 의 `proxy_pass` 포트 |
| API 직접 호출 | 서버에서 `curl http://127.0.0.1:API포트/api/auth/login` |
