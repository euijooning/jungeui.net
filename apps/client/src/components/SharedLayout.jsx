import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
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

const hamburgerIcon = (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const closeIcon = (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function SharedLayout({ categories = [], currentCategoryId = null, children }) {
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const hasCategories = Array.isArray(categories) && categories.length > 0;

  const sidebarContent = hasCategories ? (
    <>
      <hr className="sidebar-divider" />
      <nav className="sidebar-categories" aria-label="카테고리">
        <h2 className="sidebar-categories__title">카테고리</h2>
        <ul>
          <li>
            <Link to="/" className={!currentCategoryId ? 'is-active' : ''}>전체</Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/?category_id=${cat.id}`}
                className={currentCategoryId === String(cat.id) ? 'is-active' : ''}
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  ) : null;

  useEffect(() => {
    if (overlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOverlayOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [overlayOpen]);

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
      <div className="area_navi__right">
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
        {hasCategories && (
          <button
            type="button"
            className="btn_hamburger"
            onClick={() => setOverlayOpen(true)}
            aria-label="카테고리 메뉴"
          >
            {hamburgerIcon}
          </button>
        )}
        <button
          type="button"
          className="btn_theme"
          onClick={() => setTheme()}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? sunIcon : moonIcon}
        </button>
      </div>
    </nav>
  );

  const footer = <span>© 2026 Jungeui Lab. All rights reserved.</span>;

  return (
    <>
      <Layout header={header} footer={footer} sidebar={sidebarContent}>
        {children}
      </Layout>

      {overlayOpen && hasCategories && (
        <div
          className="overlay-backdrop"
          onClick={() => setOverlayOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="메뉴 닫기"
        >
          <div
            className="overlay-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="카테고리 메뉴"
          >
            <div className="overlay-panel__header">
              <h2 className="sidebar-categories__title">카테고리</h2>
              <button
                type="button"
                className="overlay-panel__close"
                onClick={() => setOverlayOpen(false)}
                aria-label="닫기"
              >
                {closeIcon}
              </button>
            </div>
            <nav className="sidebar-categories" aria-label="카테고리">
              <ul>
                <li>
                  <Link to="/" className={!currentCategoryId ? 'is-active' : ''} onClick={() => setOverlayOpen(false)}>전체</Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/?category_id=${cat.id}`}
                      className={currentCategoryId === String(cat.id) ? 'is-active' : ''}
                      onClick={() => setOverlayOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
