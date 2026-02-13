import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Radio,
  RadioGroup,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import apiClient, { getAccessToken } from '../../lib/apiClient';

const TOAST_UI_SCRIPT = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
const TOAST_UI_I18N = 'https://uicdn.toast.com/editor/latest/i18n/ko-kr.js';
const TOAST_UI_CSS = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';

const ATTACH_ACCEPT = '.png,.jpg,.jpeg,.pdf,.ppt,.pptx,.hwp,.hwpx,.docx';
const ATTACH_EXT_SET = new Set(['png', 'jpg', 'jpeg', 'pdf', 'ppt', 'pptx', 'hwp', 'hwpx', 'docx']);
const MAX_ATTACH_SIZE = 10 * 1024 * 1024;

function slugFromTitle(title) {
  return (title || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'untitled';
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadCss(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = resolve;
    l.onerror = reject;
    document.head.appendChild(l);
  });
}

const YT_URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const makeIframeHTML = (id) =>
  `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="width:100%; aspect-ratio:16/9;"></iframe>`;

function youtubeAndImageSanitizer(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const allowed = new Set(['DIV', 'IFRAME', '#text', 'P', 'BR', 'SPAN', 'B', 'I', 'EM', 'STRONG', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'CODE', 'PRE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'HR', 'A', 'IMG', 'STYLE']);
    doc.body.querySelectorAll('*').forEach((el) => {
      const nm = el.nodeName;
      if (!allowed.has(nm)) {
        el.remove();
        return;
      }
      [...el.attributes].forEach((a) => {
        if (a.name.toLowerCase().startsWith('on')) el.removeAttribute(a.name);
      });
      if (nm === 'A') {
        el.setAttribute('rel', 'noopener noreferrer');
        el.setAttribute('target', '_blank');
      }
      if (nm === 'IMG') {
        const safe = new Set(['src', 'alt', 'style', 'width', 'height', 'loading']);
        [...el.attributes].forEach((a) => {
          if (!safe.has(a.name.toLowerCase())) el.removeAttribute(a.name);
        });
      }
      if (nm === 'IFRAME') {
        const src = el.getAttribute('src') || '';
        const ok = /^https:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]{11}$/.test(src);
        if (!ok) {
          el.remove();
          return;
        }
        const safe = new Set(['src', 'title', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'style']);
        [...el.attributes].forEach((a) => {
          if (!safe.has(a.name.toLowerCase())) el.removeAttribute(a.name);
        });
      }
    });
    return doc.body.innerHTML;
  } catch {
    return '';
  }
}

