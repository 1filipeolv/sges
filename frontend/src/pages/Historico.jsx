import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function Historico() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', tipo: '', data_inicio: '', data_fim: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.tipo) params.set('tipo', filters.tipo);
      if (filters.data_inicio) params.set('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.set('data_fim', filters.data_fim);
      params.set('page', page);
      params.set('limit', PER_PAGE);
      const res = await api.get(`/movimentacoes?${params}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setMovimentacoes(data);
      setTotal(res.data.total || data.length);
    } catch {
      setMovimentacoes([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const formatDate = (dt) => {
    if (!dt) return '–';
    return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calcDuration = (retirada, devolucao) => {
    if (!retirada || !devolucao) return null;
    const diff = new Date(devolucao) - new Date(retirada);
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#0D0D0D', lineHeight: 1 }}>Histórico</div>
          <div style={{ fontSize: 14, color: '#878787', marginTop: 4 }}>Todas as movimentações registradas</div>
        </div>
        {total > 0 && (
          <div style={{ fontSize: 13, color: '#878787', fontWeight: 500 }}>
            <span style={{ fontWeight: 700, color: '#0D0D0D' }}>{total}</span> movimentações
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px 180px', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' }}>Buscar</label>
            <input
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              placeholder="Equipamento, pessoa ou patrimônio..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E30613'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' }}>Tipo</label>
            <select value={filters.tipo} onChange={e => updateFilter('tipo', e.target.value)} style={{ ...inputStyle, paddingRight: 36, appearance: 'none', backgroundImage: chevronSvg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', cursor: 'pointer' }}>
              <option value="">Todos</option>
              <option value="retirada">Retirada</option>
              <option value="devolucao">Devolução</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' }}>Data início</label>
            <input type="date" value={filters.data_inicio} onChange={e => updateFilter('data_inicio', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E30613'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' }}>Data fim</label>
            <input type="date" value={filters.data_fim} onChange={e => updateFilter('data_fim', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E30613'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
          </div>
        </div>
        {(filters.search || filters.tipo || filters.data_inicio || filters.data_fim) && (
          <button onClick={() => { setFilters({ search: '', tipo: '', data_inicio: '', data_fim: '' }); setPage(1); }}
            style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#E30613', fontSize: 13, fontWeight: 600, padding: 0 }}>
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #E8E8E8', borderTopColor: '#E30613', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : movimentacoes.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#878787' }}>
            <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: 4 }}>Nenhuma movimentação encontrada</div>
            <div style={{ fontSize: 13 }}>Tente ajustar os filtros ou realize uma retirada</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    {['Patrimônio', 'Equipamento', 'Pessoa', 'Função', 'Retirada', 'Devolução', 'Duração', 'Status'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#878787', borderBottom: '1px solid #F4F4F4', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((m, i) => {
                    const devolvido = !!m.data_devolucao_real;
                    const duration = calcDuration(m.data_retirada, m.data_devolucao_real);
                    return (
                      <tr key={m.id || i} style={{ borderBottom: '1px solid #F9F9F9', transition: 'background 120ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontFamily: 'monospace', background: '#F4F4F4', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                            {m.patrimonio || m.equipamento_patrimonio || '–'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.equipamento_nome || m.nome || '–'}
                        </td>
                        <td style={{ padding: '13px 16px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.pessoa_nome || '–'}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#878787', fontSize: 13 }}>
                          {m.pessoa_funcao || '–'}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#3A3A3A', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {formatDate(m.data_retirada)}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#3A3A3A', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {formatDate(m.data_devolucao_real)}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#878787' }}>
                          {duration || '–'}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            background: devolvido ? '#E8F8EF' : '#FEE8E8',
                            color: devolvido ? '#1A7A40' : '#E30613',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                            {devolvido ? 'Devolvido' : 'Em uso'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#878787' }}>
                  Página {page} de {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <PageBtn label="←" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return <PageBtn key={n} label={n} active={n === page} onClick={() => setPage(n)} />;
                  })}
                  <PageBtn label="→" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PageBtn({ label, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 34, height: 34, border: active ? '1.5px solid #E30613' : '1.5px solid #E8E8E8',
      borderRadius: 6, background: active ? '#E30613' : 'white',
      color: active ? 'white' : disabled ? '#E8E8E8' : '#3A3A3A',
      fontSize: 13, fontWeight: active ? 700 : 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 150ms', fontFamily: "'Barlow', sans-serif",
    }}>{label}</button>
  );
}

const inputStyle = {
  height: 40, padding: '0 12px',
  border: '1.5px solid #E8E8E8',
  borderRadius: 8, fontSize: 14,
  fontFamily: "'Barlow', sans-serif",
  color: '#0D0D0D', outline: 'none',
  transition: 'border-color 180ms',
  background: 'white', width: '100%',
};

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23878787' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
