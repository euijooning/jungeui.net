import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pencil, Trash2, Paperclip, Download } from 'lucide-react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import apiClient, { getAccessToken, API_BASE, isDev } from '../../lib/apiClient';
import { formatDate as formatDateUtil } from '../../../../../shared/utils/date';

const formatDate = (iso) => formatDateUtil(iso, { withTime: true }) || '-';

function statusBadge(status, published_at) {
  const isScheduled = status === 'PUBLISHED' && published_at && new Date(published_at) > new Date();
  const styles = {
    SCHEDULED: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    PUBLISHED: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    UNLISTED: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    PRIVATE: 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-500',
    DRAFT: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    TEMP: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  };
  const labels = {
    SCHEDULED: '공개예정',
    PUBLISHED: '공개',
    UNLISTED: '일부공개',
    PRIVATE: '비공개',
    DRAFT: '임시저장',
    TEMP: '임시저장',
  };
  const effectiveStatus = isScheduled ? 'SCHEDULED' : status;
  const style = styles[effectiveStatus] || styles.TEMP;
  const label = labels[effectiveStatus] || '임시저장';
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${style}`}>
      {label}
    </span>
  );
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

  useEffect(() => {
    if (post?.title !== undefined) {
      document.title = `${post.title || '포스트 보기'} | 관리자`;
    }
  }, [post?.title]);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 글을 삭제하시겠습니까? \n삭제된 데이터는 복구할 수 없습니다.')) return;
    try {
      await apiClient.delete(`/api/posts/${postId}`);
      navigate('/posts');
    } catch (e) {
      setError(e?.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDownload = async (assetId, filename) => {
    const downloadBase = isDev ? '' : API_BASE;
    const url = downloadBase ? `${downloadBase}/api/assets/${assetId}/download` : `/api/assets/${assetId}/download`;
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
      setError(e?.message || '다운로드에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="loading-spinner" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  const closeErrorDialog = () => {
    setError(null);
    if (!post) navigate('/posts');
  };

  if (error || !post) {
    return (
      <>
        <div className="max-w-2xl mx-auto mt-10">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">글을 찾을 수 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error || '요청하신 글이 존재하지 않거나 삭제되었습니다.'}</p>
            <Link
              to="/posts"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
        <Dialog open={Boolean(error)} onClose={closeErrorDialog} aria-labelledby="postdetail-error-dialog-title">
          <DialogTitle id="postdetail-error-dialog-title">오류</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
          </DialogContent>
          <DialogActions className="dark:border-t dark:border-gray-700">
            <Button onClick={closeErrorDialog} color="primary" variant="contained">확인</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  const categoryName = post.category?.name ?? post.category_name ?? null;

  return (
    <>
      <div className="w-full pb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link to="/posts" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">포스트 관리</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">상세 정보</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">포스트 상세</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/posts"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-all"
          >
            목록
          </Link>
          <Link
            to={`/posts/${postId}/edit`}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <Pencil size={16} strokeWidth={1.5} /> 수정
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
          >
            <Trash2 size={16} strokeWidth={1.5} /> 삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30">
              <div className="flex flex-wrap gap-2 mb-3">
                {categoryName && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {categoryName}
                  </span>
                )}
                {statusBadge(post.status, post.published_at)}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight break-keep">
                {post.title || '(제목 없음)'}
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <div
                className="admin-prose"
                dangerouslySetInnerHTML={{ __html: post.content_html || '<p class="text-gray-400 italic">작성된 내용이 없습니다.</p>' }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-600 pb-2">
              메타 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">등록일</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{formatDate(post.created_at)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">발행일</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {post.published_at ? formatDate(post.published_at) : <span className="text-gray-400 dark:text-gray-500">-</span>}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">조회수</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{post.view_count ?? 0}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">말머리</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {post.prefix_name ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {post.prefix_name}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">미지정</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">태그</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {post.tags?.length > 0 ? (
                    post.tags.map((t) => (
                      <span key={t.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                        # {t.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">태그 없음</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-600 pb-2 flex items-center justify-between">
              <span>첨부 파일</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{post.attachments?.length || 0}</span>
            </h3>
            {(!post.attachments || post.attachments.length === 0) ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-2">첨부된 파일이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {post.attachments.map((a) => {
                  const label = a.original_name || `파일 ${a.id}`;
                  return (
                    <li key={a.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-gray-700 hover:border-green-100 dark:hover:border-gray-600 transition-colors group">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip size={14} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500 shrink-0 group-hover:text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate font-medium group-hover:text-green-700 dark:group-hover:text-green-400">{label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(a.id, label)}
                        className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 p-1 rounded hover:bg-green-100 dark:hover:bg-gray-600 transition-colors"
                        title="다운로드"
                      >
                        <Download size={16} strokeWidth={1.5} className="text-current" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* Nexon Lv1 Gothic 로드 (Client와 동일, 미리보기 WYSIWYG) */
        @font-face {
          font-family: 'NexonLv1Gothic';
          src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@2.1/NEXON%20Lv1%20Gothic%20OTF%20Light.woff') format('woff');
          font-weight: 300;
          font-display: swap;
        }
        @font-face {
          font-family: 'NexonLv1Gothic';
          src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@2.1/NEXON%20Lv1%20Gothic%20OTF.woff') format('woff');
          font-weight: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'NexonLv1Gothic';
          src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@2.1/NEXON%20Lv1%20Gothic%20OTF%20Bold.woff') format('woff');
          font-weight: 700;
          font-display: swap;
        }
        .admin-prose {
          font-family: 'NexonLv1Gothic', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #374151;
          word-break: keep-all;
          overflow-wrap: break-word;
          letter-spacing: -0.02em;
        }
        .admin-prose p { margin-bottom: 1.125em; }
        .admin-prose p:empty,
        .admin-prose div:empty,
        .admin-prose br { display: none; }
        .admin-prose h1, .admin-prose h2, .admin-prose h3, .admin-prose h4, .admin-prose h5, .admin-prose h6 {
          color: #111827;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .admin-prose h1:first-child, .admin-prose h2:first-child { margin-top: 0; }
        .admin-prose h1 { font-size: 1.75rem; }
        .admin-prose h2 { font-size: 1.5rem; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.5rem; }
        .admin-prose h3 { font-size: 1.25rem; }
        .admin-prose h4 { font-size: 1.125rem; }
        .admin-prose h5 { font-size: 1.0625rem; }
        .admin-prose h6 { font-size: 1rem; color: #6B7280; margin-top: 2rem; }
        .admin-prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .admin-prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .admin-prose li { margin-bottom: 0.5em; }
        .admin-prose ul > li > ul,
        .admin-prose ol > li > ol { margin-bottom: 0; margin-top: 0.5rem; }
        .admin-prose blockquote {
          margin: 1rem 0;
          padding: 0.5rem 1rem 0.5rem 1.25rem;
          border-left: 4px solid #35C5F0;
          background: #F3F4F6;
          border-radius: 0 8px 8px 0;
          color: #4B5563;
        }
        .admin-prose blockquote p { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .admin-prose blockquote p:first-child { margin-top: 0; }
        .admin-prose blockquote p:last-child { margin-bottom: 0; }
        .admin-prose pre {
          background-color: #1F2937;
          color: #F3F4F6;
          padding: 1.25rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-family: ui-monospace, monospace;
          font-size: 0.9em;
        }
        .admin-prose code {
          background-color: #F3F4F6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
          color: #DB2777;
          font-family: ui-monospace, monospace;
        }
        .admin-prose pre code { background-color: transparent; color: inherit; padding: 0; }
        .admin-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          font-size: 0.95em;
        }
        .admin-prose th, .admin-prose td {
          border: 1px solid #E5E7EB;
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .admin-prose th { background-color: #F9FAFB; font-weight: 600; }
        .admin-prose img, .admin-prose iframe, .admin-prose video {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 2rem auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .admin-prose a {
          color: #35C5F0;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: rgba(53, 197, 240, 0.3);
        }
        .admin-prose a:hover {
          text-decoration-color: #2BB8E3;
          background-color: rgba(53, 197, 240, 0.05);
        }
        /* 다크 모드: 본문 컨테이너 */
        .dark .admin-prose { color: #d1d5db; }
        .dark .admin-prose h1, .dark .admin-prose h2, .dark .admin-prose h3, .dark .admin-prose h4, .dark .admin-prose h5 { color: #f3f4f6; }
        .dark .admin-prose h6 { color: #9ca3af; }
        .dark .admin-prose h2 { border-bottom-color: #4b5563; }
        .dark .admin-prose blockquote {
          border-left-color: #10b981;
          background: #374151;
          color: #d1d5db;
        }
        .dark .admin-prose code { background-color: #4b5563; color: #f9a8d4; }
        .dark .admin-prose th, .dark .admin-prose td { border-color: #4b5563; }
        .dark .admin-prose th { background-color: #374151; }
        .dark .admin-prose a { color: #34d399; text-decoration-color: rgba(52, 211, 153, 0.4); }
        .dark .admin-prose a:hover { text-decoration-color: #10b981; background-color: rgba(52, 211, 153, 0.1); }
      `}</style>
    </div>
    <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="postdetail-action-error-dialog-title">
      <DialogTitle id="postdetail-action-error-dialog-title">오류</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
      </DialogContent>
      <DialogActions className="dark:border-t dark:border-gray-700">
        <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
      </DialogActions>
    </Dialog>
  </>
  );
}