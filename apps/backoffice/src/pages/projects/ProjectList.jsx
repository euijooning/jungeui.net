import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { getAccessToken } from '../../lib/apiClient';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import DragIndicator from '@mui/icons-material/DragIndicator';
import Add from '@mui/icons-material/Add';
import ProjectDetailModal from './ProjectDetailModal';

const INTRO_MAX = 20;

function formatPeriod(start, end) {
  const s = start ? String(start).slice(0, 7).replace('-', '.') : '';
  if (!end) return s ? `${s} ~ 진행중` : '진행중';
  const e = String(end).slice(0, 7).replace('-', '.');
  return s ? `${s} ~ ${e}` : e;
}

function moveInArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [intro, setIntro] = useState('');
  const [introSaving, setIntroSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, project: null });

  const fetchData = useCallback(async () => {
    if (!getAccessToken()) {
      setError('인증이 필요합니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [projRes, introRes] = await Promise.all([
        apiClient.get('/api/projects'),
        apiClient.get('/api/about/projects-careers-intro'),
      ]);
      setProjects(Array.isArray(projRes.data) ? projRes.data : []);
      const text = introRes?.data?.text;
      setIntro(typeof text === 'string' ? text : '');
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveIntro = async () => {
    const value = intro.slice(0, INTRO_MAX);
    setIntroSaving(true);
    setError(null);
    try {
      await apiClient.put('/api/about_messages/projects-careers-intro', { text: value });
      setIntro(value);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '소개 문구 저장에 실패했습니다.');
    } finally {
      setIntroSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title || id}" 프로젝트를 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/projects/${id}`);
      fetchData();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '삭제에 실패했습니다.');
    }
  };

  const handleDragStart = (e, idx) => {
    setDragId(idx);
    setDropTargetIdx(null);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    if (dragId == null || dragId === targetIdx) return;
    setDropTargetIdx(targetIdx);
  };

  const handleDragLeave = () => setDropTargetIdx(null);

  const handleDragEnd = () => {
    setDragId(null);
    setDropTargetIdx(null);
  };

  const handleDrop = async (e, toIdx) => {
    e.preventDefault();
    setDropTargetIdx(null);
    const fromIdx = dragId;
    if (fromIdx == null || fromIdx === toIdx) {
      setDragId(null);
      return;
    }
    const arr = moveInArray(projects, fromIdx, toIdx);
    const idOrder = arr.map((p) => p.id);
    try {
      await apiClient.patch('/api/projects/reorder', { id_order: idOrder });
      setProjects(arr);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || '순서 변경에 실패했습니다.');
    }
    setDragId(null);
  };

  const openDetail = (project) => setDetailModal({ open: true, project });
  const closeDetail = () => setDetailModal({ open: false, project: null });
  const handleDetailEdit = () => {
    if (detailModal.project?.id) {
      closeDetail();
      navigate(`/projects/${detailModal.project.id}/edit`);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    // 수정됨: 배경색 제거, 내부 padding 제거하고 w-full만 유지
    <div className="w-full">
      {/* 소개 문구 편집 */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          프로젝트 섹션 소개 문구 (최대 {INTRO_MAX}자)
        </label>
        <div className="flex gap-2 flex-wrap">
          <TextField
            size="small"
            fullWidth
            value={intro}
            onChange={(e) => setIntro(e.target.value.slice(0, INTRO_MAX))}
            placeholder="예: 진행한 프로젝트를 소개합니다."
            inputProps={{ maxLength: INTRO_MAX }}
            className="min-w-0 flex-1"
          />
          <Button variant="contained" onClick={handleSaveIntro} disabled={introSaving}>
            저장
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">프로젝트</h2>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/projects/new')}>
          등록
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  순서
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14">
                  번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                  제목
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[220px] whitespace-nowrap">
                  기간
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    등록된 프로젝트가 없습니다.
                  </td>
                </tr>
              ) : (
                projects.map((row, idx) => {
                  const displayNo = idx + 1;
                  const isDragging = dragId === idx;
                  const isDropTarget = dropTargetIdx === idx;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isDragging ? 'opacity-50' : ''} ${isDropTarget ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, idx)}
                    >
                      <td className="px-2 py-3 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">
                        <DragIndicator fontSize="small" />
                      </td>
                      <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">{displayNo}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[200px]">
                        <div>{row.title || '(제목 없음)'}</div>
                        {row.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                            {row.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 min-w-[220px] whitespace-nowrap">
                        {formatPeriod(row.start_date, row.end_date)}
                      </td>
                      <td className="px-2 py-3 text-sm">
                        <div className="flex flex-nowrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDetail(row)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 shrink-0"
                          >
                            보기
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${row.id}/edit`)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 shrink-0"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id, row.title)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 shrink-0"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="projectlist-error-dialog-title">
        <DialogTitle id="projectlist-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(null)} color="primary" variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>

      <ProjectDetailModal
        project={detailModal.project}
        open={detailModal.open}
        onClose={closeDetail}
        onEdit={handleDetailEdit}
      />
    </div>
  );
}