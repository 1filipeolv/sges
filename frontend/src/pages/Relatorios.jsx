import { useState, useEffect } from 'react';
import { api } from '../api';
import { FileDown, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const hoje = new Date().toISOString().split('T')[0];

export default function Relatorios() {
  const [modo, setModo] = useState('dia'); // 'dia' ou 'periodo'
  const [data, setData] = useState(hoje);
  const [de, setDe] = useState(hoje);
  const [ate, setAte] = useState(hoje);
  const [pessoaId, setPessoaId] = useState('');
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api('/pessoas').then(setPessoas).catch(() => {}); }, []);

  const exportar = async () => {
    const inicio = modo === 'dia' ? data : de;
    const fim = modo === 'dia' ? data : ate;
    if (!inicio || !fim) { toast.error('Informe as datas'); return; }
    if (inicio > fim) { toast.error('Data inicial maior que a final'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ de: inicio, ate: fim });
      if (pessoaId) params.append('pessoa_id', pessoaId);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/relatorios/excel?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) { toast.error('Erro ao gerar relatório'); return; }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SGES_Relatorio_${inicio}_${fim}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório exportado!');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>Exportar movimentações em Excel</p>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card">
          {/* Modo */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
              Tipo de relatório
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ val: 'dia', label: 'Dia específico' }, { val: 'periodo', label: 'Período' }].map(m => (
                <button key={m.val} onClick={() => setModo(m.val)} style={{
                  padding: '8px 18px', borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  background: modo === m.val ? '#E30613' : '#fff',
                  color: modo === m.val ? '#fff' : '#52525B',
                  border: `1.5px solid ${modo === m.val ? '#E30613' : '#E4E4E7'}`,
                  boxShadow: modo === m.val ? '0 2px 8px rgba(227,6,19,0.2)' : 'none',
                  transition: 'all 0.14s',
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: 5 }} />
              {modo === 'dia' ? 'Data' : 'Período'}
            </div>
            {modo === 'dia' ? (
              <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ maxWidth: 200 }} />
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="date" value={de} onChange={e => setDe(e.target.value)} style={{ maxWidth: 180 }} />
                <span style={{ color: '#A1A1AA', fontSize: 13 }}>até</span>
                <input type="date" value={ate} onChange={e => setAte(e.target.value)} style={{ maxWidth: 180 }} />
              </div>
            )}
          </div>

          {/* Filtro pessoa */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
              <Filter size={12} style={{ display: 'inline', marginRight: 5 }} />
              Filtrar por pessoa (opcional)
            </div>
            <select value={pessoaId} onChange={e => setPessoaId(e.target.value)} style={{ maxWidth: 320 }}>
              <option value="">Todas as pessoas</option>
              {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.funcao}</option>)}
            </select>
          </div>

          {/* Conteúdo do Excel */}
          <div style={{ background: '#F4F4F5', borderRadius: 8, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#52525B', marginBottom: 8 }}>O arquivo Excel terá 2 abas:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { nome: 'Movimentações', desc: 'Todas as retiradas e devoluções do período com duração' },
                { nome: 'Resumo', desc: 'Equipamentos mais usados e pessoas que mais retiraram' },
              ].map(a => (
                <div key={a.nome} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ background: '#E30613', color: '#fff', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                    {a.nome}
                  </span>
                  <span style={{ fontSize: 12.5, color: '#71717A' }}>{a.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão */}
          <button
            onClick={exportar}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14 }}
          >
            <FileDown size={16} />
            {loading ? 'Gerando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}