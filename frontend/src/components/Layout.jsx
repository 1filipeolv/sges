import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ArrowUpFromLine, ArrowDownToLine,
  Users, Package, History, LogOut, ShieldCheck
} from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
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
  if (item.divider) return <div style={{ height: 1, background: '#EBEBEB', margin: '8px 8px' }} />;
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 11px',
        borderRadius: '7px',
        textDecoration: 'none',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#E30613' : '#555',
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 232,
        background: '#fff',
        borderRight: '1.5px solid #EBEBEB',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #EBEBEB' }}>
          <img
            src="https://www.sesisp.org.br/images/Logo-SESI-SP.svg"
            alt="SESI SP"
            style={{ height: 30, objectFit: 'contain', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2F2F2' }}>
            <span style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 12,
              letterSpacing: '0.1em', color: '#E30613', textTransform: 'uppercase',
            }}>SGES</span>
            <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>
              Sistema de Gestão de Equipamentos
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
          {nav.map((item, i) => (
            <NavItem key={item.to || i} item={item} user={user} />
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: '#E30613', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{user?.nome?.[0]?.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome}</div>
            <div style={{ fontSize: 10.5, color: '#aaa' }}>{user?.perfil}</div>
          </div>
          <button onClick={handleLogout} title="Sair"
            style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', padding: 5, borderRadius: 5, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E30613'}
            onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '36px 40px', background: '#F5F5F5' }}>
        {children}
      </main>
    </div>
  );
}