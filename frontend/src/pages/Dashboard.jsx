import { useEffect, useState } from 'react';
import { api } from '../api';
import { Package, AlertTriangle, ArrowUpFromLine, CheckCircle, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E4E4E7', borderRadius: 10,
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#09090B', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: '#71717A', marginTop: 3 }}>{label}</div>
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

  const fmt = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const horasAtras = (d) => {
    const h = Math.floor((Date.now() - new Date(d)) / 3600000);
    return h < 1 ? 'Agora' : h === 1 ? '1h atrás' : `${h}h atrás`;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Painel de Controle</h1>
        <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard icon={CheckCircle} label="Disponíveis" value={stats ? stats.total_equipamentos - stats.equipamentos_fora : null} color="#16A34A" bg="rgba(22,163,74,0.09)" />
        <StatCard icon={ArrowUpFromLine} label="Equipamentos fora" value={stats?.equipamentos_fora} color="#E30613" bg="rgba(227,6,19,0.07)" />
        <StatCard icon={Package} label="Total cadastrado" value={stats?.total_equipamentos} color="#71717A" bg="#F4F4F5" />
        <StatCard icon={AlertTriangle} label="Possíveis atrasos (+8h)" value={stats?.possiveis_atrasos} color="#D97706" bg="rgba(217,119,6,0.09)" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Equipamentos fora agora</h2>
            <p style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>Retiradas em aberto</p>
          </div>
          {abertos.length > 0 && (
            <span style={{ background: 'rgba(227,6,19,0.07)', color: '#E30613', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
              {abertos.length}
            </span>
          )}
        </div>

        {abertos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 20px' }}>
            <CheckCircle size={36} style={{ color: '#16A34A', opacity: 0.35, margin: '0 auto 10px' }} />
            <p style={{ color: '#A1A1AA', fontSize: 13 }}>Nenhum equipamento fora no momento</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patrimônio</th><th>Tipo</th><th>Retirado por</th>
                  <th>Função</th><th>Retirada</th><th>Operador</th><th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {abertos.map(item => {
                  const horas = Math.floor((Date.now() - new Date(item.data_retirada)) / 3600000);
                  return (
                    <tr key={item.item_id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#09090B', background: '#F4F4F5', padding: '2px 7px', borderRadius: 4 }}>{item.patrimonio}</span></td>
                      <td style={{ fontWeight: 500, color: '#3F3F46' }}>{item.tipo}</td>
                      <td style={{ fontWeight: 600, color: '#09090B' }}>{item.pessoa_nome}</td>
                      <td><span className="badge badge-blue">{item.pessoa_funcao}</span></td>
                      <td style={{ fontSize: 12 }}>{fmt(item.data_retirada)}</td>
                      <td style={{ fontSize: 12, color: '#A1A1AA' }}>{item.operador}</td>
                      <td><span className={`badge ${horas >= 8 ? 'badge-yellow' : 'badge-green'}`}><Clock size={10} />{horasAtras(item.data_retirada)}</span></td>
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