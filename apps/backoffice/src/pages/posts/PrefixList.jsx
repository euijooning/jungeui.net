import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/apiClient';
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

const PREFIX_NAME_MAX_LEN = 20;

export default function PrefixList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, mode: 'add', editId: null, name: '' });

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/post_prefixes');
      setList(Array.isArray(data) ? data : []);
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
    setDialog({ open: true, mode: 'add', editId: null, name: '' });
  };

  const openEdit = (item) => {
    setDialog({ open: true, mode: 'edit', editId: item.id, name: item.name || '' });
  };

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const saveDialog = async () => {
    const name = (dialog.name || '').trim();
    if (!name) {
      setError('말머리 이름을 입력하세요.');
      return;
    }
    if (name.length > PREFIX_NAME_MAX_LEN) {
      setError(`말머리는 최대 ${PREFIX_NAME_MAX_LEN}자까지 입력할 수 있습니다.`);
      return;
    }
    try {
      if (dialog.mode === 'add') {
        await apiClient.post('/api/post_prefixes', { name });
      } else {
        await apiClient.put(`/api/post_prefixes/${dialog.editId}`, { name });
      }
      closeDialog();
      await fetchList();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '저장 실패');
    }
  };

  const deletePrefix = async (id) => {
    if (!window.confirm('이 말머리를 삭제할까요? 해당 말머리를 쓰던 글은 말머리 없음으로 남습니다.')) return;
    try {
      await apiClient.delete(`/api/post_prefixes/${id}`);
      await fetchList();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '삭제 실패');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">말머리 관리</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            게시글에 붙일 말머리(예: 수업명, 공지)를 추가·수정합니다. 최대 20자입니다.
          </p>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
          말머리 추가
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {list.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">말머리가 없습니다. 추가해 보세요.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                  <th className="py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">이름</th>
                  <th className="py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">포스트 수</th>
                  <th className="py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">관리</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{item.id}</td>
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-200">{item.name}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{item.post_count ?? 0}</td>
                    <td className="py-2 px-3">
                      <IconButton size="small" onClick={() => openEdit(item)} title="수정" aria-label="수정" className="!text-gray-600 dark:!text-gray-300">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => deletePrefix(item.id)} title="삭제" aria-label="삭제" color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="prefixlist-error-dialog-title">
        <DialogTitle id="prefixlist-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="dark:text-gray-100">{dialog.mode === 'add' ? '말머리 추가' : '말머리 수정'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 dark:bg-gray-800" sx={{ overflow: 'visible', pt: 5, pb: 1 }}>
          <TextField
            label="이름"
            value={dialog.name}
            onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value.slice(0, PREFIX_NAME_MAX_LEN) }))}
            fullWidth
            autoFocus
            variant="outlined"
            inputProps={{ maxLength: PREFIX_NAME_MAX_LEN }}
            helperText={`${(dialog.name || '').length}/${PREFIX_NAME_MAX_LEN}자`}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions className="dark:bg-gray-800 dark:border-t dark:border-gray-700">
          <Button onClick={closeDialog} className="text-gray-700 dark:text-gray-200">취소</Button>
          <Button variant="contained" color="success" onClick={saveDialog} disabled={!(dialog.name || '').trim()}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
