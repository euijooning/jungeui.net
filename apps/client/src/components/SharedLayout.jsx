import { Link, useSearchParams } from 'react-router-dom';
import Layout from './Layout'; // [중요] @ui-kit이 아닌 직접 만든 Layout 파일 임포트
import { useTheme } from '../ThemeContext';

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

export default function SharedLayout({ sidebar, children }) {
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q?.value ?? '').trim();
    const next = new URLSearchParams(searchParams);
    if (q) {
      next.set('q', q);
      next.set('page', '1');
    } else {
      next.delete('q');
      next.delete('page');
    }
    setSearchParams(next);
  };

  const currentQ = searchParams.get('q') ?? '';

  const header = (
    <nav className="area_navi">
      <div className="area_navi__inner">
        <Link to="/" className="logo" aria-label="홈으로 이동">
          <img src="/favicon.png" alt="Jungeui Lab" />
        </Link>
        <nav className="area_navi__links">
          <Link to="/">Posts</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <form className="header-search" onSubmit={handleSearch} role="search">
        <input
          type="search"
          name="q"
          className="header-search__input"
          placeholder="검색"
          aria-label="제목 검색"
          defaultValue={currentQ}
          key={currentQ || '_'}
        />
        <button type="submit" className="header-search__btn">검색</button>
      </form>
      <button
        type="button"
        className="btn_theme"
        onClick={() => setTheme()}
        aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {theme === 'dark' ? sunIcon : moonIcon}
      </button>
    </nav>
  );

  const footer = <span>© 2026 Jungeui Lab. All rights reserved.</span>;

  return (
    <Layout header={header} footer={footer} sidebar={sidebar}>
      {children}
    </Layout>
  );
}