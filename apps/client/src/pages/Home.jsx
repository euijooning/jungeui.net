import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../components/Card';
import SharedLayout from '../components/SharedLayout';
import { fetchPosts, fetchCategories } from '../api';

const PER_PAGE = 5;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('category_id') || null;

  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories({ tree: true })
      .then((list) => { if (!cancelled) setCategories(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPosts({ page, per_page: PER_PAGE, category_id: categoryId || undefined, q: q || undefined })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.items || []);
        setTotal(res.total || 0);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, q, categoryId]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(Math.max(1, Math.min(p, totalPages))));
    setSearchParams(next);
  };

  const paginationRange = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const range = [1];
    if (left > 2) range.push('…');
    for (let i = left; i <= right; i++) if (!range.includes(i)) range.push(i);
    if (right < totalPages - 1) range.push('…');
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <SharedLayout categories={categories} currentCategoryId={categoryId || null}>
      <div className="search-result-strip">
        {q && (
          <p className="search-result-strip__text">&quot;{q}&quot; 검색 결과 {total}건</p>
        )}
      </div>
      <div className="post-list-center">
        {loading ? (
          <div className="list-message">로딩 중...</div>
        ) : (
          <>
            {posts.length === 0 ? (
              <div className="list-message">게시글이 없습니다.</div>
            ) : (
              <div className="post-grid">
                {posts.map((post) => {
                  const meta = formatDate(post.published_at || post.created_at) || '';
                  const categories = post.category_id != null && post.category_name
                    ? [{ id: post.category_id, name: post.category_name }]
                    : [];
                  return (
                    <Link key={post.id} to={`/posts/${post.id}`}>
                      <Card
                        listMode
                        title={post.title}
                        summary={post.summary && String(post.summary).trim() !== String(post.title || '').trim() ? post.summary : ''}
                        meta={meta}
                        categories={categories}
                        thumbnail={post.thumbnail}
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            <nav className="pagination" aria-label="페이지 네비게이션">
              <div className="pagination__group">
                <button type="button" className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="이전 페이지">&#8249;</button>
                <button type="button" className="pagination__btn" disabled={page <= 1} onClick={() => setPage(1)} aria-label="첫 페이지">&#171;</button>
              </div>
              <div className="pagination__numbers">
                {paginationRange().map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="pagination__ellipsis">…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={`pagination__num ${page === n ? 'pagination__num--active' : ''}`}
                      onClick={() => setPage(n)}
                      aria-label={`${n}페이지`}
                      aria-current={page === n ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <div className="pagination__group">
                <button type="button" className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)} aria-label="마지막 페이지">&#187;</button>
                <button type="button" className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="다음 페이지">&#8250;</button>
              </div>
            </nav>
          </>
        )}
      </div>
    </SharedLayout>
  );
}