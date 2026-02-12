import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CareerForm from './CareerForm';

export default function CareerFormModal({ open, onClose, mode, careerId, onSuccess }) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="dark:text-gray-100">{mode === 'edit' ? '경력 수정' : '새 경력'}</DialogTitle>
      <DialogContent className="dark:bg-gray-800" sx={{ pt: 1, pb: 3 }}>
        {open && (
          <CareerForm
            key={mode === 'edit' ? `edit-${careerId}` : 'new'}
            isEdit={mode === 'edit'}
            careerId={careerId}
            onSuccess={handleSuccess}
            onCancel={onClose}
            embedded
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
