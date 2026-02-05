import React from 'react';
import { Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditNoteIcon from '@mui/icons-material/EditNote';
import WorkIcon from '@mui/icons-material/Work';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Jungeui Labs 대시보드</Typography>
      <Typography color="text.secondary" paragraph>
        사이트 현황을 한눈에 파악합니다.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">오늘 방문자</Typography>
              <Typography variant="h4">-</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">누적 조회수</Typography>
              <Typography variant="h4">-</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" gutterBottom>바로가기</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant="contained" startIcon={<EditNoteIcon />} onClick={() => navigate('/write')}>
          새 글 쓰기
        </Button>
        <Button variant="outlined" startIcon={<WorkIcon />} onClick={() => navigate('/careers')}>
          경력 추가
        </Button>
      </Box>

      <Typography variant="subtitle1" gutterBottom>최근 활동</Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">최근 글·댓글은 API 연동 후 표시됩니다.</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
