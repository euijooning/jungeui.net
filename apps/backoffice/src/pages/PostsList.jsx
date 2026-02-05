import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';

export default function PostsList() {
  const navigate = useNavigate();
  return (
    <Box>
      <Typography variant="h5" gutterBottom>글 관리</Typography>
      <Typography color="text.secondary" paragraph>
        게시글 목록·수정·삭제. (API 연동 후 목록 표시)
      </Typography>
      <Button variant="contained" startIcon={<ArticleIcon />} onClick={() => navigate('/write')}>
        새 글 쓰기
      </Button>
    </Box>
  );
}