export default function PostEditor({ isEdit = false, postId = null }) {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const multiImageInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [toastUILoaded, setToastUILoaded] = useState(false);
  const [initialEditorContent, setInitialEditorContent] = useState(null);
  const [form, setForm] = useState({
    title: '',
    status: '',
    visibility: '',
    publishType: 'now',
    published_at: '',
    category_id: '__select__',
    thumbnail_asset_id: null,
    post_tags: [],
  });
  const [attachmentList, setAttachmentList] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  // apiBase가 있으면 절대 URL로 넣어서 API에서 직접 로드(에디터에서 이미지 표시). 없으면 상대 URL(프록시 경유).
  const toImageSrc = (url) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return apiBase ? apiBase + (url.startsWith('/') ? url : `/${url}`) : url;
  };

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoadError(null);
    try {
      const res = await apiClient.get(`/api/posts/${postId}`);
      const d = res.data;
      const status = d.status ?? 'DRAFT';
      const pubAt = d.published_at ? d.published_at.slice(0, 16) : '';
      const isScheduled = status === 'PUBLISHED' && pubAt && new Date(pubAt) > new Date();
      const visibility = status === 'DRAFT' ? 'PUBLISHED' : status;
      setForm({
        title: d.title ?? '',
        status: visibility,
        visibility,
        publishType: isScheduled ? 'scheduled' : 'now',
        published_at: pubAt,
        category_id: d.category_id != null ? String(d.category_id) : '',
        thumbnail_asset_id: d.thumbnail_asset_id ?? null,
        post_tags: (Array.isArray(d.post_tags) ? d.post_tags : d.tags || []).map((t) =>
          typeof t === 'object' && t?.id != null ? t.id : t
        ),
      });
      setAttachmentList((Array.isArray(d.attachments) ? d.attachments : []).map((a) => ({
        id: a.id,
        original_name: a.original_name || `파일 ${a.id}`,
      })));
      setInitialEditorContent(d.content_html || '');
    } catch (e) {
      setLoadError(e?.message || '글을 불러오지 못했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          apiClient.get('/api/categories?tree=true'),
          apiClient.get('/api/tags'),
        ]);
        const raw = Array.isArray(catRes.data) ? catRes.data : catRes.data?.items ?? [];
        const flat = [];
        raw.forEach((node) => {
          flat.push({ id: node.id, name: node.name, label: node.name });
          (node.children || []).forEach((child) => {
            flat.push({ id: child.id, name: child.name, label: ` — ${child.name}`, parentName: node.name });
          });
        });
        setCategories(flat);
        setTags(Array.isArray(tagRes.data) ? tagRes.data : tagRes.data?.items ?? []);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (isEdit && postId) loadPost();
    else setInitialEditorContent('');
  }, [isEdit, postId, loadPost]);

  useEffect(() => {
    const load = async () => {
      if (window.toastui?.Editor) {
        setToastUILoaded(true);
        return;
      }
      await loadScript(TOAST_UI_SCRIPT);
      await loadCss(TOAST_UI_CSS);
      for (let i = 0; i < 50; i++) {
        if (window.toastui?.Editor) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (window.toastui?.Editor) {
        await loadScript(TOAST_UI_I18N);
      }
      for (let i = 0; i < 30; i++) {
        if (window.toastui?.Editor) {
          setToastUILoaded(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      console.warn('[PostEditor] Toast UI Editor not found on window.toastui after load');
      setToastUILoaded(true);
    };
    load();
  }, []);

  const canInitEditor = toastUILoaded && (!isEdit || initialEditorContent !== null);

  useEffect(() => {
    if (!canInitEditor) return;
    if (!window.toastui?.Editor) {
      console.warn('[PostEditor] window.toastui.Editor not available, skipping editor init');
      return;
    }

    let cancelled = false;
    const t = setTimeout(() => {
      const el = document.getElementById('post-editor');
      if (cancelled || !el) return;
      const Editor = window.toastui?.Editor;
      if (!Editor) {
        console.warn('[PostEditor] window.toastui.Editor lost in setTimeout');
        return;
      }

      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (e) {}
        editorRef.current = null;
      }

      const initialValue = isEdit ? (initialEditorContent || '') : '';

      const customHTMLRenderer = {
        htmlBlock: {
          iframe(node) {
            return [
              { type: 'openTag', tagName: 'iframe', outerNewLine: true, attributes: node.attrs },
              { type: 'html', content: node.childrenHTML },
              { type: 'closeTag', tagName: 'iframe', outerNewLine: true },
            ];
          },
        },
      };

      const token = getAccessToken();
      const pid = (isEdit && postId) ? String(postId) : 'temp';
      const uploadImageBlob = async (blob, source) => {
        console.log(`[이미지업로드] ${source} 시작`, { size: blob?.size, type: blob?.type });
        const fd = new FormData();
        fd.append('file', blob, blob.name || 'image.jpg');
        const res = await fetch(`/api/assets/upload?post_id=${encodeURIComponent(pid)}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || '이미지 업로드에 실패했습니다.');
        }
        const data = await res.json();
        const url = data.url ?? data.file_path ?? data.file_url;
        console.log(`[이미지업로드] ${source} 성공`, { url, id: data.id });
        return { url, id: data.id };
      };

      const ed = new Editor({
        el,
        height: '600px',
        initialEditType: 'wysiwyg',
        previewStyle: 'tab',
        usageStatistics: false,
        language: 'ko-KR',
        placeholder: '내용을 입력하세요',
        initialValue,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
        ],
        customHTMLSanitizer: youtubeAndImageSanitizer,
        customHTMLRenderer,
        hooks: {
          addImageBlobHook: async (blob, callback) => {
            try {
              const { url } = await uploadImageBlob(blob, 'addImageBlobHook');
              callback(toImageSrc(url), '');
            } catch (err) {
              console.error('[이미지업로드] addImageBlobHook 실패', err);
              callback('', err.message || '이미지 업로드에 실패했습니다.');
            }
          },
        },
      });

      const onPaste = (e) => {
        const cd = e.clipboardData || window.clipboardData;
        if (!cd) return;
        const text = cd.getData('text') || '';
        const items = cd.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[이미지업로드] paste 이벤트에서 이미지 감지, 업로드 시작');
                uploadImageBlob(blob, 'Ctrl+V')
                  .then(({ url }) => {
                    if (url) {
                      const src = toImageSrc(url);
                      const html = ed.getHTML();
                      ed.setHTML(html + `<img src="${src}" alt="업로드" style="max-width:100%;height:auto;"><br>`);
                    }
                  })
                  .catch((err) => console.error('[이미지업로드] Ctrl+V 실패', err));
                return;
              }
            }
          }
        }
        const m = text.match(YT_URL_RE);
        if (!m) return;
        setTimeout(() => {
          const html = ed.getHTML();
          const replaced = html.replace(
            /<p>(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^<\s]+)<\/p>/i,
            () => makeIframeHTML(m[1])
          );
          if (replaced !== html) ed.setHTML(replaced);
        }, 0);
      };
      el.addEventListener('paste', onPaste, true);

      const onChange = (() => {
        let t;
        return () => {
          clearTimeout(t);
          t = setTimeout(() => {
            const html = ed.getHTML();
            const replaced = html.replace(
              /<p>(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^<\s]+)<\/p>/gi,
              (whole, url) => {
                const match = url.match(YT_URL_RE);
                return match ? makeIframeHTML(match[1]) : whole;
              }
            );
            if (replaced !== html) ed.setHTML(replaced);
            setContentHtml(ed.getHTML());
          }, 250);
        };
      })();
      ed.on('change', onChange);
      setContentHtml(ed.getHTML());

      editorRef.current = ed;
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(t);
      try {
        if (editorRef.current) editorRef.current.destroy();
      } catch (e) {}
      editorRef.current = null;
    };
  }, [canInitEditor, isEdit, initialEditorContent]);

  const handleMultiImageChange = async (e) => {
    const files = e.target.files;
    if (!files?.length || !editorRef.current) return;
    const token = getAccessToken();
    const ed = editorRef.current;
    const pid = (isEdit && postId) ? String(postId) : 'temp';
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file, file.name || 'image.jpg');
        const res = await fetch(`/api/assets/upload?post_id=${encodeURIComponent(pid)}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error('업로드 실패');
        const data = await res.json();
        const url = data.url ?? data.file_path ?? data.file_url;
        if (url) {
          const html = ed.getHTML();
          ed.setHTML(html + `<img src="${toImageSrc(url)}" alt="" style="max-width:100%;height:auto;"><br>`);
        }
      } catch (err) {
        console.error('이미지 업로드 오류:', err);
      }
    }
    e.target.value = '';
  };

  const handleTitleChange = (e) => {
    setForm((f) => ({ ...f, title: e.target.value }));
  };

  const handleTagKeyDown = async (e) => {
    if (e.key !== 'Enter' || !tagInput.trim()) return;
    e.preventDefault();
    const name = tagInput.trim();
    const existing = tags.find((t) => (t.name || '').toLowerCase() === name.toLowerCase());
    let id = existing?.id;
    if (!id) {
      try {
        const res = await apiClient.post('/api/tags', { name });
        id = res.data?.id;
        if (id) setTags((prev) => [...prev, { id, name: res.data?.name ?? name }]);
      } catch (err) {
        return;
      }
    }
    if (id && !form.post_tags.includes(id)) setForm((f) => ({ ...f, post_tags: [...f.post_tags, id] }));
    setTagInput('');
  };

  const removeTag = (idOrName) => {
    setForm((f) => ({ ...f, post_tags: f.post_tags.filter((x) => x !== idOrName) }));
  };

  const attachmentInputRef = useRef(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const handleAttachmentSelect = async (e) => {
    const files = Array.from(e.target?.files || []);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    if (!files.length) return;
    const extOk = (f) => ATTACH_EXT_SET.has((f.name || '').split('.').pop()?.toLowerCase());
    const sizeOk = (f) => f.size <= MAX_ATTACH_SIZE;
    setAttachmentUploading(true);
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const isDev = import.meta.env.DEV;
    const uploadUrl = isDev && !apiBase ? '/api/assets/upload' : `${apiBase || ''}/api/assets/upload`;
    const token = getAccessToken();
    console.log('[첨부업로드] uploadUrl=', uploadUrl, 'files=', files.length, 'VITE_API_URL=', import.meta.env.VITE_API_URL);
    try {
      for (const file of files) {
        if (!extOk(file)) {
          setSaveError(`허용되지 않는 파일 형식입니다: ${file.name}`);
          continue;
        }
        if (!sizeOk(file)) {
          setSaveError(`파일 크기는 10MB 이하여야 합니다: ${file.name}`);
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        console.log('[첨부업로드] POST', file.name);
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          credentials: 'include',
        });
        console.log('[첨부업로드] response.ok=', response.ok, 'status=', response.status);
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || '업로드에 실패했습니다.');
        }
        const result = await response.json();
        console.log('[첨부업로드] result=', result);
        const id = result?.id != null ? Number(result.id) : null;
        const original_name = result?.original_name || file.name;
        console.log('[첨부업로드] parsed id=', id, 'original_name=', original_name);
        if (id && id > 0) {
          setAttachmentList((prev) => {
            const next = [...prev, { id, original_name }];
            console.log('[첨부업로드] setAttachmentList prev.len=', prev.length, 'next.len=', next.length);
            return next;
          });
        } else {
          console.warn('[첨부업로드] id가 없거나 0이라 목록에 추가 안 함', { id, result });
        }
      }
    } catch (err) {
      console.error('[첨부업로드] error', err);
      setSaveError(err?.message || '업로드에 실패했습니다.');
    } finally {
      setAttachmentUploading(false);
    }
  };

  const removeAttachment = (id) => {
    setAttachmentList((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    let content_html = editorRef.current ? editorRef.current.getHTML() : '';
    // H5/H6는 사용하지 않음 → H4로 통일 (에디터 툴바에는 H5/H6가 있으나 저장 시 h1~h4만 유지)
    content_html = content_html.replace(/<\/h[56]>/gi, '</h4>').replace(/<h[56](\s|>)/gi, '<h4$1');
    const visibility = form.visibility || form.status;
    const isScheduled = visibility === 'PUBLISHED' && form.publishType === 'scheduled';
    let published_at = null;
    if (visibility === 'PUBLISHED') {
      if (isScheduled && form.published_at) {
        published_at = form.published_at.includes('T') ? form.published_at.replace('T', ' ').slice(0, 19) : form.published_at;
      } else if (!isScheduled) {
        // 즉시공개: 항상 현 시점으로 발행 (예약이 지난 뒤 즉시공개로 바꿀 때도 현재 시각 사용)
        published_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    const postTagsRaw = (form.post_tags || []).filter((x) => typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x)));
    const attachment_asset_ids = (attachmentList || []).map((a) => Number(a.id)).filter((n) => !Number.isNaN(n) && n > 0);
    console.log('[저장] attachmentList=', attachmentList, 'attachment_asset_ids=', attachment_asset_ids);
    const payload = {
      title: form.title || '제목 없음',
      slug: slugFromTitle(form.title) || 'untitled',
      status: visibility,
      published_at: published_at || null,
      category_id: (form.category_id && form.category_id !== '__select__') ? Number(form.category_id) : null,
      thumbnail_asset_id: form.thumbnail_asset_id || null,
      content_html,
      content_json: null,
      post_tags: postTagsRaw.map((x) => Number(x)),
      attachment_asset_ids,
    };
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && postId) {
        await apiClient.put(`/api/posts/${postId}`, payload);
        alert('글 수정 완료');
        navigate('/posts');
      } else {
        await apiClient.post('/api/posts', payload);
        alert('글 등록 완료');
        navigate('/posts');
      }
    } catch (e) {
      setSaveError(e?.response?.data?.detail || e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const bodyTrimmed = (contentHtml || '').replace(/<[^>]+>/g, '').trim();
  const canSave =
    form.title.trim() !== '' &&
    form.category_id !== '__select__' &&
    bodyTrimmed.length > 0 &&
    ['PUBLISHED', 'UNLISTED', 'PRIVATE'].includes(form.status);

  if (!toastUILoaded || (isEdit && initialEditorContent === null && !loadError)) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header - sample 스타일 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? '포스트 수정' : '새 포스트'}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isEdit ? '글을 수정합니다.' : '새로운 글을 작성하세요.'}</p>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            목록으로
          </button>
        )}
      </div>

      <Dialog open={Boolean(loadError)} onClose={() => setLoadError(null)} aria-labelledby="load-error-dialog-title">
        <DialogTitle id="load-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{loadError}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setLoadError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(saveError)} onClose={() => setSaveError(null)} aria-labelledby="save-error-dialog-title">
        <DialogTitle id="save-error-dialog-title">저장할 수 없음</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{saveError}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setSaveError(null)} color="primary" variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* sample처럼 단일 컬럼 - 하단으로 쭉 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">제목 <span className="text-blue-600 dark:text-green-400">*</span></label>
          <TextField fullWidth placeholder="제목을 입력하세요" value={form.title} onChange={handleTitleChange} size="small" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">카테고리 <span className="text-blue-600 dark:text-green-400">*</span></label>
          <FormControl fullWidth size="small">
            <Select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} displayEmpty renderValue={(v) => {
              if (v === '__select__') return '선택';
              if (v === '') return '미지정';
              const c = categories.find((x) => String(x.id) === v);
              if (!c) return v;
              return c.parentName ? `${c.parentName} > ${c.name}` : c.name;
            }}>
              <MenuItem value="__select__" disabled>선택</MenuItem>
              <MenuItem value="">미지정</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.label || c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">본문 <span className="text-blue-600 dark:text-green-400">*</span></label>
            <div className="flex items-center gap-2">
              <input
                ref={multiImageInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleMultiImageChange}
              />
              <button
                type="button"
                onClick={() => multiImageInputRef.current?.click()}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                이미지 여러 장
              </button>
            </div>
          </div>
          <div className="min-h-[500px]">
            <div id="post-editor" data-placeholder="내용을 입력하세요" />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">태그 (엔터로 추가)</label>
          <TextField fullWidth placeholder="태그 입력 후 엔터" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} size="small" />
          <div className="flex flex-wrap gap-1 mt-2">
            {form.post_tags.map((idOrName) => {
              const t = typeof idOrName === 'number' || /^\d+$/.test(String(idOrName)) ? tags.find((x) => x.id === Number(idOrName)) : null;
              return <Chip key={idOrName} label={t ? t.name : String(idOrName)} size="small" onDelete={() => removeTag(idOrName)} />;
            })}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">발행 방식 <span className="text-blue-600 dark:text-green-400">*</span></label>
          <div className="flex flex-col gap-3">
            <FormControl fullWidth size="small">
              <Select
                value={form.status || '__select__'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__select__') return;
                  setForm((f) => ({ ...f, status: v, visibility: v, publishType: v === 'PUBLISHED' ? f.publishType : 'now' }));
                }}
                displayEmpty
                renderValue={(v) => (v === '__select__' || !v ? '발행 상태를 선택하세요' : v === 'PUBLISHED' ? '공개' : v === 'UNLISTED' ? '일부공개' : v === 'PRIVATE' ? '비공개' : v)}
              >
                <MenuItem value="__select__" disabled>발행 상태를 선택하세요</MenuItem>
                <MenuItem value="PUBLISHED">공개</MenuItem>
                <MenuItem value="UNLISTED">일부공개</MenuItem>
                <MenuItem value="PRIVATE">비공개</MenuItem>
              </Select>
            </FormControl>
            {form.visibility === 'PUBLISHED' && (
              <div className="pl-1">
                <RadioGroup
                  row
                  value={form.publishType}
                  onChange={(e) => setForm((f) => ({ ...f, publishType: e.target.value }))}
                >
                  <FormControlLabel value="now" control={<Radio size="small" />} label="즉시공개" />
                  <FormControlLabel value="scheduled" control={<Radio size="small" />} label="예약발행" />
                </RadioGroup>
                {form.publishType === 'scheduled' && (
                  <TextField
                    sx={{ mt: 1 }}
                    fullWidth
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                  />
                )}
              </div>
            )}
            {form.visibility === 'UNLISTED' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">링크가 있는 사람만 직접 입력해 접근할 수 있습니다.</p>
            )}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">파일 첨부</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">PNG, JPG, JPEG, PDF, PPT, PPTX, HWP, HWPX, DOCX (각 10MB 이하, 다중 선택 가능)</p>
          <input
            ref={attachmentInputRef}
            type="file"
            accept={ATTACH_ACCEPT}
            multiple
            className="hidden"
            onChange={handleAttachmentSelect}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => attachmentInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); attachmentInputRef.current?.click(); } }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-green-500', 'bg-gray-50', 'dark:bg-gray-700'); }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-green-500', 'bg-gray-50', 'dark:bg-gray-700'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-green-500', 'bg-gray-50', 'dark:bg-gray-700');
              const files = Array.from(e.dataTransfer?.files || []);
              if (files.length) {
                const dt = new DataTransfer();
                files.forEach((f) => dt.items.add(f));
                if (attachmentInputRef.current) attachmentInputRef.current.files = dt.files;
                handleAttachmentSelect({ target: { files: dt.files, value: '' } });
              }
            }}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {attachmentUploading ? (
              <p className="text-gray-500 dark:text-gray-400">업로드 중...</p>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300">클릭하거나 파일을 끌어다 놓으세요</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">여러 파일 선택 가능</p>
              </>
            )}
          </div>
          {attachmentList.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachmentList.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{a.original_name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium ml-2 shrink-0"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Divider sx={{ my: 2 }} />
        <div className="flex justify-end gap-3">
          {isEdit && (
            <Button variant="outlined" onClick={() => navigate('/posts')}>
              목록으로
            </Button>
          )}
          <Button variant="contained" onClick={handleSave} disabled={saving || !canSave}>
            {saving ? <CircularProgress size={24} /> : isEdit ? '수정' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
