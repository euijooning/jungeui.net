import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import { useTheme } from '../ThemeContext';

const linkBase = "block text-[0.9375rem] no-underline py-2 px-3 rounded-lg transition-colors theme-link";
const linkActive = "theme-link-active text-[0.9375rem]";

export default function SharedLayout({ categories = [], currentCategoryId = null, children }) {
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const isTree = hasCategories && categories[0]?.children !== undefined;

  const sidebarContent = hasCategories ? (
    <>
      <hr className="h-0 border-0 m-0 mb-4" />
      <nav className="sidebar-categories" aria-label="카테고리">
        <h2 className="text-xl font-semibold theme-text-secondary uppercase tracking-wide mb-3 pl-3">카테고리</h2>
        <ul className="list-none p-0 m-0">
          <li className="mb-1">
            <Link to="/" className={`${linkBase} ${!currentCategoryId ? linkActive : ''}`}>전체</Link>
          </li>
          {isTree ? (
            categories.map((root) => (
              <li key={root.id} className="mb-1">
                <Link
                  to={`/?category_id=${root.id}`}
                  className={`${linkBase} ${currentCategoryId === String(root.id) ? linkActive : ''}`}
                >
                  {root.name}
                </Link>
                {root.children?.length > 0 && (
                  <ul className="list-none pl-3 mt-1 mb-2 ml-6 border-l-2 theme-border">
                    {root.children.map((child) => (
                      <li key={child.id} className="mb-0.5">
                        <Link
                          to={`/?category_id=${child.id}`}
                          className={`${linkBase} py-1.5 pl-0 text-[0.9rem] ${currentCategoryId === String(child.id) ? linkActive : ''}`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))
          ) : (
            categories.map((cat) => (
              <li key={cat.id} className="mb-1">
                <Link
                  to={`/?category_id=${cat.id}`}
                  className={`${linkBase} ${currentCategoryId === String(cat.id) ? linkActive : ''}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))
          )}
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
    <nav className="flex items-center justify-between flex-wrap gap-3 md:flex-nowrap">
      <div className="flex items-center gap-8 md:gap-8">
        <Link to="/" className="block" aria-label="홈으로 이동">
          <img src="/favicon.png" alt="Jungeui Lab" className="block h-9 w-auto" />
        </Link>
        <nav className="flex gap-8 items-center" aria-label="메인 메뉴">
          <Link to="/" className="theme-nav-link text-lg pb-0.5 border-b border-transparent -mb-px transition-colors">Posts</Link>
          <Link to="/about" className="theme-nav-link text-lg pb-0.5 border-b border-transparent -mb-px transition-colors">About</Link>
        </nav>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <form className="flex items-center gap-2 max-[374px]:hidden" onSubmit={handleSearch} role="search">
          <input
            type="search"
            name="q"
            className="w-[180px] min-h-9 px-2.5 text-sm border rounded-md theme-input-bg theme-text theme-input-border placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="검색"
            aria-label="제목 검색"
            defaultValue={currentQ}
            key={currentQ || '_'}
          />
          <button type="submit" className="min-h-9 px-3 text-sm font-semibold border border-primary rounded-md bg-primary text-white hover:bg-primary-hover hover:border-primary-hover transition-colors cursor-pointer">
            검색
          </button>
        </form>
        {hasCategories && (
          <button
            type="button"
            className="flex md:hidden items-center justify-center w-8 h-8 border rounded-md theme-btn-icon theme-input-bg hover:bg-[var(--ui-background-secondary)]"
            onClick={() => setOverlayOpen(true)}
            aria-label="카테고리 메뉴"
          >
            <i className="fa-solid fa-bars" />
          </button>
        )}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 border rounded-md theme-btn-icon bg-transparent hover:opacity-80 cursor-pointer"
          onClick={() => setTheme()}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? <i className="fa-regular fa-sun" /> : <i className="fa-regular fa-moon" />}
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
          className="fixed inset-0 z-[1000] bg-black/40 flex justify-end"
          onClick={() => setOverlayOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="메뉴 닫기"
        >
          <div
            className="w-[280px] max-w-[85vw] h-full theme-bg-card shadow-xl z-[1001] p-5 overflow-y-auto flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="카테고리 메뉴"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold theme-text-secondary uppercase tracking-wide m-0">카테고리</h2>
              <button
                type="button"
                className="flex items-center justify-center w-11 h-11 p-0 border rounded-md theme-border theme-bg-secondary theme-text hover:bg-[var(--ui-border)] shrink-0"
                onClick={() => setOverlayOpen(false)}
                aria-label="닫기"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <nav aria-label="카테고리">
              <ul className="list-none p-0 m-0">
                <li className="mb-1">
                  <Link to="/" className={`${linkBase} ${!currentCategoryId ? linkActive : ''}`} onClick={() => setOverlayOpen(false)}>전체</Link>
                </li>
                {isTree ? (
                  categories.map((root) => (
                    <li key={root.id} className="mb-1">
                      <Link
                        to={`/?category_id=${root.id}`}
                        className={`${linkBase} ${currentCategoryId === String(root.id) ? linkActive : ''}`}
                        onClick={() => setOverlayOpen(false)}
                      >
                        {root.name}
                      </Link>
                      {root.children?.length > 0 && (
                        <ul className="list-none pl-3 mt-1 mb-2 ml-6 border-l-2 theme-border">
                          {root.children.map((child) => (
                            <li key={child.id} className="mb-0.5">
                              <Link
                                to={`/?category_id=${child.id}`}
                                className={`${linkBase} py-1.5 pl-0 text-[0.9rem] ${currentCategoryId === String(child.id) ? linkActive : ''}`}
                                onClick={() => setOverlayOpen(false)}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))
                ) : (
                  categories.map((cat) => (
                    <li key={cat.id} className="mb-1">
                      <Link
                        to={`/?category_id=${cat.id}`}
                        className={`${linkBase} ${currentCategoryId === String(cat.id) ? linkActive : ''}`}
                        onClick={() => setOverlayOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
