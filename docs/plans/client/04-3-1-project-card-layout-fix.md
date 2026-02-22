# 프로젝트 카드 레이아웃 수정 계획 (Best Practices 반영)

## 베스트 프랙티스 요약

| 항목 | 참고 | 적용 방안 |
|------|------|----------|
| **가운데 정렬** | [StackOverflow](https://stackoverflow.com/questions/73560947), [bhch.github.io](https://bhch.github.io/posts/2021/04/centring-flex-items-and-allowing-overflow-scroll/) — `justify-content: center` + overflow 시 잘림 발생 → **패딩/마진으로 초기 오프셋** 사용 | `padding-left`로 트랙 시작 위치를 `(W - 3C - 2G)/2`만큼 밀어 중앙 정렬 |
| **페이드 효과** | [PQINA](https://pqina.nl/blog/fade-out-overflow-using-css-mask-image) — `mask-image`로 edge fade, 배경과 무관하게 동작 | `linear-gradient(to right, transparent, black Xpx, black calc(100%-Xpx), transparent)` |
| **카드 그림자** | Material Design elevation 1–8dp, 4–6단계 유지 권장 | `shadow-md`(≈4dp) → `shadow-lg`(≈8dp)로 상향 |

---

## 이해한 요구사항 및 구현 방법

### 1. 가운데 정렬 (Center alignment)

- **현재**: 카드 그룹이 좌측 정렬되어 "삐뚤" 보임
- **목표**: 3개 카드가 화면 중앙 기준으로 배치
- **Best Practice**: `justify-content: center`는 overflow 시 잘림 발생 → **트랙 시작에 `paddingLeft`**로 초기 오프셋 부여
- **계산식**: `paddingLeft = max(0, (containerWidth - (3 * cardWidth + 2 * CARD_GAP)) / 2)`

### 2. 카드 크기 살짝 증가

- **현재**: `(w - 2*CARD_GAP) / 3.1 * 0.88` (12% 축소)
- **목표**: 카드 크기 완화
- **적용**: `0.88` → `0.95`

### 3. 카드 내부 좌우 여백 확대

- **현재**: `p-4` (16px)
- **목표**: 좌우 패딩 확대
- **적용**: `p-4` → `px-5 py-4` (좌우 20px, 상하 16px 유지)

### 4. 오버플로우 페이드 효과

- **목표**: 잘리는 좌/우를 의도적인 fade로 처리
- **Best Practice** (PQINA): `mask-image` + linear-gradient, box-shadow 대비 배경 무관
- **적용**: `--mask-width: 48px`  
  `mask-image: linear-gradient(to right, transparent, black var(--mask-width), black calc(100% - var(--mask-width)), transparent)`  
  `-webkit-mask-image`, `-moz-mask-image` (autoprefixer 또는 수동)

### 5. 카드 그림자 강화

- **현재**: `shadow-md` (≈4dp)
- **목표**: 카드가 앞으로 도드라져 보이게
- **Best Practice**: Material Design 카드 권장 1–8dp, "앞으로" 느낌은 `shadow-lg` 수준
- **적용**: `shadow-md` → `shadow-lg`

---

## 수정 대상 파일

| 파일 | 수정 내용 |
|------|----------|
| [About.jsx](apps/client/src/pages/About.jsx) | 1) 가운데 정렬(paddingLeft), 2) 카드 크기 0.95, 3) mask-image 페이드 |
| [ProjectCard.jsx](apps/client/src/components/ProjectCard.jsx) | 4) px-5 py-4, 5) shadow-lg |
| [index.css](apps/client/src/index.css) | (선택) `.carousel-fade` 유틸 클래스 |

---

## 구현 상세

### About.jsx

1. **가운데 정렬**  
   - 트랙 `style`에 `paddingLeft: Math.max(0, (containerWidth - (3 * cardWidth + 2 * CARD_GAP)) / 2)` 추가  
   - `containerWidth`는 `carouselRef.current?.clientWidth` (ResizeObserver로 동기화)

2. **카드 크기**  
   - `* 0.88` → `* 0.95`

3. **좌/우 페이드**  
   - overflow 컨테이너에 `mask-image` 적용 (가로 그라데이션, 48px fade)

### ProjectCard.jsx

1. **내부 여백**: `p-4` → `px-5 py-4`
2. **그림자**: `shadow-md` → `shadow-lg`

### index.css (선택)

```css
.carousel-fade {
  --mask-width: 48px;
  -webkit-mask-image: linear-gradient(to right, transparent, black var(--mask-width), black calc(100% - var(--mask-width)), transparent);
  mask-image: linear-gradient(to right, transparent, black var(--mask-width), black calc(100% - var(--mask-width)), transparent);
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
}
```

---

## 다크모드

About 페이지 인사말·프로젝트 섹션은 라이트에서 `bg-[#F0F9FF]`, 다크에서 `dark:bg-[var(--ui-background)]` 적용. 좌우 페이드 그라데이션은 `dark:from-[var(--ui-background)]`로 다크모드 시 테마 배경과 일치시켜 다크모드 일관성 및 가독성을 확보함.
