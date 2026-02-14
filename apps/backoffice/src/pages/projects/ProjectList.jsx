import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from '@mui/material';
import DragIndicator from '@mui/icons-material/DragIndicator';
import apiClient from '../../lib/apiClient';
import ProjectDetailModal from './ProjectDetailModal';
import ProjectFormModal from './ProjectFormModal';

function formatPeriod(start, end) {
  const fmt = (d) => {
    if (!d) return '';
    const parts = String(d).split('-');
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}.${parts[2] || '01'}`;
    return '';
  };
  const s = fmt(start);
  const e = end ? fmt(end) : (s ? '(진행 중)' : '');
  return [s, e].filter(Boolean).join(' ~ ') || '-';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);

  const [detailModal, setDetailModal] = useState({ open: false, project: null });
  const [formModal, setFormModal] = useState({ open: false, projectId: null });
  const [introModalOpen, setIntroModalOpen] = useState(false);
  const [introText, setIntroText] = useState('');
  const [introSaving, setIntroSaving] = useState(false);
  const [introError, setIntroError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/projects');
      const list = Array.isArray(res.data) ? res.data : [];
      setProjects(list);
    } catch (e) {
      setError(e?.message || '목록을 불러오지 못했습니다.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title || id}" 프로젝트를 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (e) {
      setError(e?.message || '삭제에 실패했습니다.');
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
      setError(err?.message || '순서 변경에 실패했습니다.');
    }
    setDragId(null);
  };

  const openDetail = (project) => setDetailModal({ open: true, project });
  const closeDetail = () => setDetailModal({ open: false, project: null });
  const openFormAdd = () => navigate('/projects/new');
  const openFormEdit = (projectId) => setFormModal({ open: true, projectId });
  const closeForm = () => setFormModal({ open: false, projectId: null });

  const handleFormSuccess = () => {
    closeForm();
    fetchProjects();
  };

  const handleDetailEdit = () => {
    if (detailModal.project?.id) {
      closeDetail();
      openFormEdit(detailModal.project.id);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">프로젝트 관리</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">프로젝트 목록·드래그 정렬·등록/수정</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              setIntroModalOpen(true);
              setIntroError(null);
              try {
                const res = await apiClient.get('/api/about/projects-careers-intro');
                setIntroText(res?.data?.text ?? '');
              } catch {
                setIntroText('');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 dark:bg-sky-600 rounded-lg hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors"
          >
            소개 문구
          </button>
          <button
            onClick={openFormAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            새 프로젝트
          </button>
        </div>
      </div>

      <Dialog open={introModalOpen} onClose={() => !introSaving && setIntroModalOpen(false)} aria-labelledby="intro-dialog-title" maxWidth="sm" fullWidth>
        <DialogTitle id="intro-dialog-title">프로젝트/경력 소개 문구</DialogTitle>
        <DialogContent className="pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">클라이언트 소개 페이지의 프로젝트·경력 섹션 제목 아래에 표시됩니다. 최대 20자.</p>
          <TextField
            autoFocus
            fullWidth
            label="소개 문구"
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            error={Boolean(introError) || introText.length > 20}
            helperText={introError || `${introText.length}/20자`}
            className="dark:[&_.MuiOutlinedInput-root]:bg-gray-700"
          />
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => !introSaving && setIntroModalOpen(false)} disabled={introSaving}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              setIntroSaving(true);
              setIntroError(null);
              try {
                await apiClient.put('/api/about_messages/projects-careers-intro', { text: introText.trim().slice(0, 20) });
                setIntroModalOpen(false);
              } catch (e) {
                setIntroError(e?.message || '저장에 실패했습니다.');
              } finally {
                setIntroSaving(false);
              }
            }}
            disabled={introSaving || introText.length > 20}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="projectlist-error-dialog-title">
        <DialogTitle id="projectlist-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">순서</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">제목</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px] whitespace-nowrap">기간</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
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
                          {row.title || '(제목 없음)'}
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
                              onClick={() => openFormEdit(row.id)}
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
        )}
      </div>

      <ProjectDetailModal
        project={detailModal.project}
        open={detailModal.open}
        onClose={closeDetail}
        onEdit={handleDetailEdit}
      />

      <ProjectFormModal
        open={formModal.open}
        onClose={closeForm}
        mode="edit"
        projectId={formModal.projectId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
