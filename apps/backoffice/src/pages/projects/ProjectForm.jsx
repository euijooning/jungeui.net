import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import apiClient, { getAccessToken, API_BASE, UPLOAD_URL } from '../../lib/apiClient';
import { SortableTag } from './SortableTag';

const THUMB_SIZE = 400;
const INTRO_IMAGE_WIDTH = 800;
const INTRO_IMAGE_HEIGHT = 450;

const LINK_TYPES = [
  { value: '웹사이트', label: '웹사이트' },
  { value: '깃허브', label: '깃허브' },
  { value: '인스타그램', label: '인스타그램' },
  { value: '유튜브', label: '유튜브' },
  { value: '기타', label: '기타' },
];

function mapLinkName(name) {
  const found = LINK_TYPES.find((t) => t.value === name);
  return found ? name : '기타';
}

function resizeToSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = THUMB_SIZE;
      canvas.height = THUMB_SIZE;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, THUMB_SIZE, THUMB_SIZE);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: file.type }) : null),
        file.type || 'image/jpeg',
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 로드 실패'));
    };
    img.src = objectUrl;
  });
}

function resizeToRect(file, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const targetAspect = width / height;
      const imgAspect = img.width / img.height;
      let sw, sh, sx, sy;
      if (imgAspect > targetAspect) {
        sh = img.height;
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / targetAspect;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: file.type }) : null),
        file.type || 'image/jpeg',
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 로드 실패'));
    };
    img.src = objectUrl;
  });
}

