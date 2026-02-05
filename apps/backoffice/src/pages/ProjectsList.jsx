import React from 'react';
import { Box, Typography } from '@mui/material';

export default function ProjectsList() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>프로젝트 관리</Typography>
      <Typography color="text.secondary">
        프로젝트 목록·드래그 정렬·등록/수정. (API 연동 예정)
      </Typography>
    </Box>
  );
}
