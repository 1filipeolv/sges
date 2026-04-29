import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: IconDashboard, exact: true },
  { path: '/retirada', label: 'Retirada', icon: IconRetirada },
  { path: '/devolucao', label: 'Devolução', icon: IconDevolucao },
  { path: '/historico', label: 'Histórico', icon: IconHistorico },
  { divider: true },
  { path: '/equipamentos', label: 'Equipamentos', icon: IconEquipamentos, roles: ['ADMIN', 'OPERADOR'] },
  { path: '/pessoas', label: 'Pessoas', icon: IconPessoas },
  { path: '/usuarios', label: 'Usuários', icon: IconUsuarios, roles: ['ADMIN'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.divider) return true;
    if (!item.roles) return true;
    return item.roles.includes(user?.perfil);
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F4F4' }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: collapsed ? 68 : 260,
        background: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 100,
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 72,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <SesiLogoMark />
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 18, fontWeight: 800,
                color: 'white', textTransform: 'uppercase',
                letterSpacing: '0.04em', lineHeight: 1.1,
              }}>SGES</div>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.35)',
                fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>SESI Equipamentos</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {visibleItems.map((item, idx) => {
            if (item.divider) {
              return <div key={idx} style={{
                height: 1, background: 'rgba(255,255,255,0.07)',
                margin: '8px 16px',
              }} />;
            }
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '10px 0' : '10px 20px',
                  margin: '2px 8px',
                  borderRadius: 8,
                  background: active ? 'rgba(227,6,19,0.15)' : 'transparent',
                  color: active ? '#FF4444' : 'rgba(255,255,255,0.55)',
                  transition: 'all 150ms',
                  cursor: 'pointer',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                    if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: -8, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: 20,
                      background: '#E30613', borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <Icon size={18} />
                  {!collapsed && (
                    <span style={{
                      fontSize: 14, fontWeight: active ? 600 : 500,
                      whiteSpace: 'nowrap',
                    }}>{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 8px' }}>
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginBottom: 4,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(227,6,19,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#FF4444',
                flexShrink: 0,
              }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', truncate: true }}>{user?.username}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user?.perfil}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center',
            gap: 8, padding: collapsed ? '10px 0' : '10px 12px',
            width: '100%', background: 'transparent',
            border: 'none', color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer', borderRadius: 8,
            fontSize: 13, fontFamily: "'Barlow', sans-serif",
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 150ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FF4444'; e.currentTarget.style.background = 'rgba(227,6,19,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <IconLogout size={16} />
            {!collapsed && <span>Sair</span>}
          </button>

          <button onClick={() => setCollapsed(c => !c)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '8px 0',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
            fontSize: 11, gap: 6,
            transition: 'color 150ms',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
          >
            {collapsed ? '→' : '←'} {!collapsed && 'Recolher'}
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? 68 : 260,
        transition: 'margin-left 220ms cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <header style={{
          height: 64,
          background: 'white',
          borderBottom: '1px solid #E8E8E8',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <Breadcrumb path={location.pathname} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#878787',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', background: '#F4F4F4',
              borderRadius: 99,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#22C55E',
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3A3A3A' }}>Online</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

function Breadcrumb({ path }) {
  const MAP = {
    '/': 'Dashboard',
    '/retirada': 'Retirada',
    '/devolucao': 'Devolução',
    '/historico': 'Histórico',
    '/equipamentos': 'Equipamentos',
    '/pessoas': 'Pessoas',
    '/usuarios': 'Usuários',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#878787', fontWeight: 500 }}>SGES</span>
      <span style={{ color: '#E8E8E8' }}>/</span>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 16, fontWeight: 700, color: '#0D0D0D',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>{MAP[path] || 'Página'}</span>
    </div>
  );
}

function SesiLogoMark() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: '#E30613', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fontFamily="'Barlow Condensed', sans-serif" fontWeight="800" fontSize="11" fill="white">SESI</text>
      </svg>
    </div>
  );
}

// ─── Icons ───
function IconDashboard({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconRetirada({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconDevolucao({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function IconHistorico({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IconEquipamentos({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}
function IconPessoas({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconUsuarios({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>;
}
function IconLogout({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
