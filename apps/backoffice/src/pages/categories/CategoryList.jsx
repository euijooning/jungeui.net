import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/apiClient';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import DragIndicator from '@mui/icons-material/DragIndicator';

function buildFlatOrder(tree) {
  const out = [];
  function walk(nodes) {
    (nodes || []).forEach((n) => {
      out.push({ id: n.id, sort_order: out.length });
      walk(n.children);
    });
  }
  walk(tree);
  return out;
}

export default function CategoryList() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [dialog, setDialog] = useState({ open: false, mode: 'add', parentId: null, editId: null, name: '' });
  const [error, setError] = useState(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/categories?tree=true');
      setTree(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdd = (parentId = null) => {
    setDialog({
      open: true,
      mode: 'add',
      parentId,
      editId: null,
      name: '',
    });
  };

  const openEdit = (node) => {
    setDialog({
      open: true,
      mode: 'edit',
      parentId: node.parent_id,
      editId: node.id,
      name: node.name || '',
    });
  };

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const saveDialog = async () => {
    const { mode, editId, parentId, name } = dialog;
    const body = { name: name.trim(), parent_id: parentId ?? null };
    try {
      if (mode === 'add') {
        await apiClient.post('/api/categories', body);
      } else {
        await apiClient.put(`/api/categories/${editId}`, body);
      }
      closeDialog();
      await fetchTree();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '저장 실패');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('이 카테고리를 삭제할까요? 하위 카테고리도 함께 삭제됩니다.')) return;
    try {
      await apiClient.delete(`/api/categories/${id}`);
      await fetchTree();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || '삭제 실패');
    }
  };

  const reorder = async () => {
    const order = buildFlatOrder(tree);
    try {
      await apiClient.request('/api/categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ order }),
      });
      await fetchTree();
    } catch (e) {
      setError(e?.message || '순서 저장 실패');
    }
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = (node.children || []).length > 0;
    const isExpanded = expanded.has(node.id);
    return (
      <div key={node.id} className="border-b border-gray-200 last:border-0">
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50"
          style={{ paddingLeft: 16 + depth * 24 }}
        >
          <span className="text-gray-400" aria-hidden>
            <DragIndicator fontSize="small" />
          </span>
          {hasChildren ? (
            <IconButton size="small" onClick={() => toggleExpand(node.id)} aria-label={isExpanded ? '접기' : '펼치기'}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          ) : (
            <span className="w-8" />
          )}
          <span className="flex-1 font-medium">{node.name}</span>
          <div className="flex gap-1">
            <IconButton size="small" onClick={() => openAdd(node.id)} title="하위 카테고리 추가" aria-label="하위 추가">
              <Add fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => openEdit(node)} title="수정" aria-label="수정">
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => deleteCategory(node.id)} title="삭제" aria-label="삭제" color="error">
              <Delete fontSize="small" />
            </IconButton>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            대카테고리·소카테고리 순서 변경 및 추가/수정. 드래그 앤 드롭은 순서 저장 버튼으로 반영할 수 있습니다.
          </p>
        </div>
        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="contained" startIcon={<Add />} onClick={() => openAdd(null)}>
            대카테고리 추가
          </Button>
          <Button variant="outlined" onClick={reorder}>
            순서 저장
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          {tree.length === 0 ? (
            <div className="p-6 text-center text-gray-500">카테고리가 없습니다. 대카테고리를 추가해 보세요.</div>
          ) : (
            tree.map((node) => renderNode(node))
          )}
        </div>
      )}

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'add' ? (dialog.parentId ? '소카테고리 추가' : '대카테고리 추가') : '카테고리 수정'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <TextField
            label="이름"
            value={dialog.name}
            onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button variant="contained" onClick={saveDialog} disabled={!dialog.name.trim()}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
