import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Card from '../components/Card';
import SharedLayout from '../components/SharedLayout';
import { fetchPosts, fetchCategories, fetchTags } from '../api';
import { formatDate } from '../../../../shared/utils/date';

const PER_PAGE = 5;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('category_id') || null;
  const tagId = searchParams.get('tag') || null;

  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const isMobile = useIsMobile();
  const PAGE_GROUP_SIZE = isMobile ? 3 : 5;

  useEffect(() => {
    document.title = pathname === '/posts' ? 'Posts' : '정의랩';
    return () => { document.title = '정의랩'; };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories({ tree: true })
      .then((list) => { if (!cancelled) setCategories(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (tagId) {
      fetchTags().then((list) => {
        if (!cancelled && Array.isArray(list)) setTags(list);
      }).catch(() => {});
    } else {
      setTags([]);
    }
    return () => { cancelled = true; };
  }, [tagId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPosts({
      page,
      per_page: PER_PAGE,
      category_id: categoryId || undefined,
      tag_id: tagId || undefined,
      q: q || undefined,
    })
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
  }, [page, q, categoryId, tagId]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const handlePageChange = (newPage) => {
    const p = Math.max(1, Math.min(newPage, totalPages));
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo(0, 0);
  };

  const currentGroup = Math.ceil(page / PAGE_GROUP_SIZE);
  const startPage = (currentGroup - 1) * PAGE_GROUP_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
  const prevGroupPage = startPage - 1;
  const nextGroupPage = endPage + 1;

  const paginationBtn =
    'w-9 h-9 flex items-center justify-center border rounded-lg text-base transition-colors border-[#C2CFDA] dark:border-[var(--ui-border)] bg-[var(--ui-background-secondary)] text-[var(--ui-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-[var(--ui-border)]';
  const paginationNum =
    'min-w-[36px] h-9 px-2 flex items-center justify-center border rounded-lg text-[0.9375rem] transition-colors border-[#C2CFDA] dark:border-[var(--ui-border)] bg-[var(--ui-background-secondary)] text-[var(--ui-text)] hover:bg-[var(--ui-border)]';
  const paginationActive =
    'bg-[var(--ui-primary)] border-[var(--ui-primary)] text-white hover:bg-[var(--ui-primary-hover)] hover:border-[var(--ui-primary-hover)]';

  return (
    <SharedLayout categories={categories} currentCategoryId={categoryId || null}>
      <div className="mb-3 min-h-6">
        {tagId && (
          <p className="m-0 text-[0.9375rem] theme-text-secondary">
            {tags.find((t) => String(t.id) === tagId)?.name ?? '태그'} 검색 결과 {total}건
          </p>
        )}
        {!tagId && q && (
          <p className="m-0 text-[0.9375rem] theme-text-secondary">
            &quot;{q}&quot; 검색 결과 {total}건
          </p>
        )}
      </div>
      <div className="w-full flex flex-col gap-4">
        {loading ? (
          <div className="theme-text-secondary text-center py-8">로딩 중...</div>
        ) : (
          <>
            {posts.length === 0 ? (
              <div className="theme-text-secondary text-center py-8">게시글이 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-6 w-full [&>a]:no-underline [&>a]:text-inherit [&>a]:block group/list">
                {posts.map((post) => {
                  const meta = formatDate(post.published_at || post.created_at) || '';
                  const categories = post.category_id != null && post.category_name
                    ? [{ id: post.category_id, name: post.category_name }]
                    : [];
                  return (
                    <Link key={post.id} to={`/posts/${post.id}`} className="group/card">
                      <Card
                        listMode
                        title={post.title}
                        summary={post.summary && String(post.summary).trim() !== String(post.title || '').trim() ? post.summary : ''}
                        meta={meta}
                        categories={categories}
                        thumbnail={post.thumbnail}
                        className="group-hover/card:-translate-y-0.5 group-hover/card:shadow-md"
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            <nav className="flex items-center justify-center gap-2 mt-8 flex-wrap" aria-label="페이지 네비게이션">
              <div className="flex items-center gap-1">
                <button type="button" className={paginationBtn} disabled={startPage <= 1} onClick={() => handlePageChange(prevGroupPage)} aria-label="이전 그룹">
                  <ChevronsLeft size={18} />
                </button>
                <button type="button" className={paginationBtn} disabled={page <= 1} onClick={() => handlePageChange(page - 1)} aria-label="이전 페이지">
                  <ChevronLeft size={18} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${paginationNum} ${page === p ? paginationActive : ''}`}
                    onClick={() => handlePageChange(p)}
                    aria-label={`${p}페이지`}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className={paginationBtn} disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} aria-label="다음 페이지">
                  <ChevronRight size={18} />
                </button>
                <button type="button" className={paginationBtn} disabled={endPage >= totalPages} onClick={() => handlePageChange(nextGroupPage)} aria-label="다음 그룹">
                  <ChevronsRight size={18} />
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
    </SharedLayout>
  );
}