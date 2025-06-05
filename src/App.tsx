// 📁 src/App.tsx
import { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import LoginForm from './components/LoginForm/index';
import ManipulatorInterface from './components/ManipulatorInterface';

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(loggedIn));
    console.log('ishladi');
    
  }, [loggedIn]);

  return (
    <Container>
      {!loggedIn ? (
        <LoginForm onLoginSuccess={() => setLoggedIn(true)} />
      ) : (
        <ManipulatorInterface onLogout={() => setLoggedIn(false)} />
      )}
    </Container>
  );
}

export default App;
