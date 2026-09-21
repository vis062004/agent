import { useId, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../LoginPage.scss';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const usernameId = useId();
  const passwordId = useId();

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

        <div className="field">
          <label htmlFor={usernameId}>Username</label>
          <input
            id={usernameId}
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor={passwordId}>Password</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="button login-page__submit">
          Log In
        </button>
      </form>
    </main>
  );
}
