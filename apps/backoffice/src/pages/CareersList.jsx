import React from 'react';
import { Box, Typography } from '@mui/material';

export default function CareersList() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>경력 관리</Typography>
      <Typography color="text.secondary">
        경력 목록·드래그 정렬·등록/수정. (API 연동 예정)
      </Typography>
    </Box>
  );
}
