import React, { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { Box, Card, TextField, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username: email, password }, '/').catch(() => {
      notify('이메일 또는 비밀번호가 올바르지 않습니다.', { type: 'error' });
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #061F40 0%, #062540 100%)',
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          padding: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 3,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#061F40',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 600,
              color: '#051326',
              marginBottom: 0.5,
            }}
          >
            Jungeui Labs
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            autoComplete="email"
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
            autoComplete="current-password"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="로그인 유지"
            sx={{ marginTop: 1, marginBottom: 2 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              marginTop: 2,
              padding: 1.5,
              backgroundColor: '#061F40',
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#062540',
              },
            }}
          >
            로그인하기
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;

