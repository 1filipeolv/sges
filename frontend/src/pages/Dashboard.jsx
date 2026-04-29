import { useEffect, useState } from 'react';
import { api } from '../api';
import { Package, AlertTriangle, ArrowUpFromLine, CheckCircle, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #EBEBEB',
      borderRadius: 10,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 46, height: 46,
        borderRadius: 10,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, color: '#111', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 12.5, color: '#888', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [abertos, setAbertos] = useState([]);

  useEffect(() => {
    api('/movimentacoes/stats').then(setStats).catch(() => {});
    api('/movimentacoes/abertos').then(setAbertos).catch(() => {});
  }, []);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const horasAtras = (d) => {
    const h = Math.floor((Date.now() - new Date(d)) / 3600000);
    if (h < 1) return 'Agora';
    if (h === 1) return '1h atrás';
    return `${h}h atrás`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Dashboard</h1>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard
          icon={CheckCircle} label="Disponíveis"
          value={stats ? stats.total_equipamentos - stats.equipamentos_fora : null}
          color="#1A9E5C" bg="rgba(26,158,92,0.1)"
        />
        <StatCard
          icon={ArrowUpFromLine} label="Equipamentos fora"
          value={stats?.equipamentos_fora}
          color="#E30613" bg="rgba(227,6,19,0.08)"
        />
        <StatCard
          icon={Package} label="Total cadastrado"
          value={stats?.total_equipamentos}
          color="#555" bg="#F2F2F2"
        />
        <StatCard
          icon={AlertTriangle} label="Possíveis atrasos (+8h)"
          value={stats?.possiveis_atrasos}
          color="#D97700" bg="rgba(217,119,0,0.1)"
        />
      </div>

      {/* Tabela de abertos */}
      <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #EBEBEB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Equipamentos fora agora</h2>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Retiradas em aberto</p>
          </div>
          {abertos.length > 0 && (
            <span style={{
              background: 'rgba(227,6,19,0.08)', color: '#E30613',
              borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
            }}>
              {abertos.length} item(ns)
            </span>
          )}
        </div>

        {abertos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <CheckCircle size={40} style={{ color: '#1A9E5C', opacity: 0.4, margin: '0 auto 12px' }} />
            <p style={{ color: '#aaa', fontSize: 14 }}>Nenhum equipamento fora no momento</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patrimônio</th>
                  <th>Tipo</th>
                  <th>Retirado por</th>
                  <th>Função</th>
                  <th>Retirada</th>
                  <th>Operador</th>
                  <th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {abertos.map(item => {
                  const horas = Math.floor((Date.now() - new Date(item.data_retirada)) / 3600000);
                  return (
                    <tr key={item.item_id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111', background: '#F5F5F5', padding: '2px 8px', borderRadius: 4 }}>
                          {item.patrimonio}
                        </span>
                      </td>
                      <td style={{ color: '#333', fontWeight: 500 }}>{item.tipo}</td>
                      <td style={{ color: '#111', fontWeight: 600 }}>{item.pessoa_nome}</td>
                      <td><span className="badge badge-blue">{item.pessoa_funcao}</span></td>
                      <td style={{ fontSize: 13 }}>{formatDate(item.data_retirada)}</td>
                      <td style={{ color: '#aaa', fontSize: 12 }}>{item.operador}</td>
                      <td>
                        <span className={`badge ${horas >= 8 ? 'badge-yellow' : 'badge-green'}`}>
                          <Clock size={10} />
                          {horasAtras(item.data_retirada)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
