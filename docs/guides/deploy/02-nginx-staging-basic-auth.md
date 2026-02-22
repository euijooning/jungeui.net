# Nginx 스테이징 Basic Auth

스테이징 도메인에 **Basic Auth**를 걸어 검색엔진 수집·무단 접속·디버그 정보 노출을 막는 방법. Nginx가 스테이징의 진입점일 때 사용한다.

**목적**: 검색엔진·무단 접속·디버그 노출 방지.

**주의**: htpasswd 파일·비밀번호는 저장소에 넣지 않는다. 서버에서만 관리한다.

---

## 적용 순서

1. **htpasswd 설치**: Ubuntu/Debian `apt install apache2-utils`, CentOS `yum install httpd-tools`
2. **htpasswd 파일 생성** (아래 1번)
3. **Nginx server block**에 `auth_basic`, `auth_basic_user_file` 추가 (아래 2번)
4. **적용**: `nginx -t` → `systemctl reload nginx`
5. 브라우저에서 스테이징 URL 접속 시 ID/비밀번호 창이 뜨면 성공

---

## 1. htpasswd 파일 생성

서버에서 한 번만 생성한다. 경로 예: `/etc/nginx/.htpasswd.staging` (실제 값은 서버별로 지정).

```bash
# -c: 새 파일 생성. 기존 사용자 추가 시 -c 제외 (있으면 기존 파일 덮어씀)
htpasswd -c /etc/nginx/.htpasswd.staging staging_user
# 비밀번호 입력 프롬프트에 따라 입력

# Nginx가 읽을 수 있도록 권한 제한 (소유자:rw, 그룹:r, 기타:없음)
chmod 640 /etc/nginx/.htpasswd.staging
```

- 두 번째 사용자 추가 시: `htpasswd /etc/nginx/.htpasswd.staging another_user` (-c 없이)

---

## 2. Nginx server block 예시

스테이징용 `server` 블록에 `auth_basic`과 `auth_basic_user_file`을 추가한다.

**플레이스홀더**:

| 플레이스홀더 | 설명 | 예시 |
|-------------|------|------|
| `staging.example.com` | 클라이언트 도메인 | `app-staging.example.com` |
| `admin-staging.example.com` | 백오피스 도메인 | `admin-staging.example.com` |
| `PATH_TO_CLIENT_DIST` | 클라이언트 빌드 결과물 경로 | `/var/www/staging/client/dist` |
| `PATH_TO_BACKOFFICE_DIST` | 백오피스 빌드 결과물 경로 | `/var/www/staging/backoffice/dist` |
| `API_PORT` | API 리스닝 주소 (http:// 포함) | `http://127.0.0.1:8011` |

```nginx
# 스테이징 클라이언트 (프론트 SPA)
server {
    listen 443 ssl;
    server_name staging.example.com;
    # SSL 인증서 설정(ssl_certificate 등)은 include 또는 동일 블록 내에 별도 정의

    # Basic Auth: 이 server 블록 전체에 적용. 팝업에 "Staging" 메시지 표시
    auth_basic "Staging";
    auth_basic_user_file /etc/nginx/.htpasswd.staging;

    root PATH_TO_CLIENT_DIST;
    index index.html;
    # SPA: 존재하지 않는 경로는 index.html로 fallback (클라이언트 라우팅)
    location / {
        try_files $uri $uri/ /index.html;
    }
    # /api/* 요청은 백엔드 API로 프록시
    location /api/ {
        proxy_pass API_PORT;
        # /api/posts → http://127.0.0.1:8011/api/posts (경로 유지)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 백엔드가 https 여부, 실제 클라이언트 IP 파악에 사용
    }
}

# 스테이징 백오피스 (관리자 SPA)
server {
    listen 443 ssl;
    server_name admin-staging.example.com;

    auth_basic "Staging";
    auth_basic_user_file /etc/nginx/.htpasswd.staging;

    root PATH_TO_BACKOFFICE_DIST;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass API_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**주의**:
- `proxy_pass`에는 `http://127.0.0.1:8011` 형태로 프로토콜·포트까지 포함. 경로만 쓰면 안 됨.
- `location /api/` → `proxy_pass http://127.0.0.1:8011` 인 경우, `/api/posts` 요청이 `http://127.0.0.1:8011/api/posts`로 전달됨 (경로 유지).
- 설정 반영: `sudo nginx -t`로 문법 검사 후 `sudo systemctl reload nginx`.
