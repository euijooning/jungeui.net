import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import ProjectForm from './ProjectForm';

export default function ProjectFormModal({ open, onClose, mode, projectId, onSuccess }) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="dark:text-gray-100">{mode === 'edit' ? '프로젝트 수정' : '새 프로젝트'}</DialogTitle>
      <DialogContent className="dark:bg-gray-800" sx={{ pt: 1, pb: 3 }}>
        {open && (
          <ProjectForm
            key={mode === 'edit' ? `edit-${projectId}` : 'new'}
            isEdit={mode === 'edit'}
            projectId={projectId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            embedded
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
