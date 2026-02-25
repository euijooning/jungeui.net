import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  CircularProgress,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import apiClient, { getAccessToken, API_BASE, UPLOAD_URL } from '../../lib/apiClient';

const TITLE_MAX = 20;
const DESC_MAX = 20;
const TAG_MAX = 7;

function toImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return API_BASE ? API_BASE + (path.startsWith('/') ? path : `/${path}`) : path;
}

/** yyyy.mm 또는 yyyy-mm → API용 yyyy-mm (또는 yyyy-mm-01) */
function toApiDate(v) {
  if (!v || typeof v !== 'string') return null;
  const s = v.trim().replace(/\./g, '-').slice(0, 7);
  if (s.length === 7 && /^\d{4}-\d{2}$/.test(s)) return s + '-01';
  if (s.length === 10) return s;
  return null;
}

/** API date → yyyy.mm 표시 */
function toDisplayDate(apiStr) {
  if (!apiStr) return '';
  const s = String(apiStr).slice(0, 7);
  return s.replace('-', '.');
}

export default function ProjectForm({ isEdit = false, projectId = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!isEdit);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    thumbnail_asset_id: null,
    logo_asset_id: null,
    notion_url: '',
    project_tag_names: [],
    project_links: [],
  });
  const [thumbUploading, setThumbUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isOngoing, setIsOngoing] = useState(false);

  const projectIdOrTemp = projectId || 'temp';

  /** 현재 연·월 yyyy-mm (미래 월 비활성화용) */
  const getMaxMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoadError(null);
    try {
      const { data } = await apiClient.get('/api/projects');
      const list = Array.isArray(data) ? data : [];
      const p = list.find((x) => Number(x.id) === Number(projectId));
      if (!p) {
        setLoadError('프로젝트를 찾을 수 없습니다.');
        return;
      }
      setForm({
        title: p.title ?? '',
        description: p.description ?? '',
        start_date: (p.start_date || '').toString().slice(0, 7),
        end_date: (p.end_date || '').toString().slice(0, 7),
        thumbnail_asset_id: p.thumbnail_asset_id ?? null,
        logo_asset_id: p.logo_asset_id ?? null,
        notion_url: p.notion_url ?? '',
        project_tag_names: (p.tags || []).map((t) => t.name || t).filter(Boolean),
        project_links: p.links || [],
      });
      setIsOngoing(!(p.end_date));
      setThumbnailPreview(toImageUrl(p.thumbnail));
      setLogoPreview(toImageUrl(p.logo));
    } catch (e) {
      setLoadError(e?.response?.data?.detail || e?.message || '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isEdit && projectId) {
      loadProject();
    } else {
      setLoading(false);
    }
  }, [isEdit, projectId, loadProject]);

  const uploadAsset = async (file, kind) => {
    const token = getAccessToken();
    const fd = new FormData();
    fd.append('file', file, file.name || 'image.jpg');
    const url = `${UPLOAD_URL}?folder=projects&post_id=${encodeURIComponent(projectIdOrTemp)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('파일 크기가 너무 큽니다 (최대 25MB).');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || '업로드 실패');
    }
    const data = await res.json();
    const id = data?.id != null ? Number(data.id) : null;
    if (!id) throw new Error('업로드 응답에 id가 없습니다.');
    return id;
  };

  const [tagInputValue, setTagInputValue] = useState('');

  const addProjectTagName = (name) => {
    const trimmed = (name || '').trim().slice(0, 50);
    if (!trimmed) return;
    setForm((f) => {
      const list = f.project_tag_names || [];
      if (list.length >= TAG_MAX) return f;
      if (list.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return f;
      return { ...f, project_tag_names: [...list, trimmed] };
    });
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addProjectTagName(tagInputValue);
    setTagInputValue('');
  };

  const removeProjectTagName = (name) => {
    setForm((f) => ({
      ...f,
      project_tag_names: (f.project_tag_names || []).filter((n) => n !== name),
    }));
  };

  const handleSave = async () => {
    const title = (form.title || '').trim();
    if (!title) {
      setSaveError('프로젝트명을 입력하세요.');
      return;
    }
    if (title.length > TITLE_MAX) {
      setSaveError(`프로젝트명은 ${TITLE_MAX}자 이하여야 합니다.`);
      return;
    }
    const description = (form.description || '').trim().slice(0, DESC_MAX) || null;
    const projectTagNames = (form.project_tag_names || []).slice(0, TAG_MAX);
    const startApi = toApiDate(form.start_date);
    const endApi = isOngoing ? null : toApiDate(form.end_date);
    if (!isOngoing && !endApi) {
      setSaveError('종료일을 선택하거나 진행중을 체크하세요.');
      return;
    }
    if (startApi && endApi && endApi < startApi) {
      setSaveError('종료일은 시작일보다 과거일 수 없습니다.');
      return;
    }
    const payload = {
      title,
      description,
      start_date: startApi || null,
      end_date: endApi,
      thumbnail_asset_id: form.thumbnail_asset_id || null,
      intro_image_asset_id: null,
      logo_asset_id: form.logo_asset_id || null,
      sort_order: 0,
      notion_url: (form.notion_url || '').trim() || null,
      is_pinned: false,
      project_links: (form.project_links || []).map((l) => ({
        link_name: l.link_name ?? '',
        link_url: l.link_url ?? '',
        sort_order: l.sort_order ?? 0,
      })),
      project_tag_names: projectTagNames,
    };

    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && projectId) {
        await apiClient.put(`/api/projects/${projectId}`, payload);
        alert('수정되었습니다.');
        navigate('/projects');
      } else {
        await apiClient.post('/api/projects', payload);
        alert('등록되었습니다.');
        navigate('/projects');
      }
    } catch (e) {
      setSaveError(e?.response?.data?.detail || e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbChangeWithPreview = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setSaveError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbUploading(true);
    setSaveError(null);
    try {
      const id = await uploadAsset(file, 'thumb');
      setForm((f) => ({ ...f, thumbnail_asset_id: id }));
    } catch (err) {
      setSaveError(err?.message || '대표 이미지 업로드 실패');
    } finally {
      setThumbUploading(false);
    }
    e.target.value = '';
  };

  const handleLogoChangeWithPreview = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setSaveError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    setSaveError(null);
    try {
      const id = await uploadAsset(file, 'logo');
      setForm((f) => ({ ...f, logo_asset_id: id }));
    } catch (err) {
      setSaveError(err?.message || '로고 업로드 실패');
    } finally {
      setLogoUploading(false);
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <CircularProgress />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">{loadError}</p>
        <Button className="mt-2" onClick={() => navigate('/projects')}>
          목록으로
        </Button>
      </div>
    );
  }

  const projectTagNames = form.project_tag_names || [];

  /** 등록 시: 필수값(프로젝트명, 대표이미지, 시작일, 종료일 또는 진행중, 한 줄 설명)이 모두 채워졌을 때만 버튼 활성화 */
  const isRegisterFormValid =
    (form.title || '').trim().length > 0 &&
    Boolean(form.thumbnail_asset_id || thumbnailPreview) &&
    (form.start_date || '').trim().length >= 7 &&
    (isOngoing || (form.end_date || '').trim().length >= 7) &&
    (form.description || '').trim().length > 0;

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? '프로젝트 수정' : '프로젝트 등록'}
        </h1>
        <Button variant="outlined" onClick={() => navigate('/projects')}>
          목록으로
        </Button>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
          {saveError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            프로젝트명 <span className="text-red-500">*</span> (최대 {TITLE_MAX}자)
          </label>
          <TextField
            fullWidth
            size="small"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, TITLE_MAX) }))}
            placeholder="프로젝트명"
            inputProps={{ maxLength: TITLE_MAX }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            대표 이미지 (16:9 권장)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-48 aspect-video rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-sm">미리보기</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="thumb-upload"
                onChange={handleThumbChangeWithPreview}
                disabled={thumbUploading}
              />
              <label htmlFor="thumb-upload">
                <Button variant="outlined" component="span" disabled={thumbUploading}>
                  {thumbUploading ? '업로드 중…' : '이미지 선택'}
                </Button>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            로고 이미지 (카드 핀 영역, 선택)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-500 text-xs">로고</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="logo-upload"
                onChange={handleLogoChangeWithPreview}
                disabled={logoUploading}
              />
              <label htmlFor="logo-upload">
                <Button variant="outlined" component="span" disabled={logoUploading}>
                  {logoUploading ? '업로드 중…' : '로고 선택'}
                </Button>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col">
            <div className="h-8 flex items-center mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">시작일 (연·월)</label>
            </div>
            <input
              type="month"
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm py-2 px-3"
              value={form.start_date}
              max={getMaxMonth()}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </div>
          <div className="flex flex-col">
            <div className="h-8 flex items-center justify-between gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">종료일 (연·월)</label>
              <FormControlLabel
                sx={{ marginRight: 0, marginLeft: 0 }}
                componentsProps={{ typography: { variant: 'body2', fontSize: '0.875rem' } }}
                control={
                  <Checkbox
                    checked={isOngoing}
                    onChange={(e) => setIsOngoing(e.target.checked)}
                    size="small"
                    sx={{ padding: '4px' }}
                  />
                }
                label="진행중"
              />
            </div>
            <input
              type="month"
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm py-2 px-3 disabled:opacity-60 disabled:cursor-not-allowed"
              value={form.end_date}
              min={form.start_date || undefined}
              max={getMaxMonth()}
              disabled={isOngoing}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              한 줄 설명 (최대 {DESC_MAX}자)
            </label>
            <span
              className={`text-sm tabular-nums flex-shrink-0 ${
                (form.description || '').length >= DESC_MAX
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {(form.description || '').length}/{DESC_MAX}
            </span>
          </div>
          <TextField
            fullWidth
            size="small"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, DESC_MAX) }))}
            placeholder="한 줄로 소개"
            inputProps={{ maxLength: DESC_MAX }}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              프로젝트 소개용 태그 (최대 {TAG_MAX}개)
            </label>
            <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400 flex-shrink-0">
              {projectTagNames.length}/{TAG_MAX}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {projectTagNames.map((name, idx) => (
              <Chip
                key={`${name}-${idx}`}
                label={name}
                size="small"
                onDelete={() => removeProjectTagName(name)}
              />
            ))}
          </div>
          <input
            type="text"
            className="mt-1 block w-full max-w-md rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm py-2 px-3 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder={projectTagNames.length >= TAG_MAX ? `최대 ${TAG_MAX}개까지 추가 가능` : '태그 입력 후 엔터'}
            value={tagInputValue}
            onChange={(e) => setTagInputValue(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            disabled={projectTagNames.length >= TAG_MAX}
          />
          {projectTagNames.length >= TAG_MAX && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">프로젝트 소개용 태그를 모두 추가했습니다. (최대 {TAG_MAX}개)</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">노션 링크 (카드 클릭 시 이동)</label>
          <TextField
            fullWidth
            size="small"
            value={form.notion_url}
            onChange={(e) => setForm((f) => ({ ...f, notion_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-4 justify-end">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (!isEdit && !isRegisterFormValid)}
          >
            {saving ? '저장 중…' : isEdit ? '수정' : '등록'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/projects')}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
