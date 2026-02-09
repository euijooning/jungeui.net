import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function ProjectDetailModal({ project, open, onClose, onEdit }) {
  if (!project) return null;

  const thumbUrl = project.thumbnail
    ? (project.thumbnail.startsWith('http') ? project.thumbnail : `${API_BASE || ''}${project.thumbnail}`)
    : null;

  const fmt = (d) => {
    if (!d) return '';
    const parts = String(d).split('-');
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}.${parts[2] || '01'}`;
    return '';
  };
  const start = fmt(project.start_date);
  const end = project.end_date ? fmt(project.end_date) : (start ? '(진행 중)' : '');
  const periodStr = [start, end].filter(Boolean).join(' ~ ') || '-';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{project.title || '(제목 없음)'}</DialogTitle>
      <DialogContent className="flex flex-col gap-4" sx={{ pt: 1, pb: 2 }}>
        {project.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">상세 내용</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
        <p className="text-sm">
          <span className="text-gray-500">기간: </span>
          {periodStr}
        </p>
        {thumbUrl && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">대표 이미지</p>
            <img src={thumbUrl} alt="" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
          </div>
        )}
        {(project.links || []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">링크</p>
            <ul className="list-none p-0 m-0 space-y-1">
              {project.links.map((l) => (
                <li key={l.id}>
                  <a href={l.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    {l.link_name}: {l.link_url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(project.tags || []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">태그</p>
            <div className="flex flex-wrap gap-1">
              {project.tags.map((t) => (
                <span key={t.id} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        {onEdit && (
          <Button variant="contained" onClick={onEdit}>
            수정
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
