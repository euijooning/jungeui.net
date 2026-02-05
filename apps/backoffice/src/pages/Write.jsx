import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Write() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>글 쓰기</Typography>
      <Typography color="text.secondary">
        TipTap 에디터·설정 패널 연동 예정.
      </Typography>
    </Box>
  );
}
