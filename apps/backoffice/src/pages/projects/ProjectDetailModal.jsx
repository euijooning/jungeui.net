import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { API_BASE } from '../../lib/apiClient';

export default function ProjectDetailModal({ project, open, onClose, onEdit }) {
  if (!project) return null;

  const base = API_BASE || '';
  const thumbUrl = project.thumbnail
    ? (project.thumbnail.startsWith('http') ? project.thumbnail : base + (project.thumbnail.startsWith('/') ? project.thumbnail : `/${project.thumbnail}`))
    : (project.thumbnail_asset_id ? `${base}/api/assets/${project.thumbnail_asset_id}/download` : null);
  const introUrl = project.intro_image
    ? (project.intro_image.startsWith('http') ? project.intro_image : base + (project.intro_image.startsWith('/') ? project.intro_image : `/${project.intro_image}`))
    : (project.intro_image_asset_id ? `${base}/api/assets/${project.intro_image_asset_id}/download` : null);

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
      <DialogTitle className="dark:text-gray-100">{project.title || '(제목 없음)'}</DialogTitle>
      <DialogContent className="flex flex-col gap-4 dark:bg-gray-800" sx={{ pt: 1, pb: 2 }}>
        {project.description && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">상세 내용</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
        <p className="text-sm text-gray-900 dark:text-gray-200">
          <span className="text-gray-500 dark:text-gray-400">기간: </span>
          {periodStr}
        </p>
        {thumbUrl && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">대표 이미지</p>
            <img src={thumbUrl} alt="" className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
          </div>
        )}
        {introUrl && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">소개 이미지</p>
            <img src={introUrl} alt="" className="w-full max-w-md aspect-video object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
          </div>
        )}
        {(project.links || []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">링크</p>
            <ul className="list-none p-0 m-0 space-y-1">
              {project.links.map((l) => (
                <li key={l.id}>
                  <a href={l.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-green-400 hover:underline text-sm">
                    {l.link_name}: {l.link_url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(project.tags || []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">태그</p>
            <div className="flex flex-wrap gap-1">
              {project.tags.map((t) => (
                <span key={t.id} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions className="dark:bg-gray-800 dark:border-t dark:border-gray-700">
        <Button onClick={onClose} className="text-gray-700 dark:text-gray-200">닫기</Button>
        {onEdit && (
          <Button variant="contained" color="success" onClick={onEdit}>
            수정
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
