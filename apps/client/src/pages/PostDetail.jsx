import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import SharedLayout from '../components/SharedLayout';
import { fetchPost, fetchPostNeighbors, fetchCategories, getStaticUrl } from '../api';
import { useTheme } from '../ThemeContext';
import { VITE_UTTERANCES_REPO } from '../config';
import Lightbox from '@ui-kit/components/react/Lightbox';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name) {
  if (!name || typeof name !== 'string') return '';
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function PostDetail() {
  const { postId } = useParams();
  const { theme } = useTheme();
  const [post, setPost] = useState(null);
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, src: '' });
  const [categories, setCategories] = useState([]);
  const bodyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchCategories({ tree: true })
      .then((list) => { if (!cancelled) setCategories(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPost(Number(postId))
      .then((data) => {
        if (cancelled) return;
        setPost(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '글을 불러올 수 없습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    if (!postId || error) return;
    let cancelled = false;
    fetchPostNeighbors(Number(postId))
      .then((data) => {
        if (!cancelled) setNeighbors({ prev: data.prev || null, next: data.next || null });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [postId, error]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !post?.content_html) return;
    const imgs = el.querySelectorAll('img');
    const handlers = new Map();
    imgs.forEach((img) => {
      img.style.cursor = 'pointer';
      const handler = (e) => {
        e.preventDefault();
        const src = img.getAttribute('src') || img.currentSrc;
        if (src) setLightbox({ open: true, src });
      };
      img.addEventListener('click', handler);
      handlers.set(img, handler);
    });
    return () => {
      handlers.forEach((handler, img) => {
        img.removeEventListener('click', handler);
      });
    };
  }, [post?.content_html]);

  useEffect(() => {
    if (!post || !VITE_UTTERANCES_REPO) return;
    const container = document.getElementById('utterances-root');
    if (container) container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', VITE_UTTERANCES_REPO);
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', theme === 'dark' ? 'github-dark' : 'github-light');
    script.setAttribute('crossorigin', 'anonymous');
    if (container) container.appendChild(script);
    return () => {
      if (container) {
        const s = container.querySelector('script[src*="utteranc"]');
        if (s) s.remove();
        container.innerHTML = '';
      }
    };
  }, [post?.id, theme, VITE_UTTERANCES_REPO]);

  const currentCategoryId = post?.category_id != null ? String(post.category_id) : null;

  if (loading) {
    return (
      <SharedLayout categories={categories} currentCategoryId={null}>
        <p className="text-center py-8 theme-text-secondary">불러오는 중...</p>
      </SharedLayout>
    );
  }

  if (error || !post) {
    return (
      <SharedLayout categories={categories} currentCategoryId={null}>
        <div className="text-center py-8 theme-text-secondary">
          <p>{error || '글을 찾을 수 없습니다.'}</p>
          <Link to="/" className="inline-block mt-4 text-[var(--ui-primary)] no-underline hover:underline">목록으로 돌아가기</Link>
        </div>
      </SharedLayout>
    );
  }

  const dateStr = formatDate(post.published_at || post.created_at);
  const tags = post.tags || [];

  return (
    <SharedLayout categories={categories} currentCategoryId={currentCategoryId}>
      <article className="max-w-[720px] mt-6 md:mt-9">
        <header className="theme-bg-card theme-card-border rounded-xl px-4 py-4 md:p-6 md:px-7 mb-6 shadow-sm">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((t) => (
                <span key={t.id} className="inline-block py-1 px-2.5 text-[0.8125rem] rounded-md theme-bg-secondary theme-text-secondary border theme-border">{t.name}</span>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-bold leading-tight mb-2 mt-0 theme-text">{post.title}</h1>
          {dateStr && <time className="text-[0.9375rem] theme-text-secondary block" dateTime={post.published_at || post.created_at}>{dateStr}</time>}
        </header>

        <div className="max-w-[720px] mb-6 theme-bg-card theme-card-border rounded-xl shadow-sm overflow-hidden">
          <div
            ref={bodyRef}
            className="post-detail-prose px-4 py-4 md:px-6 md:py-5 leading-relaxed text-left theme-text"
            dangerouslySetInnerHTML={{ __html: post.content_html || '' }}
          />
        </div>

        {VITE_UTTERANCES_REPO && (
          <section className="mt-12 pt-8 border-t theme-border" aria-label="댓글">
            <div id="utterances-root" />
          </section>
        )}

        {post.attachments?.length > 0 && (
          <section className="mt-8" aria-label="첨부 파일">
            <div className="max-w-[720px] theme-bg-card theme-card-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 py-2.5 px-4 border-b theme-border">
                <span className="flex items-center justify-center theme-text-secondary" aria-hidden>
                  <PaperclipIcon />
                </span>
                <h2 className="text-[0.9375rem] font-semibold theme-text m-0">첨부 파일</h2>
              </div>
              <ul className="list-none p-0 flex flex-col gap-2 py-2.5 px-4">
                {post.attachments.map((a) => {
                  const ext = getFileExt(a.original_name);
                  const isPdf = ext === 'pdf';
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 p-2 px-3 rounded-lg border theme-bg-secondary theme-border">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 text-[0.6875rem] font-bold py-1 px-2 rounded ${isPdf ? 'bg-red-600 text-white' : 'bg-[var(--ui-border)] theme-text-secondary'}`}>
                          {isPdf ? 'PDF' : (ext || 'FILE').toUpperCase().slice(0, 4)}
                        </span>
                        <span className="text-[0.9375rem] theme-text truncate">{a.original_name}</span>
                        {a.size_bytes != null && (
                          <span className="shrink-0 text-[0.8125rem] theme-text-secondary">{formatBytes(a.size_bytes)}</span>
                        )}
                      </span>
                      <a
                        href={getStaticUrl(a.url)}
                        download={a.original_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center justify-center min-w-9 min-h-9 p-1.5 text-[0.8125rem] font-semibold text-white rounded-lg no-underline transition-colors bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[rgba(53,197,240,0.4)]"
                        aria-label="다운로드"
                      >
                        <DownloadIcon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <nav className="mt-8 py-4 px-4 theme-bg-card theme-card-border rounded-xl shadow-sm md:py-[0.9rem] md:px-[1.1rem]">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.8125rem] font-semibold theme-text-secondary">이전글:</span>
              {neighbors.prev ? (
                <Link to={`/posts/${neighbors.prev.id}`} className="text-[0.875rem] text-[var(--ui-primary-hover)] underline underline-offset-2 hover:text-[var(--ui-primary)]">{neighbors.prev.title}</Link>
              ) : (
                <span className="text-[0.875rem] theme-text-secondary">없음</span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.8125rem] font-semibold theme-text-secondary">다음글:</span>
              {neighbors.next ? (
                <Link to={`/posts/${neighbors.next.id}`} className="text-[0.875rem] text-[var(--ui-primary-hover)] underline underline-offset-2 hover:text-[var(--ui-primary)]">{neighbors.next.title}</Link>
              ) : (
                <span className="text-[0.875rem] theme-text-secondary">없음</span>
              )}
            </div>
          </div>
        </nav>
      </article>
      <Lightbox
        open={lightbox.open}
        onClose={() => setLightbox({ open: false, src: '' })}
        src={lightbox.src}
      />
    </SharedLayout>
  );
}
