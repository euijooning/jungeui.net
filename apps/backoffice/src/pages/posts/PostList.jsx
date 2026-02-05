import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const PER_PAGE = 10;
const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'DRAFT', label: '임시저장' },
  { value: 'PUBLISHED', label: '발행' },
  { value: 'PRIVATE', label: '비공개' },
];

function formatDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR', { dateStyle: 'short' });
}

function statusBadge(status) {
  if (status === 'PUBLISHED') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">발행</span>;
  if (status === 'PRIVATE') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">비공개</span>;
  return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">임시저장</span>;
}

export default function PostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState({ category_id: '', tag_id: '', status: '' });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/categories');
      setCategories(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch (e) {
      setCategories([]);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/tags');
      setTags(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch (e) {
      setTags([]);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('per_page', String(PER_PAGE));
      if (filter.category_id) params.set('category_id', filter.category_id);
      if (filter.tag_id) params.set('tag_id', filter.tag_id);
      if (filter.status) params.set('status', filter.status);
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
  }, [page, filter.category_id, filter.tag_id, filter.status]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [fetchCategories, fetchTags]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title || id}" 글을 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/posts/${id}`);
      fetchPosts();
    } catch (e) {
      alert(e?.message || '삭제에 실패했습니다.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = page * PER_PAGE + 1;
  const to = Math.min((page + 1) * PER_PAGE, total);

  return (
    <div className="w-full">
      {/* Header - (sample) 스타일: 제목 + 설명 + 우측 버튼 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">포스트 목록</h1>
          <p className="mt-1 text-sm text-gray-500">포스트 목록·수정·삭제</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/posts/new')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 포스트
          </button>
        </div>
      </div>

      {/* Filters - (sample) 흰 카드 + 폼 */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form
          className="flex flex-wrap gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            fetchPosts();
          }}
        >
          <div className="min-w-[140px]">
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <select
              value={filter.category_id}
              onChange={(e) => setFilter((f) => ({ ...f, category_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name || c.slug}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px]">
            <select
              value={filter.tag_id}
              onChange={(e) => setFilter((f) => ({ ...f, tag_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 태그</option>
              {tags.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            검색
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table - (sample) 흰 카드 + 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발행일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        글이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    posts.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() => navigate(`/posts/${row.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-left"
                          >
                            {row.title || '(제목 없음)'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.category?.name ?? row.category_name ?? '-'}</td>
                        <td className="px-4 py-3 text-sm">{statusBadge(row.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(row.published_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(row.updated_at)}</td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button type="button" onClick={() => navigate(`/posts/${row.id}`)} className="text-blue-600 hover:text-blue-800">보기</button>
                          <button type="button" onClick={() => navigate(`/posts/${row.id}/edit`)} className="text-blue-600 hover:text-blue-800">수정</button>
                          <button type="button" onClick={() => handleDelete(row.id, row.title)} className="text-red-600 hover:text-red-800">삭제</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - (sample) 스타일 */}
            {total > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-700">
                    총 {total}개 중 {from}-{to}개
                  </p>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page <= 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-left" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                      p === page ? (
                        <span
                          key={p}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-primary text-sm font-medium text-white"
                        >
                          {p + 1}
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {p + 1}
                        </button>
                      )
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-right" />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
