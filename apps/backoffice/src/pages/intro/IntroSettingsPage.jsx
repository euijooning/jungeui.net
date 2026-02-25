import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/apiClient';
import { Button, TextField, Snackbar, Alert } from '@mui/material';

const INTRO_MAX = 20;

function ensureHttps(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (!s) return '';
  if (s.startsWith('https://') || s.startsWith('http://')) return s;
  return `https://${s}`;
}

export default function IntroSettingsPage() {
  const [resumeLink, setResumeLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [resumeIntro, setResumeIntro] = useState('');
  const [portfolioIntro, setPortfolioIntro] = useState('');
  const [initial, setInitial] = useState(null); // 로드된 값 (dirty 비교용)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get('/api/about/portfolio-links');
        if (cancelled) return;
        const rLink = (data?.resume_link ?? '').trim();
        const pLink = (data?.portfolio_link ?? '').trim();
        const rIntro = (data?.resume_intro ?? '').slice(0, INTRO_MAX).trim();
        const pIntro = (data?.portfolio_intro ?? '').slice(0, INTRO_MAX).trim();
        
        setResumeLink(rLink);
        setPortfolioLink(pLink);
        setResumeIntro(rIntro);
        setPortfolioIntro(pIntro);
        
        setInitial({
          resumeLink: ensureHttps(rLink).trim(),
          portfolioLink: ensureHttps(pLink).trim(),
          resumeIntro: rIntro,
          portfolioIntro: pIntro,
        });
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || e?.message || '불러오기 실패');
        if (!cancelled) setInitial({ resumeLink: '', portfolioLink: '', resumeIntro: '', portfolioIntro: '' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleResumeLinkBlur = () => setResumeLink((v) => ensureHttps(v));
  const handlePortfolioLinkBlur = () => setPortfolioLink((v) => ensureHttps(v));

  // 현재 입력값 정리
  const normalized = {
    resumeLink: ensureHttps(resumeLink).trim(),
    portfolioLink: ensureHttps(portfolioLink).trim(),
    resumeIntro: resumeIntro.trim().slice(0, INTRO_MAX),
    portfolioIntro: portfolioIntro.trim().slice(0, INTRO_MAX),
  };

  // 변경 여부 확인 (Dirty Check)
  const isDirty =
    initial != null &&
    (normalized.resumeLink !== (initial.resumeLink ?? '') ||
      normalized.portfolioLink !== (initial.portfolioLink ?? '') ||
      normalized.resumeIntro !== (initial.resumeIntro ?? '') ||
      normalized.portfolioIntro !== (initial.portfolioIntro ?? ''));

  // [수정됨] 빈 값이어도 저장을 허용 (allFilled 제거) -> 변경사항만 있으면 활성화
  const saveEnabled = !saving && isDirty;

  const handleSave = async () => {
    if (!saveEnabled) return;
    setSaving(true);
    setError(null);
    
    const payload = {
      resume_link: normalized.resumeLink,
      portfolio_link: normalized.portfolioLink,
      resume_intro: normalized.resumeIntro,
      portfolio_intro: normalized.portfolioIntro,
    };

    try {
      await apiClient.put('/api/about_messages/portfolio-links', payload);
      
      // 저장 성공 시 초기값 갱신
      setInitial({
        resumeLink: payload.resume_link,
        portfolioLink: payload.portfolio_link,
        resumeIntro: payload.resume_intro,
        portfolioIntro: payload.portfolio_intro,
      });
      
      setResumeLink(payload.resume_link);
      setPortfolioLink(payload.portfolio_link);
      setResumeIntro(payload.resume_intro);
      setPortfolioIntro(payload.portfolio_intro);
      
      setSnackbar({ open: true, message: '저장되었습니다.' });
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-4">
        <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">소개 관리</h2>
      
      {error && (
        <Alert severity="error" onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {/* 이력서 링크 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            이력서 링크
          </label>
          <TextField
            size="small"
            fullWidth
            value={resumeLink}
            onChange={(e) => setResumeLink(e.target.value)}
            onBlur={handleResumeLinkBlur}
            placeholder="https://... (비워두면 버튼 숨김)"
            className="min-w-0"
          />
        </div>

        {/* 포트폴리오 링크 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            포트폴리오 링크
          </label>
          <TextField
            size="small"
            fullWidth
            value={portfolioLink}
            onChange={(e) => setPortfolioLink(e.target.value)}
            onBlur={handlePortfolioLinkBlur}
            placeholder="https://... (비워두면 버튼 숨김)"
            className="min-w-0"
          />
        </div>

        {/* 이력서 소개 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            이력서 소개 (한 문장, 최대 {INTRO_MAX}자)
          </label>
          <div className="flex gap-2 items-center flex-wrap">
            <TextField
              size="small"
              fullWidth
              value={resumeIntro}
              onChange={(e) => setResumeIntro(e.target.value.slice(0, INTRO_MAX))}
              placeholder="예: 이력서 보러가기"
              inputProps={{ maxLength: INTRO_MAX }}
              className="min-w-0 flex-1"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {resumeIntro.length}/{INTRO_MAX}
            </span>
          </div>
        </div>

        {/* 포트폴리오 소개 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            포트폴리오 소개 (한 문장, 최대 {INTRO_MAX}자)
          </label>
          <div className="flex gap-2 items-center flex-wrap">
            <TextField
              size="small"
              fullWidth
              value={portfolioIntro}
              onChange={(e) => setPortfolioIntro(e.target.value.slice(0, INTRO_MAX))}
              placeholder="예: 포트폴리오 보러가기"
              inputProps={{ maxLength: INTRO_MAX }}
              className="min-w-0 flex-1"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {portfolioIntro.length}/{INTRO_MAX}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="contained" onClick={handleSave} disabled={!saveEnabled}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}