import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DragIndicator from '@mui/icons-material/DragIndicator';
import apiClient from '../../lib/apiClient';
import CareerFormModal from './CareerFormModal';

function formatPeriod(start, end) {
  const fmt = (d) => {
    if (!d) return '';
    const parts = String(d).split('-');
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
    return '';
  };
  const s = fmt(start);
  const e = end ? fmt(end) : (s ? '(재직 중)' : '');
  return [s, e].filter(Boolean).join(' ~ ') || '-';
}

function sortCareersByPeriodDesc(list) {
  return [...list].sort((a, b) => {
    const endA = a.end_date || '9999-12';
    const endB = b.end_date || '9999-12';
    if (endB !== endA) return endB.localeCompare(endA);
    return (b.start_date || '').localeCompare(a.start_date || '');
  });
}

function moveInArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function CareerList() {
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', careerId: null });

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/careers');
      const list = Array.isArray(res.data) ? res.data : [];
      setCareers(sortCareersByPeriodDesc(list));
    } catch (e) {
      setError(e?.message || '목록을 불러오지 못했습니다.');
      setCareers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const handleDelete = async (id, companyName) => {
    if (!window.confirm(`"${companyName || id}" 경력을 삭제하시겠습니까?`)) return;
    try {
      await apiClient.delete(`/api/careers/${id}`);
      fetchCareers();
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
    const arr = moveInArray(careers, fromIdx, toIdx);
    const idOrder = arr.map((c) => c.id);
    try {
      await apiClient.patch('/api/careers/reorder', { id_order: idOrder });
      fetchCareers();
    } catch (err) {
      setError(err?.message || '순서 변경에 실패했습니다.');
    }
    setDragId(null);
  };

  const openFormEdit = (careerId) => setFormModal({ open: true, mode: 'edit', careerId });
  const closeForm = () => setFormModal({ open: false, mode: 'add', careerId: null });

  const handleFormSuccess = () => {
    closeForm();
    fetchCareers();
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">경력 관리</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">경력 목록·드래그 정렬·등록/수정</p>
        </div>
        <button
          onClick={() => navigate('/careers/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          새 경력
        </button>
      </div>

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="careerlist-error-dialog-title">
        <DialogTitle id="careerlist-error-dialog-title">오류</DialogTitle>
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
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14">번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px]">회사명</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">역할</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px] whitespace-nowrap">기간</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {careers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      등록된 경력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  careers.map((row, idx) => {
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
                        <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">{careers.length - idx}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[160px]">
                          {row.company_name || '(회사명 없음)'}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 min-w-[120px]">{row.role || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 min-w-[180px] whitespace-nowrap">
                          {formatPeriod(row.start_date, row.end_date)}
                        </td>
                        <td className="px-2 py-3 text-sm">
                          <div className="flex flex-nowrap justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openFormEdit(row.id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 shrink-0"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row.id, row.company_name)}
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

      <CareerFormModal
        open={formModal.open}
        onClose={closeForm}
        mode={formModal.mode}
        careerId={formModal.careerId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
