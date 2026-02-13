import React, { useState, useEffect } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { Box, Card, TextField, Button, Checkbox, FormControlLabel, Typography, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';

const LOGIN_EXPIRED_KEY = 'login_expired_reason';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);
  const login = useLogin();
  const notify = useNotify();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(LOGIN_EXPIRED_KEY) === 'session_expired') {
        sessionStorage.removeItem(LOGIN_EXPIRED_KEY);
        setExpiredModalOpen(true);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    document.title = '관리자 로그인 | 정의랩';
    return () => {
      document.title = '정의랩 관리자';
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ username: email, password, rememberMe }, '/').catch(() => {
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
            정의랩 관리자
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
            type={showPassword ? 'text' : 'password'}
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
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
            label="로그인 유지 (최대 30일)"
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

      <Dialog open={expiredModalOpen} onClose={() => setExpiredModalOpen(false)} aria-labelledby="login-expired-dialog-title">
        <DialogTitle id="login-expired-dialog-title">로그인 만료</DialogTitle>
        <DialogContent>
          <DialogContentText>로그인이 만료되었습니다. 다시 로그인해 주세요.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpiredModalOpen(false)} color="primary" variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;

