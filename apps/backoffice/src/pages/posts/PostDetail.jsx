import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient, { getAccessToken } from '../../lib/apiClient';

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${da} ${hh}:${mm}`;
}

function statusBadge(status) {
  if (status === 'PUBLISHED') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">공개</span>;
  if (status === 'UNLISTED') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">일부공개</span>;
  if (status === 'PRIVATE') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">비공개</span>;
  return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">임시저장</span>;
}

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/api/posts/${postId}`)
      .then((res) => setPost(res.data))
      .catch((e) => {
        setError(e?.message || '글을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 글을 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/api/posts/${postId}`);
      navigate('/posts');
    } catch (e) {
      alert(e?.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = async (assetId, filename) => {
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const url = base ? `${base}/api/assets/${assetId}/download` : `/api/assets/${assetId}/download`;
    const token = getAccessToken();
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('다운로드에 실패했습니다.');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'download';
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      alert(e?.message || '다운로드에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-600 text-2xl mb-2" />
          <p className="text-red-700">{error || '글이 없습니다.'}</p>
          <Link
            to="/posts"
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">포스트 상세</h1>
          <p className="mt-1 text-sm text-gray-500">포스트 정보를 확인하세요</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/posts"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록으로
          </Link>
          <Link
            to={`/posts/${postId}/edit`}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            수정하기
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            삭제하기
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">카테고리</label>
            <p className="text-sm text-gray-900">{post.category_name || post.category?.name || '미지정'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
            <div>{statusBadge(post.status)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">등록일</label>
            <p className="text-sm text-gray-900">{formatDate(post.created_at)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">발행일</label>
            <p className="text-sm text-gray-900">{post.published_at ? formatDate(post.published_at) : '-'}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">태그</label>
            {post.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">없음</p>
            )}
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title || '(제목 없음)'}</h2>
        <div className="border-t border-gray-200 pt-6">
          <div
            className="prose max-w-none toastui-editor-contents"
            dangerouslySetInnerHTML={{ __html: post.content_html || '<p>내용 없음</p>' }}
          />
        </div>
      </div>

      {/* 첨부 파일 */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">첨부 파일</h3>
        {(function () {
          const attachments = post.attachments ?? [];
          if (attachments.length === 0) {
            return <p className="text-sm text-gray-500">첨부된 파일이 없습니다.</p>;
          }
          return (
            <ul className="space-y-2">
              {attachments.map((a) => {
                const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
                const href = a.url ? (a.url.startsWith('http') ? a.url : base ? `${base}${a.url}` : a.url) : null;
                const label = a.original_name || `파일 ${a.id}`;
                return (
                  <li key={a.id} className="flex items-center gap-3 flex-wrap">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="text-gray-700">{label}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(a.id, label)}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      다운로드
                    </button>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </div>

      {/* Toast UI Editor Contents 스타일 */}
      <style>{`
        .toastui-editor-contents {
          font-family: 'Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif';
          font-size: 16px;
          line-height: 1.8;
          color: #2E3140;
        }
        .dark .toastui-editor-contents { color: #e2e8f0; }
        .toastui-editor-contents h1, .toastui-editor-contents h2, .toastui-editor-contents h3,
        .toastui-editor-contents h4, .toastui-editor-contents h5, .toastui-editor-contents h6 {
          margin-top: 2em; margin-bottom: 1em; font-weight: 700; line-height: 1.4; color: #2E3140; border-bottom: none !important;
        }
        .toastui-editor-contents h1:first-child, .toastui-editor-contents h2:first-child, .toastui-editor-contents h3:first-child,
        .toastui-editor-contents h4:first-child, .toastui-editor-contents h5:first-child, .toastui-editor-contents h6:first-child { margin-top: 0.5em; }
        .dark .toastui-editor-contents h1, .dark .toastui-editor-contents h2, .dark .toastui-editor-contents h3,
        .dark .toastui-editor-contents h4, .dark .toastui-editor-contents h5, .dark .toastui-editor-contents h6 { color: #f7fafc; }
        .toastui-editor-contents h1 { font-size: 2em; }
        .toastui-editor-contents h2 { font-size: 1.5em; }
        .toastui-editor-contents h3 { font-size: 1.25em; }
        .toastui-editor-contents p { margin: 1.2em 0; color: #2E3140; }
        .toastui-editor-contents p:first-child { margin-top: 0.5em; }
        .dark .toastui-editor-contents p { color: #e2e8f0; }
        .toastui-editor-contents img { max-width: 100%; height: auto; border-radius: 8px; margin: 2em 0; }
        .toastui-editor-contents iframe { max-width: 100%; margin: 2em 0; border-radius: 8px; }
        .toastui-editor-contents blockquote {
          border-left: 4px solid #3b82f6; background-color: #f8f9fa; color: #2E3140;
          margin: 1.5em 0; padding: 1em 1.5em; border-radius: 4px;
        }
        .dark .toastui-editor-contents blockquote { border-left-color: #60a5fa; background-color: #1f2937; color: #e2e8f0; }
        .toastui-editor-contents code { background-color: #f1f3f4; color: #e83e8c; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
        .dark .toastui-editor-contents code { background-color: #374151; color: #f472b6; }
        .toastui-editor-contents pre {
          background-color: #f8f9fa; color: #2E3140; padding: 1.5em; border-radius: 8px; overflow-x: auto; margin: 2em 0;
        }
        .dark .toastui-editor-contents pre { background-color: #1f2937; color: #e2e8f0; }
        .toastui-editor-contents pre code { background-color: transparent; color: inherit; padding: 0; }
        .toastui-editor-contents table { width: 100%; border-collapse: collapse; margin: 2em 0; }
        .toastui-editor-contents table th, .toastui-editor-contents table td { border: 1px solid #e2e8f0; padding: 12px; }
        .dark .toastui-editor-contents table th, .dark .toastui-editor-contents table td { border-color: #4a5568; }
        .toastui-editor-contents table th { background-color: #f8f9fa; color: #2E3140; font-weight: 600; }
        .dark .toastui-editor-contents table th { background-color: #374151; color: #e2e8f0; }
        .toastui-editor-contents a { color: #3b82f6; text-decoration: underline; }
        .dark .toastui-editor-contents a { color: #60a5fa; }
        .toastui-editor-contents a:hover { color: #2563eb; }
        .dark .toastui-editor-contents a:hover { color: #93c5fd; }
        .toastui-editor-contents ul, .toastui-editor-contents ol { margin: 1.2em 0; padding-left: 2em; }
        .toastui-editor-contents li { margin: 0.5em 0; color: #2E3140; }
        .dark .toastui-editor-contents li { color: #e2e8f0; }
        .toastui-editor-contents strong { font-weight: 600; color: #2E3140; }
        .dark .toastui-editor-contents strong { color: #f7fafc; }
        .toastui-editor-contents em { font-style: italic; color: #2E3140; }
        .dark .toastui-editor-contents em { color: #e2e8f0; }
      `}</style>
    </div>
  );
}
