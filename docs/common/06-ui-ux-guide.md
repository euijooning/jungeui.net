# Client UI/UX 가이드

**범위**: 방문자용 클라이언트 앱 `apps/client`. Tailwind 기반 통합 리뉴얼 완료 후의 스타일·테마·컴포넌트 규칙을 정리한다.

**관련**: 색상 톤앤매너는 [04-design-guide.md](./04-design-guide.md) 참고. 본 문서는 client 구현 스택과 토큰/클래스 사용법 위주.

---

## 1. 스택

- **Tailwind CSS v4**: `@tailwindcss/vite` 플러그인, `vite.config.js`에 등록.
- **스타일 진입점**: `src/index.css` — `@import "tailwindcss"`, `@theme`, 폰트, 테마 변수, 유틸 클래스.
- **다크 모드**: `<html>`에 `class="dark"` + `data-theme="dark"` 적용. `ThemeContext`가 토글 시 둘 다 동기화.

---

## 2. 디자인 토큰

`index.css`의 `@theme` 및 `:root` / `.dark` 에서 정의. 새 스타일은 가능한 한 이 토큰으로 통일한다.

### 2.1 Tailwind @theme (v4)

| 토큰 | 라이트 | 용도 |
|------|--------|------|
| `--color-primary` | `#35C5F0` | 링크, 버튼, 강조 |
| `--color-primary-hover` | `#2BB8E3` | 호버 |
| `--color-ui-background` | `#FFFFFF` | 페이지 배경 |
| `--color-ui-background-secondary` | `#F5F9FC` | 섹션/입력 배경 |
| `--color-ui-text` | `#1A1A1A` | 본문 텍스트 |
| `--color-ui-text-secondary` | `#555555` | 부가 텍스트 |
| `--color-ui-border` | `#E0E8EE` | 구분선, 테두리 |
| `--color-ui-card` | `#FFFFFF` | 카드 배경 |
| `--font-sans` | NexonLv1Gothic, … | 기본 서체 |

다크 모드는 `@theme dark:` 에서 위 UI 색상만 오버라이드. primary 계열은 동일 유지.

### 2.2 CSS 변수 (호환용)

JS/인라인에서 참조할 때는 `var(--ui-*)` 사용.

- `--ui-primary`, `--ui-primary-hover`
- `--ui-background`, `--ui-background-secondary`
- `--ui-text`, `--ui-text-secondary`
- `--ui-border`, `--ui-card-bg`

`html`에 `class="dark"` 또는 `data-theme="dark"` 이 있으면 `.dark, [data-theme="dark"]` 규칙으로 다크 값 적용.

---

## 3. 폰트

- **기본 서체**: 넥슨 Lv.1 고딕 (NexonLv1Gothic). [눈누](https://noonnu.cc/font_page/432) CDN, `index.css`에 `@font-face` (300 / 400 / 700).
- **적용**: `html` 및 `@theme { --font-sans }` 에 등록되어 전역 적용. `font-weight: 300 | 400 | 700` 사용 가능.

---

## 4. 테마 유틸 클래스 (theme-*)

Tailwind `dark:` 만으로 어색한 영역(헤더, 사이드바, 선택 상태 등)은 `index.css`의 `.theme-*` 클래스로 `var(--ui-*)`를 붙인다. 라이트/다크 자동 전환.

| 클래스 | 용도 |
|--------|------|
| `.theme-bg-card` | 카드 배경 |
| `.theme-bg-secondary` | 보조 배경 |
| `.theme-text` | 본문 색 |
| `.theme-text-secondary` | 부가 텍스트 |
| `.theme-border`, `.theme-border-b`, `.theme-border-t` | 테두리 |
| `.theme-link`, `.theme-link:hover` | 링크/호버 |
| `.theme-link-active` | 선택된 링크(사이드바 등) |
| `.theme-nav-link`, `.theme-nav-link:hover` | 네비 링크 |
| `.theme-input-bg`, `.theme-input-border` | 입력 필드 |
| `.theme-btn-icon` | 아이콘 버튼 테두리/글자 |
| `.theme-card-pill` | 카테고리 필 등 pill |
| `.theme-card-meta` | 카드 메타(날짜 등) |
| `.theme-card-border` | 카드 테두리 |

---

## 5. 본문 HTML (Rich Text)

에디터(TipTap 등) 출력은 `dangerouslySetInnerHTML`로 넣으며, 클래스를 직접 줄 수 없으므로 컨테이너에만 클래스를 건다.

- **컨테이너**: `.post-detail-prose`
- **정의 위치**: `index.css`. 제목(h1–h6), p, ul/ol, blockquote, a, strong/em, img, pre/code 등 스타일이 들어 있음. 색/간격은 `var(--ui-*)` 사용.

---

## 6. 반응형

- **Breakpoint**: Tailwind 기본 + `md:`, `max-[374px]:` 등으로 레이아웃·카드·헤더·상세 조정.
- **모바일**: 햄버거 메뉴로 카테고리 오버레이. 기존 시각 스펙(간격, 카드 라운드 등) 유지.

---

## 7. 정리

- **새 컴포넌트**: 스타일은 Tailwind 유틸리티 + `theme-*` + `var(--ui-*)` 조합으로 작성.
- **색상 추가**: `@theme` / `:root` / `.dark` 에 변수 추가 후, 필요 시 `theme-*` 한 개 추가.
- **index.css**: 폰트, `@theme`, scrollbar-gutter, `:root`/`.dark` 변수, `theme-*`, `.post-detail-prose` 만 유지. 레이아웃/카드용 커스텀 클래스는 Tailwind로 대체된 상태.
