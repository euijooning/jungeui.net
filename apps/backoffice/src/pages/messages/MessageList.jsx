import React, { useState, useEffect, useCallback } from 'react';
import apiClient, { getAccessToken } from '../../lib/apiClient';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';

const TITLE_MAX = 20;
const CONTENT_MAX = 120;

function truncate(str, maxLen = 60) {
  if (!str || typeof str !== 'string') return '';
  return str.length <= maxLen ? str : str.slice(0, maxLen) + '…';
}

export default function MessageList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({
    open: false,
    mode: 'add',
    id: null,
    title: '',
    content: '',
    sort_order: 1,
  });

  const fetchList = useCallback(async () => {
    if (!getAccessToken()) {
      setError('인증이 필요합니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/about_messages');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openAdd = () => {
    setError(null);
    if (items.length >= 3) {
      setError('최대 3개만 추가 가능합니다. 수정을 진행해 주세요.');
      return;
    }
    // 노출순서 표시: 새 항목이 들어갈 위치(1,2,3). 저장 시에는 max+1로 마지막에 추가
    setDialog({
      open: true,
      mode: 'add',
      id: null,
      title: '',
      content: '',
      sort_order: items.length + 1,
    });
  };

  const openEdit = (msg, position) => {
    setError(null);
    setDialog({
      open: true,
      mode: 'edit',
      id: msg.id,
      title: msg.title || '',
      content: msg.content || '',
      sort_order: position ?? 1,
    });
  };

  const closeDialog = () => {
    setDialog((d) => ({ ...d, open: false }));
    setError(null);
  };

  const saveDialog = async () => {
    const { mode, id, title, content, sort_order } = dialog;
    const t = title.trim();
    const c = content.trim();
    if (t.length > TITLE_MAX) {
      setError(`제목은 ${TITLE_MAX}자 이하여야 합니다. (현재 ${t.length}자)`);
      return;
    }
    if (c.length > CONTENT_MAX) {
      setError(`내용은 ${CONTENT_MAX}자 이하여야 합니다. (현재 ${c.length}자)`);
      return;
    }
    if (mode === 'add' && items.length >= 3) {
      setError('최대 3개만 추가 가능합니다. 수정을 진행해 주세요.');
      return;
    }
    try {
      if (mode === 'add') {
        const sortOrderToSave = items.length > 0 ? Math.max(...items.map((m) => m.sort_order ?? 0)) + 1 : 1;
        await apiClient.post('/api/about_messages', { title: t, content: c, sort_order: sortOrderToSave });
      } else {
        const newPosition = Math.min(3, Math.max(1, Number(sort_order) || 1));
        const sorted = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const currentIdx = sorted.findIndex((m) => m.id === id);
        if (currentIdx < 0) {
          setError('항목을 찾을 수 없습니다.');
          return;
        }
        const [moved] = sorted.splice(currentIdx, 1);
        sorted.splice(newPosition - 1, 0, moved);
        // 새 순서(1,2,3)로 sort_order 부여 후, 순서가 바뀐 항목만 PUT
        for (let i = 0; i < sorted.length; i++) {
          const m = sorted[i];
          const newSo = i + 1;
          if (newSo !== (m.sort_order ?? 0)) {
            await apiClient.put(`/api/about_messages/${m.id}`, {
              title: m.id === id ? t : m.title,
              content: m.id === id ? c : m.content,
              sort_order: newSo,
            });
          } else if (m.id === id) {
            await apiClient.put(`/api/about_messages/${id}`, { title: t, content: c, sort_order: newSo });
          }
        }
      }
      closeDialog();
      await fetchList();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '저장 실패');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('이 메시지를 삭제할까요?')) return;
    try {
      await apiClient.delete(`/api/about_messages/${id}`);
      await fetchList();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '삭제 실패');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">메시지</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">소개 페이지 인사말 메시지 (과거/현재/미래 등). 최대 3개 권장.</p>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
          메시지 추가
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">메시지가 없습니다. 추가해 보세요.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((msg, idx) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-4 py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <span className="w-8 text-sm text-gray-400 dark:text-gray-500 tabular-nums">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-200">{msg.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{truncate(msg.content)}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <IconButton size="small" onClick={() => openEdit(msg, idx + 1)} title="수정" aria-label="수정" className="!text-gray-600 dark:!text-gray-300">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteMessage(msg.id)} title="삭제" aria-label="삭제" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="messagelist-error-dialog-title">
        <DialogTitle id="messagelist-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="dark:text-gray-100">{dialog.mode === 'add' ? '메시지 추가' : '메시지 수정'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 dark:bg-gray-800" sx={{ overflow: 'visible', pt: 5, pb: 1 }}>
          <TextField
            label="제목"
            sx={{ mt: 1 }}
            placeholder="예: 과거, 현재, 미래"
            value={dialog.title}
            onChange={(e) => setDialog((d) => ({ ...d, title: e.target.value }))}
            fullWidth
            autoFocus
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputProps={{ maxLength: TITLE_MAX }}
            helperText={`${dialog.title.length}/${TITLE_MAX}`}
            error={dialog.title.length > TITLE_MAX}
          />
          <TextField
            label="내용"
            value={dialog.content}
            onChange={(e) => setDialog((d) => ({ ...d, content: e.target.value }))}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputProps={{ maxLength: CONTENT_MAX }}
            helperText={`${dialog.content.length}/${CONTENT_MAX}`}
            error={dialog.content.length > CONTENT_MAX}
          />
          <TextField
            label="노출 순서"
            type="number"
            value={dialog.mode === 'add' ? items.length + 1 : dialog.sort_order}
            onChange={(e) => setDialog((d) => ({ ...d, sort_order: e.target.value }))}
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 1 }}
            disabled={dialog.mode === 'add'}
          />
        </DialogContent>
        <DialogActions className="dark:bg-gray-800 dark:border-t dark:border-gray-700">
          <Button onClick={closeDialog} className="text-gray-700 dark:text-gray-200">취소</Button>
          <Button
            variant="contained"
            color="success"
            onClick={saveDialog}
            disabled={
              !dialog.title.trim() ||
              dialog.title.length > TITLE_MAX ||
              dialog.content.length > CONTENT_MAX
            }
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
