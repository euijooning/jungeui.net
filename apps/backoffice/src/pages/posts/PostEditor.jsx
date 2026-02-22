import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
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
import apiClient, { getAccessToken, API_BASE, UPLOAD_URL } from '../../lib/apiClient';

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

function getLocalISOMin() {
  const n = new Date();
  return new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toLocalISOString(utcStr) {
  if (!utcStr) return '';
  const date = new Date(utcStr);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}

const YT_EXACT_URL_RE =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&].*)?$/;
const makeYoutubeIframe = (videoId) =>
  `<iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="width:100%; aspect-ratio:16/9;"></iframe>`;

export default function PostEditor({ isEdit = false, postId = null }) {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const multiImageInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [prefixes, setPrefixes] = useState([]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [initialContent, setInitialContent] = useState('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [contentHtml, setContentHtml] = useState('');

  const [form, setForm] = useState({
    title: '',
    status: '',
    visibility: '',
    publishType: 'now',
    published_at: '',
    category_id: '__select__',
    prefix_id: '__select__',
    thumbnail_asset_id: null,
    post_tags: [],
  });
  const [originPublishedAt, setOriginPublishedAt] = useState(null);
  const [attachmentList, setAttachmentList] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const toImageSrc = (url) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return API_BASE ? API_BASE + (url.startsWith('/') ? url : `/${url}`) : url;
  };

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoadError(null);
    try {
      const res = await apiClient.get(`/api/posts/${postId}`);
      const d = res.data;
      const status = d.status ?? 'DRAFT';
      setOriginPublishedAt(d.published_at);
      const pubAt = d.published_at ? toLocalISOString(d.published_at) : '';
      const isScheduled = status === 'PUBLISHED' && pubAt && new Date(pubAt) > new Date();
      const visibility = status === 'DRAFT' ? 'PUBLISHED' : status;

      setForm({
        title: d.title ?? '',
        status: visibility,
        visibility,
        publishType: isScheduled ? 'scheduled' : 'now',
        published_at: pubAt,
        category_id: d.category_id != null ? String(d.category_id) : '',
        prefix_id: d.prefix_id != null ? String(d.prefix_id) : '',
        thumbnail_asset_id: d.thumbnail_asset_id ?? null,
        post_tags: (Array.isArray(d.post_tags) ? d.post_tags : d.tags || []).map((t) =>
          typeof t === 'object' && t?.id != null ? t.id : t
        ),
      });
      setAttachmentList((Array.isArray(d.attachments) ? d.attachments : []).map((a) => ({
        id: a.id,
        original_name: a.original_name || `파일 ${a.id}`,
      })));

      setInitialContent(d.content_html || '');
      setIsEditorReady(true);
    } catch (e) {
      setLoadError(e?.message || '글을 불러오지 못했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, prefixRes, tagRes] = await Promise.all([
          apiClient.get('/api/categories?tree=true'),
          apiClient.get('/api/post_prefixes'),
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
        setPrefixes(Array.isArray(prefixRes.data) ? prefixRes.data : prefixRes.data?.items ?? []);
        setTags(Array.isArray(tagRes.data) ? tagRes.data : tagRes.data?.items ?? []);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (isEdit && postId) {
      loadPost();
    } else {
      setInitialContent('');
      setIsEditorReady(true);
    }
  }, [isEdit, postId, loadPost]);

  const handleEditorImageUpload = (blobInfo, progress) =>
    new Promise((resolve, reject) => {
      const file = blobInfo.blob();
      const token = getAccessToken();
      const pid = isEdit && postId ? String(postId) : 'temp';
      const fd = new FormData();
      fd.append('file', file, file.name || 'image.jpg');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${UPLOAD_URL}?post_id=${encodeURIComponent(pid)}`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          progress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error('HTTP Error: ' + xhr.status));
          return;
        }
        try {
          const json = JSON.parse(xhr.responseText);
          const url = json.url ?? json.file_path ?? json.file_url;
          resolve(toImageSrc(url));
        } catch (e) {
          reject(new Error('Invalid JSON: ' + xhr.responseText));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Image upload failed due to a XHR Transport error. Code: ' + xhr.status));
      };

      xhr.send(fd);
    });

  const handleTitleChange = (e) => setForm((f) => ({ ...f, title: e.target.value }));

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

  const removeTag = (idOrName) => setForm((f) => ({ ...f, post_tags: f.post_tags.filter((x) => x !== idOrName) }));

  const handleMultiImageChange = async (e) => {
    const files = Array.from(e.target?.files || []);
    if (multiImageInputRef.current) multiImageInputRef.current.value = '';
    if (!files?.length || !editorRef.current) return;
    const token = getAccessToken();
    const pid = isEdit && postId ? String(postId) : 'temp';
    for (const file of files) {
      if (!file.type?.startsWith('image/')) continue;
      try {
        const fd = new FormData();
        fd.append('file', file, file.name || 'image.jpg');
        const res = await fetch(`${UPLOAD_URL}?post_id=${encodeURIComponent(pid)}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || '이미지 업로드에 실패했습니다.');
        }
        const data = await res.json();
        const url = data.url ?? data.file_path ?? data.file_url;
        if (url) {
          const src = toImageSrc(url);
          const imgHtml = `<img src="${src}" alt="" style="max-width:100%; height:auto;"><br>`;
          editorRef.current.insertContent(imgHtml);
        }
      } catch (err) {
        setSaveError(err?.message || '이미지 업로드에 실패했습니다.');
      }
    }
  };

  const handleAttachmentSelect = async (e) => {
    const files = Array.from(e.target?.files || []);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    if (!files.length) return;
    const extOk = (f) => ATTACH_EXT_SET.has((f.name || '').split('.').pop()?.toLowerCase());
    const sizeOk = (f) => f.size <= MAX_ATTACH_SIZE;
    setAttachmentUploading(true);
    const token = getAccessToken();
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
        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          credentials: 'include',
        });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail || '업로드에 실패했습니다.');
        }
        const result = await response.json();
        const id = result?.id != null ? Number(result.id) : null;
        const original_name = result?.original_name || file.name;
        if (id && id > 0) {
          setAttachmentList((prev) => [...prev, { id, original_name }]);
        }
      }
    } catch (err) {
      setSaveError(err?.message || '업로드에 실패했습니다.');
    } finally {
      setAttachmentUploading(false);
    }
  };

  const removeAttachment = (id) => setAttachmentList((prev) => prev.filter((a) => a.id !== id));

  const handleSave = async () => {
    let content_html = editorRef.current ? editorRef.current.getContent() : '';
    content_html = content_html.replace(/<\/h[56]>/gi, '</h4>').replace(/<h[56](\s|>)/gi, '<h4$1');

    const visibility = form.visibility || form.status;
    const isScheduled = visibility === 'PUBLISHED' && form.publishType === 'scheduled';
    let published_at = null;

    if (visibility === 'PUBLISHED') {
      if (isScheduled && form.published_at) {
        published_at = new Date(form.published_at).toISOString();
      } else {
        const originDate = originPublishedAt ? new Date(originPublishedAt) : null;
        const now = new Date();
        if (originDate && originDate <= now) {
          published_at = originDate.toISOString();
        } else {
          published_at = now.toISOString();
        }
      }
    } else {
      if (originPublishedAt) {
        published_at = new Date(originPublishedAt).toISOString();
      }
    }

    const postTagsRaw = (form.post_tags || []).filter(
      (x) => typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x))
    );
    const attachment_asset_ids = (attachmentList || [])
      .map((a) => Number(a.id))
      .filter((n) => !Number.isNaN(n) && n > 0);

    const payload = {
      title: form.title || '제목 없음',
      slug: slugFromTitle(form.title) || 'untitled',
      status: visibility,
      published_at: published_at || null,
      category_id: form.category_id && form.category_id !== '__select__' ? Number(form.category_id) : null,
      prefix_id:
        form.prefix_id && form.prefix_id !== '__select__' && form.prefix_id !== '' ? Number(form.prefix_id) : null,
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

  if (!isEditorReady && isEdit) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? '포스트 수정' : '새 포스트'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? '글을 수정합니다.' : '새로운 글을 작성하세요.'}
          </p>
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
          <Button onClick={() => setLoadError(null)} color="primary" variant="contained">
            확인
          </Button>
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
            제목 <span className="text-blue-600 dark:text-green-400">*</span>
          </label>
          <TextField fullWidth placeholder="제목을 입력하세요" value={form.title} onChange={handleTitleChange} size="small" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
            카테고리 <span className="text-blue-600 dark:text-green-400">*</span>
          </label>
          <FormControl fullWidth size="small">
            <Select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              displayEmpty
              renderValue={(v) => {
                if (v === '__select__') return '선택';
                if (v === '') return '미지정';
                const c = categories.find((x) => String(x.id) === v);
                if (!c) return v;
                return c.parentName ? `${c.parentName} > ${c.name}` : c.name;
              }}
            >
              <MenuItem value="__select__" disabled>
                선택
              </MenuItem>
              <MenuItem value="">미지정</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.label || c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">말머리</label>
          <FormControl fullWidth size="small">
            <Select
              value={form.prefix_id}
              onChange={(e) => setForm((f) => ({ ...f, prefix_id: e.target.value }))}
              displayEmpty
              renderValue={(v) => {
                if (v === '__select__' || v === '' || v == null) return v === '' ? '미지정' : '선택';
                const p = prefixes.find((x) => String(x.id) === v);
                return p ? p.name : v;
              }}
            >
              <MenuItem value="__select__" disabled>
                선택
              </MenuItem>
              <MenuItem value="">미지정</MenuItem>
              {prefixes.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
              본문 <span className="text-blue-600 dark:text-green-400">*</span>
            </label>
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
          <div style={{ minHeight: '600px' }}>
            <Editor
              tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@8.3.2/tinymce.min.js"
            onInit={(evt, editor) => {
              editorRef.current = editor;
              setContentHtml(editor.getContent());
            }}
            onEditorChange={(content) => setContentHtml(content)}
            initialValue={initialContent}
            init={{
              license_key: 'gpl',
              height: 600,
              menubar: false,
              plugins: [
                'advlist',
                'autolink',
                'lists',
                'link',
                'image',
                'charmap',
                'preview',
                'anchor',
                'searchreplace',
                'visualblocks',
                'code',
                'fullscreen',
                'insertdatetime',
                'media',
                'table',
                'help',
                'wordcount',
                'codesample',
              ],
              codesample_languages: [
                { text: 'HTML/XML', value: 'markup' },
                { text: 'JavaScript', value: 'javascript' },
                { text: 'CSS', value: 'css' },
                { text: 'PHP', value: 'php' },
                { text: 'Python', value: 'python' },
                { text: 'SQL', value: 'sql' },
                { text: 'Java', value: 'java' },
                { text: 'C', value: 'c' },
                { text: 'C#', value: 'csharp' },
                { text: 'C++', value: 'cpp' },
              ],
              toolbar:
                'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | blockquote codesample | bullist numlist outdent indent | table image media | removeformat | code',
              block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Blockquote=blockquote; Preformatted=pre',
              content_style: `
                body { font-family: 'NexonLv1Gothic', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; }
                /* [추가] Heading 스타일 (Client와 싱크 맞춤) */
                h1, h2, h3, h4, h5, h6 { font-weight: bold; line-height: 1.3; margin: 1.5em 0 0.5em 0; color: #111827; }
                h1 { font-size: 28px; }
                h2 { font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
                h3 { font-size: 20px; }
                h4 { font-size: 18px; }
                h5 { font-size: 16px; }
                h6 { font-size: 15px; color: #666; margin-top: 2em; }
                table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                th, td { border: 1px solid #ccc; padding: 8px 12px; vertical-align: top; }
                th { background-color: #f5f9fc; font-weight: bold; text-align: left; }
                img, iframe { max-width: 100%; height: auto; border-radius: 8px; }
                blockquote { margin: 1rem 0; padding: 0.5rem 1rem 0.5rem 1.25rem; border-left: 4px solid #35C5F0; background: #f9f9f9; border-radius: 0 8px 8px 0; }
              `,
              extended_valid_elements: 'iframe[*]',
              images_upload_handler: handleEditorImageUpload,
              table_resize_bars: true,
              object_resizing: true,
              promotion: false,
              media_live_embeds: true,
              setup: (editor) => {
                editor.ui.registry.addButton('blockquote', {
                  text: '인용',
                  tooltip: '인용구',
                  onAction: () => editor.execCommand('mceBlockQuote'),
                });
                editor.on('paste', (e) => {
                  const clip = e.clipboardData || window.clipboardData;
                  if (!clip) return;
                  const text = clip.getData('text').trim();
                  const match = text.match(YT_EXACT_URL_RE);
                  if (match && match[1]) {
                    e.preventDefault();
                    const videoId = match[1];
                    const iframeHtml = makeYoutubeIframe(videoId);
                    editor.insertContent(iframeHtml + '<p><br></p>');
                  }
                });
              },
            }}
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">태그 (엔터로 추가)</label>
          <TextField
            fullWidth
            placeholder="태그 입력 후 엔터"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            size="small"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {form.post_tags.map((idOrName) => {
              const t =
                typeof idOrName === 'number' || /^\d+$/.test(String(idOrName))
                  ? tags.find((x) => x.id === Number(idOrName))
                  : null;
              return (
                <Chip
                  key={idOrName}
                  label={t ? t.name : String(idOrName)}
                  size="small"
                  onDelete={() => removeTag(idOrName)}
                />
              );
            })}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
            발행 방식 <span className="text-blue-600 dark:text-green-400">*</span>
          </label>
          <div className="flex flex-col gap-3">
            <FormControl fullWidth size="small">
              <Select
                value={form.status || '__select__'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__select__') return;
                  setForm((f) => ({
                    ...f,
                    status: v,
                    visibility: v,
                    publishType: v === 'PUBLISHED' ? f.publishType : 'now',
                  }));
                }}
                displayEmpty
                renderValue={(v) =>
                  v === '__select__' || !v
                    ? '발행 상태를 선택하세요'
                    : v === 'PUBLISHED'
                      ? '공개'
                      : v === 'UNLISTED'
                        ? '일부공개'
                        : v === 'PRIVATE'
                          ? '비공개'
                          : v
                }
              >
                <MenuItem value="__select__" disabled>
                  발행 상태를 선택하세요
                </MenuItem>
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
                    inputProps={{ min: getLocalISOMin() }}
                  />
                )}
              </div>
            )}
            {form.visibility === 'UNLISTED' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">
                링크가 있는 사람만 직접 입력해 접근할 수 있습니다.
              </p>
            )}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">파일 첨부</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            PNG, JPG, JPEG, PDF, PPT, PPTX, HWP, HWPX, DOCX (각 10MB 이하, 다중 선택 가능)
          </p>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                attachmentInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-green-500', 'bg-gray-50', 'dark:bg-gray-700');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-green-500', 'bg-gray-50', 'dark:bg-gray-700');
            }}
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
                <li
                  key={a.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
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
