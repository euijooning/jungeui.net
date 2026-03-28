import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

function formatPeriod(start, end) {
  const s = start ? String(start).slice(0, 7).replace('-', '.') : '';
  if (!end) return s ? `${s} ~ 진행중` : '진행중';
  const e = String(end).slice(0, 7).replace('-', '.');
  return s ? `${s} ~ ${e}` : e;
}

export default function ProjectDetailModal({ project, open, onClose, onEdit }) {
  if (!project) return null;

  const tags = project.tags || [];
  const tagNames = tags.map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="project-detail-title" maxWidth="sm" fullWidth>
      <DialogTitle id="project-detail-title">{project.title || '(제목 없음)'}</DialogTitle>
      <DialogContent className="space-y-3">
        {project.description && (
          <div>
            <DialogContentText component="span" className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              한 줄 설명
            </DialogContentText>
            <DialogContentText>{project.description}</DialogContentText>
          </div>
        )}
        <div>
          <DialogContentText component="span" className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
            기간
          </DialogContentText>
          <DialogContentText>{formatPeriod(project.start_date, project.end_date)}</DialogContentText>
        </div>
        {tagNames.length > 0 && (
          <div>
            <DialogContentText component="span" className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              태그
            </DialogContentText>
            <DialogContentText>{tagNames.join(', ')}</DialogContentText>
          </div>
        )}
        {project.notion_url && (
          <div>
            <DialogContentText component="span" className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
              노션 링크
            </DialogContentText>
            <a
              href={project.notion_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 dark:text-green-400 hover:underline break-all"
            >
              {project.notion_url}
            </a>
          </div>
        )}
      </DialogContent>
      <DialogActions className="dark:border-t dark:border-gray-700">
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" color="primary" onClick={onEdit}>
          수정
        </Button>
      </DialogActions>
    </Dialog>
  );
}
