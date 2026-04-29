import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMovs, setRecentMovs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, movsRes] = await Promise.all([
        api.get('/movimentacoes/stats').catch(() => ({ data: {} })),
        api.get('/movimentacoes?limit=5').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setRecentMovs(Array.isArray(movsRes.data) ? movsRes.data.slice(0, 5) : []);
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  };

  const s = stats || {};

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 32, fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          color: '#0D0D0D',
          lineHeight: 1,
        }}>Dashboard</div>
        <div style={{ fontSize: 14, color: '#878787', marginTop: 4 }}>
          Visão geral do sistema — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <KpiCard
          label="Equipamentos em uso"
          value={loading ? '–' : (s.equipamentos_em_uso ?? 0)}
          icon="📤"
          accent="#E30613"
          trend={s.equipamentos_em_uso > 0 ? 'active' : null}
        />
        <KpiCard
          label="Disponíveis"
          value={loading ? '–' : (s.equipamentos_disponiveis ?? 0)}
          icon="✅"
          accent="#22C55E"
        />
        <KpiCard
          label="Total de equipamentos"
          value={loading ? '–' : (s.total_equipamentos ?? 0)}
          icon="💻"
          accent="#3B82F6"
        />
        <KpiCard
          label="Retiradas hoje"
          value={loading ? '–' : (s.retiradas_hoje ?? 0)}
          icon="📊"
          accent="#F59E0B"
        />
        <KpiCard
          label="Total de pessoas"
          value={loading ? '–' : (s.total_pessoas ?? 0)}
          icon="👥"
          accent="#8B5CF6"
        />
        <KpiCard
          label="Movimentações (mês)"
          value={loading ? '–' : (s.movimentacoes_mes ?? 0)}
          icon="📈"
          accent="#0D0D0D"
        />
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Recent activity */}
        <div style={{
          background: 'white',
          borderRadius: 14,
          border: '1px solid #E8E8E8',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F4F4F4',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>Atividade Recente</div>
              <div style={{ fontSize: 12, color: '#878787', marginTop: 1 }}>Últimas movimentações</div>
            </div>
            <Link to="/historico" style={{
              fontSize: 12, fontWeight: 700, color: '#E30613',
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Ver todas →</Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{
                width: 24, height: 24, border: '2px solid #E8E8E8',
                borderTopColor: '#E30613', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', margin: '0 auto',
              }} />
            </div>
          ) : recentMovs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#878787' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📋</div>
              <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: 4 }}>Nenhuma movimentação</div>
              <div style={{ fontSize: 13 }}>As movimentações aparecerão aqui</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Equipamento', 'Pessoa', 'Tipo', 'Data/Hora'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: '#878787',
                      borderBottom: '1px solid #F4F4F4',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMovs.map((m, i) => (
                  <tr key={m.id || i} style={{ borderBottom: '1px solid #F9F9F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>{m.equipamento_nome || m.patrimonio || '–'}</td>
                    <td style={{ padding: '14px 16px', color: '#3A3A3A' }}>{m.pessoa_nome || '–'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        background: m.tipo === 'retirada' || !m.data_devolucao_real
                          ? '#FEE8E8' : '#E8F8EF',
                        color: m.tipo === 'retirada' || !m.data_devolucao_real
                          ? '#E30613' : '#1A7A40',
                      }}>
                        {m.tipo === 'retirada' || !m.data_devolucao_real ? 'Retirada' : 'Devolução'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#878787', fontSize: 13 }}>
                      {m.data_retirada
                        ? new Date(m.data_retirada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status overview */}
          <div style={{
            background: '#0D0D0D',
            borderRadius: 14,
            padding: 24,
            color: 'white',
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)',
              marginBottom: 16,
            }}>Status do Sistema</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatusRow label="API Backend" status="online" />
              <StatusRow label="Banco de Dados" status="online" />
              <StatusRow label="Scanner" status="standby" />
            </div>

            <div style={{
              marginTop: 20, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ocupação</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Em uso</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {s.total_equipamentos > 0
                      ? Math.round((s.equipamentos_em_uso / s.total_equipamentos) * 100)
                      : 0}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: s.total_equipamentos > 0
                      ? `${(s.equipamentos_em_uso / s.total_equipamentos) * 100}%`
                      : '0%',
                    background: '#E30613',
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{
            background: 'white', borderRadius: 14,
            border: '1px solid #E8E8E8', padding: 20,
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#878787',
              marginBottom: 14,
            }}>Ações Rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { to: '/retirada', label: 'Nova Retirada', icon: '📤', color: '#E30613' },
                { to: '/devolucao', label: 'Registrar Devolução', icon: '📥', color: '#22C55E' },
                { to: '/historico', label: 'Ver Histórico', icon: '📋', color: '#3B82F6' },
              ].map(a => (
                <Link key={a.to} to={a.to} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 8,
                  border: '1.5px solid #F4F4F4',
                  textDecoration: 'none', color: '#0D0D0D',
                  fontSize: 14, fontWeight: 600,
                  transition: 'all 150ms',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = a.color;
                    e.currentTarget.style.background = '#FAFAFA';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#F4F4F4';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  {a.label}
                  <span style={{ marginLeft: 'auto', color: '#E8E8E8' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

function KpiCard({ label, value, icon, accent, trend }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      border: '1px solid #E8E8E8',
      padding: '22px 22px 18px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 180ms',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* accent top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: accent, borderRadius: '14px 14px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {trend === 'active' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: accent,
              animation: 'pulse-dot 1.5s ease infinite',
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ativo</span>
          </div>
        )}
      </div>

      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 44, fontWeight: 800,
        color: '#0D0D0D', lineHeight: 1,
        letterSpacing: '-0.02em',
        marginBottom: 6,
      }}>{value}</div>

      <div style={{ fontSize: 13, color: '#878787', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function StatusRow({ label, status }) {
  const colors = { online: '#22C55E', offline: '#E30613', standby: '#F59E0B' };
  const labels = { online: 'Online', offline: 'Offline', standby: 'Standby' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status] }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: colors[status] }}>{labels[status]}</span>
      </div>
    </div>
  );
}
