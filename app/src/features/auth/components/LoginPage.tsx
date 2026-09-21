import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, TextField } from '../../../components/common';
import '../LoginPage.scss';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/request';
    return <Navigate to={redirectTo} replace />;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isValid = login(username, password);
    if (!isValid) {
      setError('Incorrect username or password.');
      return;
    }
    setError(null);
    navigate('/request', { replace: true });
  }

  return (
    <main className="login-page">
      <form className="login-page__card" onSubmit={handleSubmit} noValidate>
        <h1>Sign In</h1>
        <p className="login-page__subtitle">Access Request &amp; Approval System</p>

        {error && (
          <p className="form__error-banner" role="alert">
            {error}
          </p>
        )}

        <TextField
          label="Username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={setUsername}
          required
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />

        <Button type="submit" fullWidth className="login-page__submit">
          Log In
        </Button>
      </form>
    </main>
  );
}
