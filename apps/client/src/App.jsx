import { useState } from 'react';
import { Layout, Button, Card, Lightbox } from '@ui-kit/components/react';
import { useTheme } from './ThemeContext';

const sunIcon = (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const moonIcon = (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function App() {
  const { theme, setTheme } = useTheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const sampleImage = '/favicon.png';

  const header = (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Jungeui Lab 홈">
        <img src={sampleImage} alt="Jungeui Lab" style={{ height: '28px', width: 'auto', display: 'block' }} />
      </a>
      <button
        type="button"
        onClick={() => setTheme()}
        aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.35rem',
          border: '1px solid var(--ui-border)',
          borderRadius: '6px',
          background: 'transparent',
          color: 'var(--ui-text)',
          cursor: 'pointer',
        }}
      >
        {theme === 'dark' ? sunIcon : moonIcon}
      </button>
    </nav>
  );

  const footer = <span>© 2026 Jungeui Lab. All rights reserved.</span>;

  return (
    <Layout header={header} footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Phase 01 검증</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div style={{ maxWidth: '320px' }}>
            <Card
              title="샘플 카드"
              summary="Phase 01 공통 컴포넌트 검증용 카드입니다. 썸네일, 제목, 요약, 메타 영역이 포함됩니다."
              meta="카테고리 · 2026-02-05"
              thumbnail={sampleImage}
              onClick={() => setLightboxOpen(true)}
            />
          </div>
        </section>
      </div>
      <Lightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} src={sampleImage} />
    </Layout>
  );
}
