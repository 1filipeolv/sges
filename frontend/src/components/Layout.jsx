import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ArrowUpFromLine, ArrowDownToLine,
  Users, Package, History, LogOut, ShieldCheck
} from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Painel de Controle' },
  { to: '/retirada', icon: ArrowUpFromLine, label: 'Retirada' },
  { to: '/devolucao', icon: ArrowDownToLine, label: 'Devolução' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { divider: true, adminOnly: true },
  { to: '/pessoas', icon: Users, label: 'Pessoas', adminOnly: true },
  { to: '/equipamentos', icon: Package, label: 'Equipamentos', adminOnly: true },
  { to: '/usuarios', icon: ShieldCheck, label: 'Usuários', adminOnly: true },
];

function NavItem({ item, user }) {
  if (item.adminOnly && user?.perfil !== 'ADMIN') return null;
  if (item.divider) return <div style={{ height: 1, background: '#E4E4E7', margin: '6px 8px' }} />;
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.to === '/'}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#E30613' : '#52525B',
        background: isActive ? 'rgba(227,6,19,0.07)' : 'transparent',
        borderLeft: isActive ? '3px solid #E30613' : '3px solid transparent',
        transition: 'all 0.12s',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <aside style={{
        width: 228,
        background: '#fff',
        borderRight: '1px solid #E4E4E7',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo SESI */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid #E4E4E7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#E30613', padding: '4px 8px', borderRadius: 3 }}>
              <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>SESI</span>
            </div>
            <div style={{ width: 1, height: 22, background: '#E4E4E7' }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Serviço Social</div>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.05em', textTransform: 'uppercase' }}>da Indústria</div>
            </div>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E30613', letterSpacing: '0.06em', textTransform: 'uppercase' }}>SGES</span>
            <div style={{ fontSize: 10.5, color: '#A1A1AA', marginTop: 1 }}>Sistema de Gestão de Equipamentos SESI</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
          {nav.map((item, i) => <NavItem key={item.to || i} item={item} user={user} />)}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, background: '#E30613', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{user?.nome?.[0]?.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#09090B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome}</div>
            <div style={{ fontSize: 10.5, color: '#A1A1AA' }}>{user?.perfil}</div>
          </div>
          <button onClick={handleLogout} title="Sair"
            style={{ background: 'transparent', border: 'none', color: '#D4D4D8', cursor: 'pointer', padding: 4, borderRadius: 5, display: 'flex', transition: 'color 0.14s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E30613'}
            onMouseLeave={e => e.currentTarget.style.color = '#D4D4D8'}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', padding: '32px 36px', background: '#F4F4F5' }}>
        {children}
      </main>
    </div>
  );
}