import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Retirada from './pages/Retirada';
import Devolucao from './pages/Devolucao';
import Historico from './pages/Historico';
import Equipamentos from './pages/Equipamentos';
import Pessoas from './pages/Pessoas';
import Usuarios from './pages/Usuarios';

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F4F4' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '2px solid #E8E8E8', borderTopColor: '#E30613', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ fontSize: 13, color: '#878787', fontFamily: "'Barlow', sans-serif" }}>Carregando...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.perfil !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/retirada" element={<PrivateRoute><Layout><Retirada /></Layout></PrivateRoute>} />
      <Route path="/devolucao" element={<PrivateRoute><Layout><Devolucao /></Layout></PrivateRoute>} />
      <Route path="/historico" element={<PrivateRoute><Layout><Historico /></Layout></PrivateRoute>} />
      <Route path="/equipamentos" element={<PrivateRoute><Layout><Equipamentos /></Layout></PrivateRoute>} />
      <Route path="/pessoas" element={<PrivateRoute><Layout><Pessoas /></Layout></PrivateRoute>} />
      <Route path="/usuarios" element={<PrivateRoute adminOnly><Layout><Usuarios /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
