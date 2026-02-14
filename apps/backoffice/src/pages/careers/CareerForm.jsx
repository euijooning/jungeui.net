import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import apiClient, { getAccessToken, API_BASE, UPLOAD_URL } from '../../lib/apiClient';
const LOGO_SIZE = 200;

const LINK_TYPES = [
  { value: '웹사이트', label: '웹사이트' },
  { value: '깃허브', label: '깃허브' },
  { value: '인스타그램', label: '인스타그램' },
  { value: '유튜브', label: '유튜브' },
  { value: '기타', label: '기타' },
];

function mapLinkName(name) {
  return LINK_TYPES.find((t) => t.value === name) ? name : '기타';
}

function resizeToSquare(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
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

export default function CareerForm({ isEdit = false, careerId = null, onSuccess, onCancel, embedded = false }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isOngoing, setIsOngoing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    role: '',
    start_date: '',
    end_date: '',
    description: '',
    logo_asset_id: null,
    sort_order: 0,
    career_links: [{ link_name: '웹사이트', link_url: '', sort_order: 0 }],
    career_highlights: [''],
    career_tags: [],
  });
  const [logoPreview, setLogoPreview] = useState(null);

  const loadCareer = useCallback(async () => {
    if (!careerId) return;
    setLoadError(null);
    try {
      const res = await apiClient.get('/api/careers');
      const list = Array.isArray(res.data) ? res.data : [];
      const c = list.find((x) => x.id === Number(careerId));
      if (!c) {
        setLoadError('경력을 찾을 수 없습니다.');
        return;
      }
      const links = (c.links || []).length > 0
        ? c.links.slice(0, 5).map((l) => ({
            link_name: mapLinkName(l.link_name || ''),
            link_url: l.link_url || '',
            sort_order: l.sort_order ?? 0,
          }))
        : [{ link_name: '웹사이트', link_url: '', sort_order: 0 }];
      const rawHighlights = (c.highlights || []).slice(0, 5).map((h) => (h.content != null ? String(h.content) : ''));
      const highlights = rawHighlights.length > 0 ? rawHighlights : [''];
      const tagNames = (c.tags || []).slice(0, 5).map((t) => (typeof t === 'object' && t.name ? t.name : String(t)));
      setForm({
        company_name: c.company_name || '',
        role: c.role || '',
        start_date: c.start_date ? c.start_date.slice(0, 7) : '',
        end_date: c.end_date ? c.end_date.slice(0, 7) : '',
        description: c.description || '',
        logo_asset_id: c.logo_asset_id ?? null,
        sort_order: c.sort_order ?? 0,
        career_links: links,
        career_highlights: highlights,
        career_tags: tagNames,
      });
      setIsOngoing(!c.end_date && !!c.start_date);
      const base = API_BASE || '';
      if (c.logo) {
        const url = c.logo.startsWith('http') ? c.logo : base + (c.logo.startsWith('/') ? c.logo : `/${c.logo}`);
        setLogoPreview(url);
      } else if (c.logo_asset_id) {
        setLogoPreview(`${base}/api/assets/${c.logo_asset_id}/download`);
      } else {
        setLogoPreview(null);
      }
    } catch (e) {
      setLoadError(e?.message || '경력 정보를 불러오지 못했습니다.');
    }
  }, [careerId]);

  useEffect(() => {
    if (isEdit && careerId) loadCareer();
  }, [isEdit, careerId, loadCareer]);

  const addLink = () => {
    setForm((f) => {
      if (f.career_links.length >= 5) return f;
      return {
        ...f,
        career_links: [...f.career_links, { link_name: '웹사이트', link_url: '', sort_order: f.career_links.length }],
      };
    });
  };

  const removeLink = (idx) => {
    setForm((f) => ({
      ...f,
      career_links: f.career_links.filter((_, i) => i !== idx),
    }));
  };

  const updateLink = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      career_links: f.career_links.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    }));
  };

  const updateHighlight = (idx, value) => {
    const capped = (value || '').slice(0, 20);
    setForm((f) => ({
      ...f,
      career_highlights: f.career_highlights.map((h, i) => (i === idx ? capped : h)),
    }));
  };

  const addHighlight = () => {
    setForm((f) => {
      if (f.career_highlights.length >= 5) return f;
      return { ...f, career_highlights: [...f.career_highlights, ''] };
    });
  };

  const removeHighlight = (idx) => {
    setForm((f) => {
      if (f.career_highlights.length <= 1) return f;
      return { ...f, career_highlights: f.career_highlights.filter((_, i) => i !== idx) };
    });
  };

  const addTag = (name) => {
    const n = (name || '').trim();
    if (!n) return;
    setForm((f) => {
      if (f.career_tags.length >= 5) return f;
      if (f.career_tags.includes(n)) return f;
      return { ...f, career_tags: [...f.career_tags, n] };
    });
    setTagInput('');
  };

  const removeTag = (idx) => {
    setForm((f) => ({ ...f, career_tags: f.career_tags.filter((_, i) => i !== idx) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getAccessToken();
    let toUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        toUpload = await resizeToSquare(file, LOGO_SIZE);
        if (!toUpload) throw new Error('리사이즈 실패');
      } catch (err) {
        setSaveError(err?.message || '이미지 처리에 실패했습니다.');
        e.target.value = '';
        return;
      }
    }
    const subdir = isEdit && careerId ? String(careerId) : 'temp';
    const fd = new FormData();
    fd.append('file', toUpload, toUpload.name);
    try {
      const res = await fetch(`${UPLOAD_URL}?folder=careers&post_id=${subdir}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('업로드 실패');
      const data = await res.json();
      const assetId = data.id;
      setForm((f) => ({ ...f, logo_asset_id: assetId }));
      setLogoPreview(data.url ? `${API_BASE || ''}${data.url}` : null);
    } catch (err) {
      setSaveError(err?.message || '로고 업로드에 실패했습니다.');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name?.trim()) {
      setSaveError('회사명을 입력하세요.');
      return;
    }
    if (!form.role?.trim()) {
      setSaveError('역할을 입력하세요.');
      return;
    }
    if (!form.start_date) {
      setSaveError('시작일을 입력하세요.');
      return;
    }
    const filledHighlights = form.career_highlights.filter((h) => (h || '').trim());
    if (filledHighlights.length < 1) {
      setSaveError('한 일을 최소 1개 입력하세요.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const tagIds = [];
      for (const name of form.career_tags) {
        const n = (name || '').trim();
        if (!n) continue;
        const res = await apiClient.post('/api/tags', { name: n });
        if (res.data?.id) tagIds.push(res.data.id);
      }
      const payload = {
        logo_asset_id: form.logo_asset_id,
        company_name: form.company_name.trim(),
        role: form.role.trim(),
        start_date: form.start_date.length === 7 ? form.start_date + '-01' : form.start_date,
        end_date: isOngoing ? null : (form.end_date ? (form.end_date.length === 7 ? form.end_date + '-01' : form.end_date) : null),
        description: null,
        sort_order: form.sort_order,
        career_links: form.career_links
          .filter((l) => l.link_name?.trim() && l.link_url?.trim())
          .slice(0, 5)
          .map((l, i) => ({ link_name: l.link_name.trim(), link_url: l.link_url.trim(), sort_order: i })),
        career_highlights: form.career_highlights.filter((h) => (h || '').trim()).slice(0, 5),
        career_tags: tagIds.slice(0, 5),
      };
      if (isEdit && careerId) {
        await apiClient.put(`/api/careers/${careerId}`, payload);
        alert('저장되었습니다.');
        onSuccess?.();
      } else {
        const res = await apiClient.post('/api/careers', payload);
        if (res.data?.id) {
          alert('등록되었습니다.');
          onSuccess?.();
          if (!embedded) navigate('/careers');
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

  // [수정] w-full을 제거한 기본 input 스타일 (Flex 아이템용)
  const baseInputCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 dark:focus:ring-green-500 dark:focus:border-green-500';
  
  // [수정] 일반적인 블록 요소용 (여기에는 w-full 포함)
  const blockInputCls = `w-full ${baseInputCls}`;
  
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (loadError && isEdit) {
    return (
      <>
        <div className="p-4">
          <button type="button" onClick={() => { setLoadError(null); onCancel?.(); if (!onCancel && !embedded) navigate('/careers'); }} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200">
            {embedded ? '닫기' : '목록으로'}
          </button>
        </div>
        <Dialog open={Boolean(loadError)} onClose={() => { setLoadError(null); onCancel?.(); if (!onCancel && !embedded) navigate('/careers'); }} aria-labelledby="career-load-error-dialog-title">
          <DialogTitle id="career-load-error-dialog-title">오류</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{loadError}</DialogContentText>
          </DialogContent>
          <DialogActions className="dark:border-t dark:border-gray-700">
            <Button onClick={() => { setLoadError(null); onCancel?.(); if (!onCancel && !embedded) navigate('/careers'); }} color="primary" variant="contained">확인</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  const now = new Date();
  const maxYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="w-full">
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? '경력 수정' : '새 경력'}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">경력 정보를 입력하세요.</p>
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
        className="space-y-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        {/* 회사명 */}
        <div>
          <label htmlFor="company_name" className={labelCls}>회사명 *</label>
          <input
            id="company_name"
            type="text"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            className={blockInputCls} // w-full 포함
            placeholder="회사명"
            required
          />
        </div>

        {/* 역할 */}
        <div>
          <label htmlFor="role" className={labelCls}>역할 *</label>
          <input
            id="role"
            type="text"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className={blockInputCls} // w-full 포함
            placeholder="예: Software Engineer"
            required
          />
        </div>

        {/* 기간 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <label htmlFor="start_date" className={labelCls}>시작일 (연·월) *</label>
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
              재직 중
            </label>
          </div>
          <input
            id="start_date"
            type="month"
            value={form.start_date || ''}
            onChange={(e) => {
              const v = e.target.value || '';
              setForm((f) => ({
                ...f,
                start_date: v,
                end_date: v && f.end_date && f.end_date < v ? '' : f.end_date,
              }));
            }}
            max={maxYearMonth}
            className={blockInputCls}
          />
          <input
            id="end_date"
            type="month"
            value={form.end_date || ''}
            min={form.start_date || undefined}
            max={maxYearMonth}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || '' }))}
            className={blockInputCls}
            disabled={isOngoing}
          />
        </div>

        {/* 로고 */}
        <div>
          <label className={labelCls}>회사 로고 (선택)</label>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 dark:text-gray-400 text-xs">없음</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input type="file" accept=".png,.jpg,.jpeg,.gif,.webp" onChange={handleLogoChange} className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-200 file:text-gray-800 dark:file:bg-gray-600 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{logoPreview ? '로고 선택됨' : '선택된 파일 없음'}</span>
              {form.logo_asset_id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, logo_asset_id: null }));
                    setLogoPreview(null);
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  이미지 제거
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 링크 (문제의 구간) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">링크 (최대 5개)</span>
            <button
              type="button"
              onClick={addLink}
              disabled={form.career_links.length >= 5}
              className="text-sm text-blue-600 dark:text-green-400 hover:text-blue-800 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + 링크 추가
            </button>
          </div>
          <div className="space-y-2">
            {form.career_links.map((link, idx) => (
              // 부모 컨테이너: flex-row, w-full 유지
              <div key={idx} className="flex gap-2 items-center w-full">
                {/* Select: w-28(112px) 정도로 고정, shrink-0으로 찌그러짐 방지 */}
                <select
                  value={link.link_name || '웹사이트'}
                  onChange={(e) => updateLink(idx, 'link_name', e.target.value)}
                  className={`${baseInputCls} w-28 shrink-0 px-2`} // <-- w-full 없음
                >
                  {LINK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                {/* Input: flex-1 (남은 공간 차지), min-w-0 (내부 콘텐츠보다 작아질 수 있게 허용), w-full 제거 */}
                <input
                  type="url"
                  value={link.link_url}
                  onChange={(e) => updateLink(idx, 'link_url', e.target.value)}
                  className={`${baseInputCls} flex-1 min-w-0`} // <-- 중요: w-full 제거, flex-1, min-w-0
                  placeholder="https://..."
                />

                {/* 삭제 버튼: 크기 고정 */}
                <button 
                  type="button" 
                  onClick={() => removeLink(idx)} 
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded shrink-0" 
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 한 일 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={labelCls}>한 일 (개조식, 최소 1개·최대 5개, 항목당 20자)</span>
            <button
              type="button"
              onClick={addHighlight}
              disabled={form.career_highlights.length >= 5}
              className="text-sm text-blue-600 dark:text-green-400 hover:text-blue-800 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + 항목 추가
            </button>
          </div>
          <div className="space-y-2">
            {form.career_highlights.map((h, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-gray-600 dark:text-gray-400 shrink-0" aria-hidden>●</span>
                <input
                  type="text"
                  value={h}
                  onChange={(e) => updateHighlight(idx, e.target.value)}
                  className={`${baseInputCls} flex-1 min-w-0`} // 한 일 입력란도 w-full 제거하고 flex-1 적용
                  placeholder="업무 내용 (최대 20자)"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(idx)}
                  disabled={form.career_highlights.length <= 1}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label="항목 삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 태그 */}
        <div>
          <label className={labelCls}>태그 (최대 5개, Enter로 추가)</label>
          <div className="flex flex-wrap gap-2 items-center">
            {form.career_tags.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-green-900/40 border border-blue-300 dark:border-green-700 text-blue-800 dark:text-green-200"
              >
                {t}
                <button type="button" onClick={() => removeTag(idx)} className="text-blue-600 dark:text-green-400 hover:text-blue-800 dark:hover:text-green-300 -mr-0.5" aria-label="태그 제거">
                  ×
                </button>
              </span>
            ))}
            {form.career_tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                className={`${baseInputCls} w-40`} // 여기는 w-40 고정
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || !(form.company_name?.trim() && form.role?.trim() && form.start_date) || form.career_highlights.filter((h) => (h || '').trim()).length < 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-green-600 rounded-lg hover:bg-blue-700 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : (isEdit ? '저장' : '등록')}
          </button>
          <button type="button" onClick={() => { onCancel?.(); if (!onCancel && !embedded) navigate('/careers'); }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
            {embedded ? '닫기' : '목록으로'}
          </button>
        </div>
      </form>
    </div>
  );
}