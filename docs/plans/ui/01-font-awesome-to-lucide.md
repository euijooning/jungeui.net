# 00. Font Awesome → Lucide 전환

## 목표

- **제거**: Font Awesome CDN, `i.fa-*` 마크업, FA 전용 CSS.
- **도입**: `lucide-react` 컴포넌트로 아이콘 통일.
- **참조**: 본 문서에 변경 대상·매핑·작업 순서 정리.

---

## 1. 현재 상태

- **FA CDN**: [apps/client/index.html](apps/client/index.html), [apps/backoffice/index.html](apps/backoffice/index.html) — `font-awesome/6.4.0/css/all.min.css`
- **FA 전용 CSS**: [apps/client/src/index.css](apps/client/src/index.css), [apps/backoffice/src/index.css](apps/backoffice/src/index.css) — `i.fa-solid`, `i.fa-regular`, `i.fa-brands` 블록
- **FA 사용 파일**: Client 4개(About, linkIcons, SharedLayout, PostDetail), Backoffice 4개(AdminLayout, PostDetail, PostList, Dashboard)

---

## 2. 변경 대상 및 Lucide 매핑

### 2.1 CDN·CSS 제거

| 위치 | 내용 |
|------|------|
| apps/client/index.html | font-awesome 링크 제거 |
| apps/backoffice/index.html | 동일 |
| apps/client/src/index.css | i.fa-* 블록 제거 |
| apps/backoffice/src/index.css | 동일 |

### 2.2 클라이언트 (Client)

| 파일 | 현재 (Font Awesome) | Lucide |
|------|---------------------|--------|
| About.jsx | fa-regular fa-message | MessageCircle |
| About.jsx | fa-solid fa-chevron-left | ChevronLeft |
| About.jsx | fa-solid fa-chevron-right | ChevronRight |
| linkIcons.jsx | fa-solid fa-house | Home |
| linkIcons.jsx | fa-brands fa-github | Github |
| linkIcons.jsx | fa-brands fa-instagram | Instagram |
| linkIcons.jsx | fa-brands fa-youtube | Youtube |
| linkIcons.jsx | fa-solid fa-globe | Globe |
| SharedLayout.jsx | fa-solid fa-bars | Menu |
| SharedLayout.jsx | fa-regular fa-sun / fa-moon | Sun / Moon |
| SharedLayout.jsx | fa-solid fa-xmark | X |
| PostDetail.jsx | fa-solid fa-paperclip | Paperclip |
| PostDetail.jsx | fa-solid fa-download | Download |

### 2.3 백오피스 (Backoffice)

**AdminLayout.jsx** — 문자열 키 + ICON_MAP 패턴.

- fa-desktop → **LayoutDashboard**
- fa-project-diagram → **FolderKanban**
- 사이드바 접기/펼치기 → **PanelLeftClose** / **PanelLeftOpen**

| FA | Lucide |
|----|--------|
| fa-desktop | LayoutDashboard |
| fa-file-alt | FileText |
| fa-list | List |
| fa-layer-group | Layers |
| fa-tags | Tags |
| fa-user | User |
| fa-envelope | Mail |
| fa-project-diagram | FolderKanban |
| fa-briefcase | Briefcase |
| fa-chevron-up/down | ChevronUp / ChevronDown |
| fa-bars | Menu |
| fa-indent/outdent | PanelLeftClose / PanelLeftOpen |
| fa-bell | Bell |
| fa-regular fa-sun/moon | Sun / Moon |

**PostDetail.jsx, PostList.jsx, Dashboard.jsx** — 표에 따른 Lucide 컴포넌트로 교체.

### 2.4 전역 CSS (Lucide)

client·backoffice index.css 공통 추가:

```css
.lucide-icon {
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
  opacity: 0.85;
}
```

사용: `<Icon className="lucide-icon" />`

---

## 3. 작업 순서 (CDN은 마지막)

0. 본 문서 작성 (완료)
1. lucide-react 의존성 확인·추가 (client, backoffice)
2. 전역 .lucide-icon CSS 추가
3. Client 교체 (About, linkIcons, SharedLayout, PostDetail)
4. UI 확인
5. Backoffice 교체 (AdminLayout ICON_MAP, PostDetail, PostList, Dashboard)
6. CDN·FA CSS 제거
7. 기타 docs 내 FA 아이콘 이름 → Lucide 수정
