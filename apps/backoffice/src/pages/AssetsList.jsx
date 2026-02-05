import React from 'react';
import { Box, Typography } from '@mui/material';

export default function AssetsList() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>파일 보관함</Typography>
      <Typography color="text.secondary">
        업로드 파일 갤러리·URL 복사·삭제. (API 연동 예정)
      </Typography>
    </Box>
  );
}
