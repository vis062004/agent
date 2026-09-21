import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/components/LoginPage';
import { RequestFormPage } from './features/requests/components/RequestFormPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <RequestFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/request" replace />} />
        <Route path="*" element={<Navigate to="/request" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
