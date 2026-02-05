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
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import apiClient, { getAccessToken } from '../../lib/apiClient';

const TOAST_UI_SCRIPT = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
const TOAST_UI_I18N = 'https://uicdn.toast.com/editor/latest/i18n/ko-kr.js';
const TOAST_UI_CSS = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';

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
    const allowed = new Set(['DIV', 'IFRAME', '#text', 'P', 'BR', 'SPAN', 'B', 'I', 'EM', 'STRONG', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'CODE', 'PRE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'HR', 'A', 'IMG', 'STYLE']);
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
    status: 'DRAFT',
    visibility: 'PUBLISHED',
    publishType: 'now',
    published_at: '',
    category_id: '',
    thumbnail_asset_id: null,
    post_tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [useFirstImageAsThumb, setUseFirstImageAsThumb] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoadError(null);
    try {
      const res = await apiClient.get(`/api/posts/${postId}`);
      const d = res.data;
      const status = d.status ?? 'DRAFT';
      const pubAt = d.published_at ? d.published_at.slice(0, 16) : '';
      const isScheduled = status === 'PUBLISHED' && pubAt && new Date(pubAt) > new Date();
      setForm({
        title: d.title ?? '',
        status,
        visibility: status === 'DRAFT' ? 'PUBLISHED' : status,
        publishType: isScheduled ? 'scheduled' : 'now',
        published_at: pubAt,
        category_id: d.category_id != null ? String(d.category_id) : '',
        thumbnail_asset_id: d.thumbnail_asset_id ?? null,
        post_tags: (Array.isArray(d.post_tags) ? d.post_tags : d.tags || []).map((t) =>
          typeof t === 'object' && t?.id != null ? t.id : t
        ),
      });
      setInitialEditorContent(d.content_html || '');
    } catch (e) {
      setLoadError(e?.message || '글을 불러오지 못했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          apiClient.get('/api/categories'),
          apiClient.get('/api/tags'),
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.items ?? []);
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
      await loadScript(TOAST_UI_I18N);
      await loadCss(TOAST_UI_CSS);
      setToastUILoaded(true);
    };
    load();
  }, []);

  const canInitEditor = toastUILoaded && (!isEdit || initialEditorContent !== null);

  useEffect(() => {
    if (!canInitEditor || !window.toastui?.Editor) return;

    let cancelled = false;
    const t = setTimeout(() => {
      const el = document.getElementById('post-editor');
      if (cancelled || !el) return;

      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (e) {}
        editorRef.current = null;
      }

      const { Editor } = window.toastui;
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
              const fd = new FormData();
              fd.append('file', blob, blob.name || 'image.jpg');
              const pid = (isEdit && postId) ? String(postId) : 'temp';
              const res = await fetch(`/api/assets/upload?post_id=${encodeURIComponent(pid)}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: fd,
              });
              if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.');
              const data = await res.json();
              const url = data.url ?? data.file_path ?? data.file_url;
              callback(url, '이미지 업로드 완료');
            } catch (err) {
              console.error(err);
              callback('', err.message || '이미지 업로드에 실패했습니다.');
            }
          },
        },
      });

      const root = el.querySelector('.toastui-editor-ww-mode') || el.querySelector('.toastui-editor-md-container textarea');
      root?.addEventListener('paste', (e) => {
        const cd = e.clipboardData || window.clipboardData;
        const text = cd?.getData('text') || '';
        const items = cd?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                e.preventDefault();
                const fd = new FormData();
                fd.append('file', blob, 'image.jpg');
                const pid = (isEdit && postId) ? String(postId) : 'temp';
                fetch(`/api/assets/upload?post_id=${encodeURIComponent(pid)}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
                  .then((r) => r.json())
                  .then((data) => {
                    const url = data.url ?? data.file_path ?? data.file_url;
                    if (url) {
                      const html = ed.getHTML();
                      ed.setHTML(html + `<img src="${url}" alt="업로드" style="max-width:100%;height:auto;"><br>`);
                    }
                  })
                  .catch(() => {});
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
      });

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
          }, 250);
        };
      })();
      ed.on('change', onChange);

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
          ed.setHTML(html + `<img src="${url}" alt="" style="max-width:100%;height:auto;"><br>`);
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

  const handleTagKeyDown = (e) => {
    if (e.key !== 'Enter' || !tagInput.trim()) return;
    e.preventDefault();
    const name = tagInput.trim();
    const existing = tags.find((t) => (t.name || '').toLowerCase() === name.toLowerCase());
    const id = existing?.id;
    if (id && !form.post_tags.includes(id)) setForm((f) => ({ ...f, post_tags: [...f.post_tags, id] }));
    setTagInput('');
  };

  const removeTag = (idOrName) => {
    setForm((f) => ({ ...f, post_tags: f.post_tags.filter((x) => x !== idOrName) }));
  };

  const handleSave = async () => {
    const content_html = editorRef.current ? editorRef.current.getHTML() : '';
    const visibility = form.visibility;
    const isScheduled = visibility === 'PUBLISHED' && form.publishType === 'scheduled';
    const payload = {
      title: form.title || '제목 없음',
      slug: slugFromTitle(form.title) || 'untitled',
      status: form.status === 'DRAFT' ? form.status : visibility,
      published_at: isScheduled ? (form.published_at || null) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      thumbnail_asset_id: form.thumbnail_asset_id || null,
      content_html,
      content_json: null,
      post_tags: form.post_tags
        .filter((x) => typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x)))
        .map((x) => Number(x)),
    };
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && postId) {
        await apiClient.put(`/api/posts/${postId}`, payload);
        alert('수정되었습니다.');
      } else {
        const res = await apiClient.post('/api/posts', payload);
        const id = res.data?.id ?? res.data?.data?.id;
        if (id) navigate(`/posts/${id}/edit`, { replace: true });
        else alert('저장되었습니다.');
      }
    } catch (e) {
      setSaveError(e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '포스트 수정' : '새 포스트'}</h1>
          <p className="mt-1 text-sm text-gray-500">{isEdit ? '글을 수정합니다.' : '새로운 글을 작성하세요.'}</p>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록으로
          </button>
        )}
      </div>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {/* sample처럼 단일 컬럼 - 하단으로 쭉 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">제목</label>
          <TextField fullWidth placeholder="제목을 입력하세요" value={form.title} onChange={handleTitleChange} size="small" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">카테고리</label>
          <FormControl fullWidth size="small">
            <Select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} displayEmpty>
              <MenuItem value="">없음</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name || c.slug}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="block text-sm font-medium text-gray-900">본문</label>
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
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
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
          <label className="block text-sm font-medium text-gray-900 mb-2">태그 (엔터로 추가)</label>
          <TextField fullWidth placeholder="태그 입력 후 엔터" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} size="small" />
          <div className="flex flex-wrap gap-1 mt-2">
            {form.post_tags.map((idOrName) => {
              const t = typeof idOrName === 'number' || /^\d+$/.test(String(idOrName)) ? tags.find((x) => x.id === Number(idOrName)) : null;
              return <Chip key={idOrName} label={t ? t.name : String(idOrName)} size="small" onDelete={() => removeTag(idOrName)} />;
            })}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">발행 방식</label>
          <div className="flex flex-col gap-3">
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={form.status === 'DRAFT' ? 'DRAFT' : form.visibility}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'DRAFT') setForm((f) => ({ ...f, status: 'DRAFT', visibility: 'PUBLISHED', publishType: 'now' }));
                  else setForm((f) => ({ ...f, status: v, visibility: v, publishType: v === 'PUBLISHED' ? f.publishType : 'now' }));
                }}
              >
                <FormControlLabel value="DRAFT" control={<Radio size="small" />} label="임시저장" />
                <FormControlLabel value="PUBLISHED" control={<Radio size="small" />} label="공개" />
                <FormControlLabel value="UNLISTED" control={<Radio size="small" />} label="일부공개" />
                <FormControlLabel value="PRIVATE" control={<Radio size="small" />} label="비공개" />
              </RadioGroup>
            </FormControl>
            {form.status !== 'DRAFT' && form.visibility === 'PUBLISHED' && (
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
              <p className="text-sm text-gray-500 pl-1">링크가 있는 사람만 직접 입력해 접근할 수 있습니다.</p>
            )}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">썸네일</label>
          <FormControlLabel control={<Checkbox checked={useFirstImageAsThumb} onChange={(e) => setUseFirstImageAsThumb(e.target.checked)} />} label="본문 첫 이미지를 썸네일로" />
        </div>
        <Divider sx={{ my: 2 }} />
        <div className="flex justify-end gap-3">
          {isEdit && (
            <Button variant="outlined" onClick={() => navigate('/posts')}>
              목록으로
            </Button>
          )}
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : isEdit ? '수정' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
