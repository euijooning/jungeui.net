import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import apiClient from '../../lib/apiClient';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/api/posts/${postId}`)
      .then((res) => {
        setPost(res.data);
      })
      .catch((e) => {
        setError(e?.message || '글을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <CircularProgress />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="w-full">
        <Alert severity="error" onClose={() => setError(null)}>{error || '글이 없습니다.'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/posts')}>목록으로</Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{post.title || '(제목 없음)'}</h1>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/posts/${postId}/edit`)}>
          수정
        </Button>
      </div>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
        상태: {post.status === 'PUBLISHED' ? '발행' : post.status === 'PRIVATE' ? '비공개' : '임시저장'}
        {post.published_at && ` · 발행일: ${new Date(post.published_at).toLocaleDateString('ko-KR')}`}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
        <Box
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content_html || '<p>내용 없음</p>' }}
          sx={{ '& img': { maxWidth: '100%' }, '& iframe': { maxWidth: '100%' } }}
        />
      </Paper>
      <Button sx={{ mt: 2 }} onClick={() => navigate('/posts')}>목록으로</Button>
    </div>
  );
}
