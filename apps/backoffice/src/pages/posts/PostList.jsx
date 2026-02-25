import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import apiClient from '../../lib/apiClient';
import { formatDate as formatDateUtil } from '../../../../../shared/utils/date';

const PER_PAGE = 10;
const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PUBLISHED', label: '공개' },
  { value: 'UNLISTED', label: '일부공개' },
  { value: 'PRIVATE', label: '비공개' },
];

const formatDate = (v) => formatDateUtil(v, { dateStyle: 'short' }) || '-';

function statusBadge(status, published_at) {
  const isScheduled = status === 'PUBLISHED' && published_at && new Date(published_at) > new Date();
  if (isScheduled) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">공개예정</span>;
  if (status === 'PUBLISHED') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">공개</span>;
  if (status === 'UNLISTED') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">일부공개</span>;
  if (status === 'PRIVATE') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">비공개</span>;
  return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">임시저장</span>;
}

export default function PostList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const currentStatus = searchParams.get('status') || '';
  const currentCategory = searchParams.get('category_id') || '';
  const currentPrefix = searchParams.get('prefix_id') || '';
  const currentQ = searchParams.get('q') || '';
  const currentOrder = searchParams.get('order_by') || 'latest_published';

  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [prefixes, setPrefixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageFromUrl = pageParam - 1;
  const page = total === 0 ? pageFromUrl : Math.min(pageFromUrl, totalPages - 1);
  const from = page * PER_PAGE + 1;
  const to = Math.min((page + 1) * PER_PAGE, total);

  const updateParams = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== '') next.set(key, String(value));
        else next.delete(key);
      });
      if (!Object.prototype.hasOwnProperty.call(updates, 'page')) {
        next.set('page', '1');
      }
      return next;
    });
  }, [setSearchParams]);

  const setPageToUrl = useCallback((newPage) => {
    updateParams({ page: String(newPage + 1) });
  }, [updateParams]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/categories?tree=true');
      const raw = Array.isArray(res.data) ? res.data : res.data?.items || [];
      const flat = [];
      raw.forEach((node) => {
        flat.push({ id: node.id, name: node.name, label: node.name });
        (node.children || []).forEach((child) => {
          flat.push({ id: child.id, name: child.name, label: ` — ${child.name}`, parentName: node.name });
        });
      });
      setCategories(flat);
    } catch (e) {
      setCategories([]);
    }
  }, []);

  const fetchPrefixes = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/post_prefixes');
      const raw = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setPrefixes(raw);
    } catch (e) {
      setPrefixes([]);
    }
  }, []);

  // 3. fetchPosts: URL 파라미터를 기반으로 데이터 요청
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('per_page', String(PER_PAGE));
      
      if (currentCategory) params.set('category_id', currentCategory);
      if (currentStatus) params.set('status', currentStatus);
      if (currentPrefix) params.set('prefix_id', currentPrefix);
      if (currentQ.trim()) params.set('q', currentQ.trim());
      if (currentOrder && currentOrder !== 'latest_published') params.set('order_by', currentOrder);

      const res = await apiClient.get(`/api/posts?${params.toString()}`);
      const data = res.data;
      const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      setPosts(list);
      const totalVal = typeof data?.total === 'number' ? data.total : Array.isArray(data) ? data.length : list.length;
      setTotal(totalVal);
    } catch (e) {
      setError(e?.message || '목록을 불러오지 못했습니다.');
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, currentCategory, currentStatus, currentPrefix, currentQ, currentOrder]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPrefixes();
  }, [fetchPrefixes]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title || id}" 글을 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/posts/${id}`);
      fetchPosts();
    } catch (e) {
      setError(e?.message || '삭제에 실패했습니다.');
    }
  };

  const allPageSelected = posts.length > 0 && posts.every((row) => selectedIds.has(row.id));
  const toggleAll = () => {
    if (allPageSelected) setSelectedIds((prev) => { const n = new Set(prev); posts.forEach((row) => n.delete(row.id)); return n; });
    else setSelectedIds((prev) => { const n = new Set(prev); posts.forEach((row) => n.add(row.id)); return n; });
  };
  const toggleOne = (id) => {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">포스트 목록</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">포스트 목록·수정·삭제</p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('정말 삭제하시겠습니까?')) return;
              try {
                for (const id of selectedIds) await apiClient.delete(`/api/posts/${id}`);
                setSelectedIds(new Set());
                fetchPosts();
                window.alert('삭제가 완료되었습니다.');
              } catch (e) {
                setError(e?.message || '삭제에 실패했습니다.');
              }
            }}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            삭제
          </button>
          <button
            onClick={() => navigate('/posts/new')}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            새 포스트
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <form
          className="flex flex-wrap gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const q = e.currentTarget.querySelector('input[name="title_q"]')?.value?.trim() ?? '';
            updateParams({ q });
          }}
        >
          <div className="min-w-[140px]">
            <select
              value={currentStatus}
              onChange={(e) => updateParams({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <select
              value={currentCategory}
              onChange={(e) => updateParams({ category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.parentName ? `${c.parentName} > ${c.name}` : (c.label || c.name)}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <select
              value={currentPrefix}
              onChange={(e) => updateParams({ prefix_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">전체 말머리</option>
              {prefixes.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <input
              name="title_q"
              type="text"
              placeholder="제목 검색"
              defaultValue={currentQ}
              key={`q-${currentQ}`}
              onBlur={(e) => {
                if (e.target.value.trim() !== currentQ) updateParams({ q: e.target.value.trim() });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateParams({ q: e.currentTarget.value.trim() });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            검색
          </button>
        </form>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="order-by" className="text-sm font-medium text-gray-700 dark:text-gray-300">정렬기준</label>
        <select
          id="order-by"
          value={currentOrder}
          onChange={(e) => updateParams({ order_by: e.target.value })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
        >
          <option value="latest_published">최신순</option>
          <option value="views">조회순</option>
          <option value="oldest">오래된 순</option>
        </select>
      </div>

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="postlist-error-dialog-title">
        <DialogTitle id="postlist-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">로딩 중...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                      <input type="checkbox" checked={allPageSelected} onChange={toggleAll} className="rounded border-gray-300 dark:border-gray-500 dark:bg-gray-600" />
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">제목</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">카테고리</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">등록일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">발행일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">조회수</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        글이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    posts.map((row, index) => {
                      const displayNo = total - page * PER_PAGE - index;
                      return (
                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-2 py-3 text-center">
                            <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)} className="rounded border-gray-300 dark:border-gray-500 dark:bg-gray-600" />
                          </td>
                          <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">{displayNo}</td>
                          <td className="px-4 py-3 text-sm">
                            <Link
                              to={`/posts/${row.id}`}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-left"
                            >
                              {row.title || '(제목 없음)'}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{row.category?.name ?? row.category_name ?? '-'}</td>
                          <td className="px-4 py-3 text-sm">{statusBadge(row.status, row.published_at)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(row.created_at)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(row.published_at)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{row.view_count ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-right space-x-2">
                            <button 
                              type="button" 
                              onClick={() => navigate(`/posts/${row.id}`)} 
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              보기
                            </button>
                            <button type="button" onClick={() => navigate(`/posts/${row.id}/edit`)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">수정</button>
                            <button type="button" onClick={() => handleDelete(row.id, row.title)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">삭제</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  type="button"
                  onClick={() => setPageToUrl(Math.max(0, page - 1))}
                  disabled={page <= 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => setPageToUrl(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {total === 0 ? '총 0개 중 0개 표시' : `총 ${total}개 중 ${from}-${to}개`}
                </p>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      type="button"
                      onClick={() => setPageToUrl(Math.max(0, page - 1))}
                      disabled={page <= 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                      p === page ? (
                        <span
                          key={p}
                          className="relative inline-flex items-center px-4 py-2 border border-green-600 dark:border-green-500 bg-green-600 dark:bg-green-600 text-sm font-medium text-white"
                        >
                          {p + 1}
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPageToUrl(p)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          {p + 1}
                        </button>
                      )
                    ))}
                    <button
                      type="button"
                      onClick={() => setPageToUrl(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </button>
                  </nav>
                </div>
              </div>
          </>
        )}
      </div>
    </div>
  );
}