import { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Filter, Clock } from 'lucide-react';

export default function Historico() {
  const [dados, setDados] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ de: '', ate: '', pessoa_id: '', patrimonio: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api(`/movimentacoes/historico?${params}`);
      setDados(res);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    api('/pessoas').then(setPessoas).catch(() => {});
    buscar();
  }, []);

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const duracao = (retirada, devolucao) => {
    if (!devolucao) return null;
    const ms = new Date(devolucao) - new Date(retirada);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Histórico</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Todas as movimentações registradas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Filter size={14} style={{ color: '#E30613' }} />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888' }}>Filtros</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label>De</label>
            <input type="date" value={filtros.de} onChange={e => setFiltros(f => ({ ...f, de: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Até</label>
            <input type="date" value={filtros.ate} onChange={e => setFiltros(f => ({ ...f, ate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Pessoa</label>
            <select value={filtros.pessoa_id} onChange={e => setFiltros(f => ({ ...f, pessoa_id: e.target.value }))}>
              <option value="">Todas</option>
              {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Patrimônio</label>
            <input placeholder="Buscar..." value={filtros.patrimonio} onChange={e => setFiltros(f => ({ ...f, patrimonio: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={buscar} disabled={loading}>
            <Search size={14} />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: '#888' }}>{dados.length} registro(s)</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patrimônio</th>
                <th>Tipo</th>
                <th>Pessoa</th>
                <th>Função</th>
                <th>Retirada</th>
                <th>Devolução</th>
                <th>Duração</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#bbb' }}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : dados.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#111', background: '#F5F5F5', padding: '2px 8px', borderRadius: 4 }}>
                      {item.patrimonio}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: '#333' }}>{item.tipo}</td>
                  <td style={{ color: '#111', fontWeight: 600 }}>{item.pessoa_nome}</td>
                  <td><span className="badge badge-blue">{item.pessoa_funcao}</span></td>
                  <td style={{ fontSize: 12, color: '#555' }}>{formatDate(item.data_retirada)}</td>
                  <td>
                    {item.data_devolucao
                      ? <span className="badge badge-green"><Clock size={10} />{formatDate(item.data_devolucao)}</span>
                      : <span className="badge badge-red">Em uso</span>
                    }
                  </td>
                  <td style={{ fontSize: 12, color: '#888' }}>{duracao(item.data_retirada, item.data_devolucao) || '—'}</td>
                  <td style={{ fontSize: 12, color: '#aaa' }}>{item.operador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