export default function ProjectForm({ isEdit = false, projectId = null, onSuccess, onCancel, embedded = false }) {
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isOngoing, setIsOngoing] = useState(false);
  const [projectNoLinks, setProjectNoLinks] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    thumbnail_asset_id: null,
    intro_image_asset_id: null,
    sort_order: 0,
    project_links: [{ link_name: '웹사이트', link_url: '', sort_order: 0 }],
    project_tags: [],
  });
  const [thumbPreview, setThumbPreview] = useState(null);
  const [introPreview, setIntroPreview] = useState(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoadError(null);
    try {
      const res = await apiClient.get('/api/projects');
      const list = Array.isArray(res.data) ? res.data : [];
      const p = list.find((x) => x.id === Number(projectId));
      if (!p) {
        setLoadError('프로젝트를 찾을 수 없습니다.');
        return;
      }
      const links = (p.links || []).length > 0
        ? p.links.map((l) => ({
            link_name: mapLinkName(l.link_name || ''),
            link_url: l.link_url || '',
            sort_order: l.sort_order || 0,
          }))
        : [{ link_name: '웹사이트', link_url: '', sort_order: 0 }];
      const ptags = (p.tags || []).map((t) => (typeof t === 'object' && t.name ? t.name : String(t)));
      setForm({
        title: p.title || '',
        description: p.description || '',
        start_date: p.start_date ? p.start_date.slice(0, 10) : '',
        end_date: p.end_date ? p.end_date.slice(0, 10) : '',
        thumbnail_asset_id: p.thumbnail_asset_id ?? null,
        intro_image_asset_id: p.intro_image_asset_id ?? null,
        sort_order: p.sort_order ?? 0,
        project_links: links,
        project_tags: ptags,
      });
      setIsOngoing(!p.end_date && !!p.start_date);
      setProjectNoLinks((p.links || []).length === 0);
      const base = API_BASE || '';
      if (p.thumbnail) {
        const url = p.thumbnail.startsWith('http') ? p.thumbnail : base + (p.thumbnail.startsWith('/') ? p.thumbnail : `/${p.thumbnail}`);
        setThumbPreview(url);
      } else if (p.thumbnail_asset_id) {
        setThumbPreview(`${base}/api/assets/${p.thumbnail_asset_id}/download`);
      } else {
        setThumbPreview(null);
      }
      if (p.intro_image) {
        const url = p.intro_image.startsWith('http') ? p.intro_image : base + (p.intro_image.startsWith('/') ? p.intro_image : `/${p.intro_image}`);
        setIntroPreview(url);
      } else if (p.intro_image_asset_id) {
        setIntroPreview(`${base}/api/assets/${p.intro_image_asset_id}/download`);
      } else {
        setIntroPreview(null);
      }
    } catch (e) {
      setLoadError(e?.message || '프로젝트를 불러오지 못했습니다.');
    }
  }, [projectId]);

  useEffect(() => {
    if (isEdit && projectId) loadProject();
  }, [isEdit, projectId, loadProject]);

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getAccessToken();
    let toUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        toUpload = await resizeToSquare(file);
        if (!toUpload) throw new Error('리사이즈 실패');
      } catch (err) {
        setSaveError(err?.message || '이미지 처리에 실패했습니다.');
        e.target.value = '';
        return;
      }
    }
    const subdir = isEdit && projectId ? String(projectId) : 'temp';
    const fd = new FormData();
    fd.append('file', toUpload, toUpload.name);
    try {
      const res = await fetch(`${UPLOAD_URL}?folder=projects&post_id=${subdir}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('업로드 실패');
      const data = await res.json();
      const assetId = data.id;
      setForm((f) => ({ ...f, thumbnail_asset_id: assetId }));
      setThumbPreview(data.url ? `${API_BASE || ''}${data.url}` : null);
    } catch (err) {
      setSaveError(err?.message || '썸네일 업로드에 실패했습니다.');
    }
    e.target.value = '';
  };

  const handleIntroImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getAccessToken();
    let toUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        toUpload = await resizeToRect(file, INTRO_IMAGE_WIDTH, INTRO_IMAGE_HEIGHT);
        if (!toUpload) throw new Error('리사이즈 실패');
      } catch (err) {
        setSaveError(err?.message || '이미지 처리에 실패했습니다.');
        e.target.value = '';
        return;
      }
    }
    const subdir = isEdit && projectId ? String(projectId) : 'temp';
    const fd = new FormData();
    fd.append('file', toUpload, toUpload.name);
    try {
      const res = await fetch(`${UPLOAD_URL}?folder=projects&post_id=${subdir}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('업로드 실패');
      const data = await res.json();
      const assetId = data.id;
      setForm((f) => ({ ...f, intro_image_asset_id: assetId }));
      setIntroPreview(data.url ? `${API_BASE || ''}${data.url}` : null);
    } catch (err) {
      setSaveError(err?.message || '소개 이미지 업로드에 실패했습니다.');
    }
    e.target.value = '';
  };

  const addLink = () => {
    setForm((f) => {
      if (f.project_links.length >= 5) return f;
      return {
        ...f,
        project_links: [...f.project_links, { link_name: '웹사이트', link_url: '', sort_order: f.project_links.length }],
      };
    });
  };

  const removeLink = (idx) => {
    setForm((f) => ({
      ...f,
      project_links: f.project_links.filter((_, i) => i !== idx),
    }));
  };

  const updateLink = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      project_links: f.project_links.map((l, i) =>
        i === idx ? { ...l, [field]: value } : l
      ),
    }));
  };

  const addTag = (name) => {
    const n = (name || '').trim();
    if (!n) return;
    setForm((f) => {
      if (f.project_tags.length >= 6) return f;
      if (f.project_tags.includes(n)) return f;
      return { ...f, project_tags: [...f.project_tags, n] };
    });
    setTagInput('');
  };

  const removeTag = (idx) => {
    setForm((f) => ({
      ...f,
      project_tags: f.project_tags.filter((_, i) => i !== idx),
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTagDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setForm((prev) => {
        const oldIndex = prev.project_tags.indexOf(active.id);
        const newIndex = prev.project_tags.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return {
          ...prev,
          project_tags: arrayMove(prev.project_tags, oldIndex, newIndex),
        };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      setSaveError('프로젝트명을 입력하세요.');
      return;
    }
    if (form.title.length > 25) {
      setSaveError('프로젝트명은 최대 25자까지 입력 가능합니다.');
      return;
    }
    if (form.description.length > 100) {
      setSaveError('상세 내용은 최대 100자까지 입력 가능합니다.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const tagIds = [];
      for (const name of form.project_tags) {
        const n = (name || '').trim();
        if (!n) continue;
        const res = await apiClient.post('/api/tags', { name: n });
        if (res.data?.id) tagIds.push(res.data.id);
      }
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        start_date: form.start_date || null,
        end_date: isOngoing ? null : (form.end_date || null),
        thumbnail_asset_id: form.thumbnail_asset_id,
        intro_image_asset_id: form.intro_image_asset_id,
        sort_order: form.sort_order,
        project_links: projectNoLinks
          ? []
          : form.project_links
              .filter((l) => l.link_name?.trim() && l.link_url?.trim())
              .slice(0, 5)
              .map((l, i) => ({ link_name: l.link_name.trim(), link_url: l.link_url.trim(), sort_order: i })),
        project_tags: tagIds.slice(0, 6),
      };
      if (isEdit && projectId) {
        await apiClient.put(`/api/projects/${projectId}`, payload);
        alert('저장되었습니다.');
        onSuccess?.();
      } else {
        const res = await apiClient.post('/api/projects', payload);
        const id = res.data?.id;
        if (id) {
          alert('등록되었습니다.');
          onSuccess?.();
          if (!embedded) navigate('/projects');
        } else {
          throw new Error('등록 실패');
        }
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setSaveError(typeof detail === 'string' ? detail : (err?.message || '저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  // [수정] 기본 스타일과 block 스타일 분리
  const baseInputCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-green-500 dark:focus:border-green-500';
  const blockInputCls = `w-full ${baseInputCls}`; // w-full이 필요한 경우 사용
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (loadError) {
    const closeLoadError = () => { setLoadError(null); if (onCancel) onCancel(); else if (!embedded) navigate('/projects'); };
    return (
      <>
        <div className="p-4">
          <button
            type="button"
            onClick={closeLoadError}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200"
          >
            {embedded ? '닫기' : '목록으로'}
          </button>
        </div>
        <Dialog open={Boolean(loadError)} onClose={closeLoadError} aria-labelledby="project-load-error-dialog-title">
          <DialogTitle id="project-load-error-dialog-title">오류</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{loadError}</DialogContentText>
          </DialogContent>
          <DialogActions className="dark:border-t dark:border-gray-700">
            <Button onClick={closeLoadError} color="primary" variant="contained">확인</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <div className="w-full">
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? '프로젝트 수정' : '새 프로젝트'}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">프로젝트 정보를 입력하세요.</p>
        </div>
      )}

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

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
        }}
        className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div>
          <label htmlFor="title" className={labelCls}>프로젝트명 * (최대 25자)</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 25) }))}
            className={blockInputCls}
            placeholder="프로젝트명"
            maxLength={25}
            required
          />
          {form.title.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{form.title.length}/25자</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>상세 내용 (최대 100자)</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 100) }))}
            className={`${blockInputCls} min-h-[120px]`}
            placeholder="상세 내용"
            rows={5}
            maxLength={100}
          />
          {form.description.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{form.description.length}/100자</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <label htmlFor="start_date" className={labelCls}>시작일 (연·월)</label>
          <div className="flex items-center gap-2">
            <label htmlFor="end_date" className={labelCls}>종료일 (연·월)</label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={(e) => {
                  setIsOngoing(e.target.checked);
                  if (e.target.checked) setForm((f) => ({ ...f, end_date: '' }));
                }}
              />
              진행중
            </label>
          </div>
          <input
            id="start_date"
            type="month"
            value={form.start_date?.slice(0, 7) || ''}
            max={(() => {
              const n = new Date();
              return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
            })()}
            onChange={(e) => {
              const v = e.target.value || '';
              setForm((f) => ({
                ...f,
                start_date: v,
                end_date: v && f.end_date && f.end_date.slice(0, 7) < v ? '' : f.end_date,
              }));
            }}
            className={blockInputCls}
          />
          <input
            id="end_date"
            type="month"
            value={form.end_date?.slice(0, 7) || ''}
            min={form.start_date?.slice(0, 7) || undefined}
            max={(() => {
              const n = new Date();
              return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
            })()}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || '' }))}
            className={blockInputCls}
            disabled={isOngoing}
          />
        </div>

        <div>
          <label className={labelCls}>대표 이미지</label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {thumbPreview ? (
                <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 dark:text-gray-400 text-xs">없음</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp"
                onChange={handleThumbnailChange}
                className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-200 file:text-gray-800 dark:file:bg-gray-600 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{thumbPreview ? '썸네일 선택됨' : '선택된 파일 없음'}</span>
              {form.thumbnail_asset_id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, thumbnail_asset_id: null }));
                    setThumbPreview(null);
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  이미지 제거
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>소개 이미지</label>
          <div className="flex items-start gap-4">
            <div className="w-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0 aspect-video">
              {introPreview ? (
                <img src={introPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 dark:text-gray-400 text-xs">없음</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp"
                onChange={handleIntroImageChange}
                className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-200 file:text-gray-800 dark:file:bg-gray-600 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{introPreview ? '소개 이미지 선택됨' : '선택된 파일 없음'}</span>
              {form.intro_image_asset_id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, intro_image_asset_id: null }));
                    setIntroPreview(null);
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  이미지 제거
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={projectNoLinks}
              onChange={(e) => setProjectNoLinks(e.target.checked)}
            />
            링크 없음
          </label>
          {!projectNoLinks && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">링크 (최대 5개)</span>
                <button
                  type="button"
                  onClick={addLink}
                  disabled={form.project_links.length >= 5}
                  className="text-sm text-blue-600 dark:text-green-400 hover:text-blue-800 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + 링크 추가
                </button>
              </div>
              <div className="space-y-2">
                {form.project_links.map((link, idx) => (
                  // 부모 컨테이너: flex-row, w-full 유지
                  <div key={idx} className="flex gap-2 items-center w-full">
                    <select
                      value={link.link_name || '웹사이트'}
                      onChange={(e) => updateLink(idx, 'link_name', e.target.value)}
                      // [수정] w-28(112px) 고정, shrink-0, w-full 제거
                      className={`${baseInputCls} w-28 shrink-0 px-2`}
                    >
                      {LINK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={link.link_url}
                      onChange={(e) => updateLink(idx, 'link_url', e.target.value)}
                      // [수정] flex-1 (남은 공간 차지), min-w-0 (넘침 방지), w-full 제거
                      className={`${baseInputCls} flex-1 min-w-0`}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      // 삭제 버튼: 크기 고정
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded shrink-0"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <label className={labelCls}>태그 (기술 스택, Enter로 추가, 드래그로 순서 변경, 최대 6개)</label>
          <div className="flex flex-wrap gap-2 items-center">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTagDragEnd}
            >
              <SortableContext
                items={form.project_tags}
                strategy={horizontalListSortingStrategy}
              >
                {form.project_tags.map((tag) => (
                  <SortableTag
                    key={tag}
                    id={tag}
                    label={tag}
                    onDelete={() => {
                      const idx = form.project_tags.indexOf(tag);
                      if (idx !== -1) removeTag(idx);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {form.project_tags.length < 6 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                className={`${baseInputCls} w-40`}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={
              saving ||
              !(form.title?.trim() && form.description?.trim() && form.start_date) ||
              (form.start_date && !isOngoing && !(form.end_date && form.end_date.trim()))
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-green-600 rounded-lg hover:bg-blue-700 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : (isEdit ? '저장' : '등록')}
          </button>
          <button
            type="button"
            onClick={() => { if (onCancel) onCancel(); else if (!embedded) navigate('/projects'); }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}