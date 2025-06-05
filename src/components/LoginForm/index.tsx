import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Paper, Snackbar, TextField, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { register, handleSubmit, reset } = useForm();
  const [errorOpen, setErrorOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      onLoginSuccess();
    }
  }, [onLoginSuccess]);

  const onSubmit = (data: any) => {
    if (data.username === 'admin' && data.password === 'admin') {
      localStorage.setItem('isLoggedIn', 'true'); 
      setSuccessOpen(true);
      setTimeout(() => onLoginSuccess(), 1000);
    } else {
      setErrorOpen(true);
      reset();
    }
  };

  return (
    <Paper elevation={4} sx={{ padding: 4, borderRadius: 3, textAlign: 'center' }}>
      <LockIcon sx={{ fontSize: 50, color: 'primary.main' }} />
      <Typography variant="h5" gutterBottom>Admin Login</Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Username"
          fullWidth
          {...register('username')}
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          {...register('password')}
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </Box>

      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
        onClose={() => setErrorOpen(false)}
        message="Login or password incorrect"
        ContentProps={{ sx: { backgroundColor: 'error.main' } }}
      />

      <Snackbar
        open={successOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessOpen(false)}
        message="Login successful"
        ContentProps={{ sx: { backgroundColor: 'success.main' } }}
      />
    </Paper>
  );
}
