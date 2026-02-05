import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import About from './pages/About';
import { VITE_CLIENT_URL } from './config';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (VITE_CLIENT_URL && document.head) {
      const base = VITE_CLIENT_URL.replace(/\/$/, '');
      const canonical = document.querySelector('link[rel="canonical"]');
      const href = `${base}${pathname === '/' ? '' : pathname}`;
      if (canonical) canonical.setAttribute('href', href);
      else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = href;
        document.head.appendChild(link);
      }
    }
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee' }}>
        <Link to="/" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>Jungeui Lab</Link>
        <Link to="/" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>Posts</Link>
        <Link to="/about" style={{ marginRight: '1rem', textDecoration: 'none', color: 'inherit' }}>About</Link>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <footer style={{ padding: '1rem 2rem', borderTop: '1px solid #eee', fontSize: '0.875rem', color: '#666' }}>
        © 2026 Jungeui Lab. All rights reserved.
      </footer>
    </div>
  );
}
