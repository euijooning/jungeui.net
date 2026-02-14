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

/** 트리에서 노드 위치 찾기. 반환: { parentChildren, index } (root면 parentChildren === tree) */
function findNodeInTree(tree, nodeId, parentChildren = null, list = tree) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === nodeId) return { parentChildren: list, index: i };
    const found = findNodeInTree(tree, nodeId, list, list[i].children || []);
    if (found) return found;
  }
  return null;
}

/** 같은 부모 아래에서 fromIndex를 toIndex로 이동. 배열 복사 후 반환 */
function moveInArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** 트리 복제 후 한 노드를 같은 레벨의 다른 위치로 이동 */
function reorderTreeById(tree, dragId, targetId, insertAfter) {
  const treeCopy = JSON.parse(JSON.stringify(tree));
  const drag = findNodeInTree(treeCopy, dragId);
  const target = findNodeInTree(treeCopy, targetId);
  if (!drag || !target || drag.parentChildren !== target.parentChildren) return treeCopy;
  const siblings = drag.parentChildren;
  const fromI = drag.index;
  let toI = target.index;
  if (insertAfter) toI += 1;
  if (fromI === toI || fromI + 1 === toI) return treeCopy;
  const reordered = moveInArray(siblings, fromI, toI > fromI ? toI - 1 : toI);
  if (siblings === treeCopy) return reordered;
  const parent = findParentChildren(treeCopy, siblings);
  if (parent) parent.children = reordered;
  return treeCopy;
}

/** 트리 복제 후 한 노드를 다른 부모(또는 root)로 이동. 반환: { tree, newParentId } */
function moveNodeToParent(tree, dragId, targetParentId, targetSiblingIndex) {
  const treeCopy = JSON.parse(JSON.stringify(tree));
  const drag = findNodeInTree(treeCopy, dragId);
  if (!drag) return { tree: treeCopy, newParentId: undefined };
  let targetChildren;
  if (targetParentId === null) {
    targetChildren = treeCopy;
  } else {
    const parentLoc = findNodeInTree(treeCopy, targetParentId);
    if (!parentLoc) return { tree: treeCopy, newParentId: undefined };
    const parentNode = parentLoc.parentChildren[parentLoc.index];
    if (!parentNode.children) parentNode.children = [];
    targetChildren = parentNode.children;
  }
  const [draggedNode] = drag.parentChildren.splice(drag.index, 1);
  draggedNode.parent_id = targetParentId;
  targetChildren.splice(Math.min(targetSiblingIndex, targetChildren.length), 0, draggedNode);
  return { tree: treeCopy, newParentId: targetParentId };
}

function findParentChildren(tree, childrenArr) {
  if (tree === childrenArr) return null;
  for (const n of tree) {
    if (n.children === childrenArr) return n;
    const found = findParentChildren(n.children || [], childrenArr);
    if (found !== undefined) return found;
  }
  return undefined;
}

