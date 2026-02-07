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
        <p className="post-detail__loading">불러오는 중...</p>
      </SharedLayout>
    );
  }

  if (error || !post) {
    return (
      <SharedLayout categories={categories} currentCategoryId={null}>
        <div className="post-detail__error">
          <p>{error || '글을 찾을 수 없습니다.'}</p>
          <Link to="/" className="post-detail__back">목록으로 돌아가기</Link>
        </div>
      </SharedLayout>
    );
  }

  const dateStr = formatDate(post.published_at || post.created_at);
  const tags = post.tags || [];

  return (
    <SharedLayout categories={categories} currentCategoryId={currentCategoryId}>
      <article className="post-detail">
        <header className="post-detail__header-card">
          {tags.length > 0 && (
            <div className="post-detail__tags">
              {tags.map((t) => (
                <span key={t.id} className="post-detail__tag-pill">{t.name}</span>
              ))}
            </div>
          )}
          <h1 className="post-detail__title">{post.title}</h1>
          {dateStr && <time className="post-detail__date" dateTime={post.published_at || post.created_at}>{dateStr}</time>}
        </header>

        <div className="post-detail__body-card">
          <div
            ref={bodyRef}
            className="post-detail__body"
            dangerouslySetInnerHTML={{ __html: post.content_html || '' }}
          />
        </div>

        {VITE_UTTERANCES_REPO && (
          <section className="post-detail__comments" aria-label="댓글">
            <div id="utterances-root" />
          </section>
        )}

        {post.attachments?.length > 0 && (
          <section className="post-detail__attachments" aria-label="첨부 파일">
            <div className="post-detail__attachments-card">
              <div className="post-detail__attachments-header">
                <span className="post-detail__attachments-icon" aria-hidden>
                  <PaperclipIcon />
                </span>
                <h2 className="post-detail__attachments-title">첨부 파일</h2>
              </div>
              <ul className="post-detail__attachments-list">
                {post.attachments.map((a) => {
                  const ext = getFileExt(a.original_name);
                  const isPdf = ext === 'pdf';
                  return (
                    <li key={a.id} className="post-detail__attachments-item">
                      <span className="post-detail__attachments-item-inner">
                        <span className={`post-detail__attachments-badge ${isPdf ? 'post-detail__attachments-badge--pdf' : ''}`}>
                          {isPdf ? 'PDF' : (ext || 'FILE').toUpperCase().slice(0, 4)}
                        </span>
                        <span className="post-detail__attachments-filename">{a.original_name}</span>
                        {a.size_bytes != null && (
                          <span className="post-detail__attachments-size">{formatBytes(a.size_bytes)}</span>
                        )}
                      </span>
                      <a
                        href={getStaticUrl(a.url)}
                        download={a.original_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="post-detail__attachments-download"
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

        <nav className="post-detail__nav">
          <div className="post-detail__nav-row">
            <div className="post-detail__nav-cell">
              <span className="post-detail__nav-label">이전글:</span>
              {neighbors.prev ? (
                <Link to={`/posts/${neighbors.prev.id}`} className="post-detail__nav-link">{neighbors.prev.title}</Link>
              ) : (
                <span className="post-detail__nav-none">없음</span>
              )}
            </div>
            <div className="post-detail__nav-cell">
              <span className="post-detail__nav-label">다음글:</span>
              {neighbors.next ? (
                <Link to={`/posts/${neighbors.next.id}`} className="post-detail__nav-link">{neighbors.next.title}</Link>
              ) : (
                <span className="post-detail__nav-none">없음</span>
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
