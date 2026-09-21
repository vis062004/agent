import { createContext, useContext, useState, type ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'access-request-system:auth';
const HARDCODED_USERNAME = 'admin';
const HARDCODED_PASSWORD = 'admin';

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(AUTH_STORAGE_KEY)
  );

  function login(inputUsername: string, inputPassword: string): boolean {
    const isValid = inputUsername === HARDCODED_USERNAME && inputPassword === HARDCODED_PASSWORD;
    if (isValid) {
      localStorage.setItem(AUTH_STORAGE_KEY, inputUsername);
      setUsername(inputUsername);
    }
    return isValid;
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: username !== null, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