export default function CategoryList() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [dialog, setDialog] = useState({ open: false, mode: 'add', parentId: null, editId: null, name: '' });
  const [error, setError] = useState(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [movedParents, setMovedParents] = useState({});
  const [dropTarget, setDropTarget] = useState(null);

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
    try {
      for (const [id, parentId] of Object.entries(movedParents)) {
        await apiClient.put(`/api/categories/${id}`, { parent_id: parentId });
      }
      const order = buildFlatOrder(tree);
      await apiClient.request('/api/categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ order }),
      });
      setMovedParents({});
      setOrderDirty(false);
      setSaveSuccess(true);
      await fetchTree();
    } catch (e) {
      setError(e?.message || '순서 저장 실패');
    }
  };

  // react-admin은 자체 라우터 사용 → useBlocker가 인앱 이동까지 막아서 사이드바가 안 먹힘. 탭/창 닫을 때만 경고.
  useEffect(() => {
    if (!orderDirty) return;
    const onBeforeUnload = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [orderDirty]);

  const handleDragStart = (e, nodeId) => {
    setDragId(nodeId);
    setDropTarget(null);
    e.dataTransfer.setData('application/json', JSON.stringify({ id: nodeId }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, targetNodeId, insertAfter, targetParentId, targetIndex) => {
    e.preventDefault();
    if (!dragId || dragId === targetNodeId) return;
    setDropTarget({ targetNodeId, insertAfter, targetParentId, targetIndex });
  };
  const handleDragLeave = () => setDropTarget(null);
  const handleDragEnd = () => {
    setDragId(null);
    setDropTarget(null);
  };
  const handleDrop = (e, targetNodeId, insertAfter, targetParentId, targetIndex) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragId || dragId === targetNodeId) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const dragIdNum = data.id;
      const dragLoc = findNodeInTree(tree, dragIdNum);
      const targetLoc = findNodeInTree(tree, targetNodeId);
      if (!dragLoc || !targetLoc) {
        setDragId(null);
        return;
      }
      const sameParent = dragLoc.parentChildren === targetLoc.parentChildren;
      const dropIndex = insertAfter ? targetIndex + 1 : targetIndex;
      if (sameParent) {
        setTree(reorderTreeById(tree, dragIdNum, targetNodeId, insertAfter));
      } else {
        const { tree: nextTree, newParentId } = moveNodeToParent(tree, dragIdNum, targetParentId, dropIndex);
        setTree(nextTree);
        setMovedParents((m) => ({ ...m, [dragIdNum]: newParentId }));
      }
      setOrderDirty(true);
    } catch (_) {}
    setDragId(null);
  };

  const renderNode = (node, depth = 0, indexInSiblings = 0) => {
    const hasChildren = (node.children || []).length > 0;
    const isExpanded = expanded.has(node.id);
    const isDragging = dragId === node.id;
    const targetParentId = node.parent_id ?? null;
    const onDragOverRow = (e) => {
      e.preventDefault();
      if (!dragId || dragId === node.id) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const insertAfter = e.clientY - rect.top > rect.height / 2;
      handleDragOver(e, node.id, insertAfter, targetParentId, indexInSiblings);
    };
    const onDropRow = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const insertAfter = e.clientY - rect.top > rect.height / 2;
      handleDrop(e, node.id, insertAfter, targetParentId, indexInSiblings);
    };
    const showDropAbove = dropTarget?.targetNodeId === node.id && !dropTarget?.insertAfter;
    const showDropBelow = dropTarget?.targetNodeId === node.id && dropTarget?.insertAfter;
    return (
      <div key={node.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 relative">
        {showDropAbove && (
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-green-500 z-10 pointer-events-none" aria-hidden />
        )}
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-opacity ${isDragging ? 'opacity-50' : ''}`}
          style={{ paddingLeft: 16 + depth * 24 }}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={onDragOverRow}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragEnd}
          onDrop={onDropRow}
        >
          <span className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing" aria-hidden>
            <DragIndicator fontSize="small" />
          </span>
          {hasChildren ? (
            <IconButton size="small" onClick={() => toggleExpand(node.id)} aria-label={isExpanded ? '접기' : '펼치기'}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          ) : (
            <span className="w-8" />
          )}
          <span className="flex-1 font-medium text-gray-900 dark:text-gray-200">{node.name}</span>
          <div className="flex gap-1">
            {depth === 0 && (
              <IconButton size="small" onClick={() => openAdd(node.id)} title="하위 카테고리 추가" aria-label="하위 추가">
                <Add fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={() => openEdit(node)} title="수정" aria-label="수정" className="!text-gray-600 dark:!text-gray-300">
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => deleteCategory(node.id)} title="삭제" aria-label="삭제" color="error">
              <Delete fontSize="small" />
            </IconButton>
          </div>
        </div>
        {showDropBelow && (
          <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-green-500 z-10 pointer-events-none" aria-hidden />
        )}
        {hasChildren && isExpanded && (
          <div>{node.children.map((child, j) => renderNode(child, depth + 1, j))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">카테고리 관리</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            대카테고리·소카테고리 순서 변경 및 추가/수정. 드래그 앤 드롭은 순서 저장 버튼으로 반영할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="contained" startIcon={<Add />} onClick={() => openAdd(null)}>
            대카테고리 추가
          </Button>
          <Button variant="contained" color="success" onClick={reorder} disabled={!orderDirty}>
            순서 저장
          </Button>
          {orderDirty && <span className="text-sm text-amber-600 dark:text-amber-400">변경 후 저장하세요.</span>}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {tree.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">카테고리가 없습니다. 대카테고리를 추가해 보세요.</div>
          ) : (
            tree.map((node, i) => renderNode(node, 0, i))
          )}
        </div>
      )}

      <Dialog open={Boolean(error)} onClose={() => setError(null)} aria-labelledby="categorylist-error-dialog-title">
        <DialogTitle id="categorylist-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>{error}</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="dark:text-gray-100">{dialog.mode === 'add' ? (dialog.parentId ? '소카테고리 추가' : '대카테고리 추가') : '카테고리 수정'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 dark:bg-gray-800" sx={{ overflow: 'visible', pt: 5, pb: 1 }}>
          <TextField
            label="이름"
            value={dialog.name}
            onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))}
            fullWidth
            autoFocus
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions className="dark:bg-gray-800 dark:border-t dark:border-gray-700">
          <Button onClick={closeDialog} className="text-gray-700 dark:text-gray-200">취소</Button>
          <Button variant="contained" color="success" onClick={saveDialog} disabled={!dialog.name.trim()}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 저장 완료 메시지 */}
      <Dialog open={saveSuccess} onClose={() => setSaveSuccess(false)}>
        <DialogContent className="dark:bg-gray-800" sx={{ pt: 3 }}>
          <p className="text-gray-800 dark:text-gray-200 font-medium">순서가 저장되었습니다.</p>
        </DialogContent>
        <DialogActions className="dark:bg-gray-800 dark:border-t dark:border-gray-700">
          <Button variant="contained" color="success" onClick={() => setSaveSuccess(false)}>확인</Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
