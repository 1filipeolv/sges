import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Retirada from './pages/Retirada';
import Devolucao from './pages/Devolucao';
import Historico from './pages/Historico';
import Pessoas from './pages/Pessoas';
import Equipamentos from './pages/Equipamentos';
import Usuarios from './pages/Usuarios';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.perfil !== 'ADMIN') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/retirada" element={<ProtectedRoute><Retirada /></ProtectedRoute>} />
      <Route path="/devolucao" element={<ProtectedRoute><Devolucao /></ProtectedRoute>} />
      <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
      <Route path="/pessoas" element={<ProtectedRoute adminOnly><Pessoas /></ProtectedRoute>} />
      <Route path="/equipamentos" element={<ProtectedRoute adminOnly><Equipamentos /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1e29',
              color: '#e8ecf5',
              border: '1px solid #2e3547',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
