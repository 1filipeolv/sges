import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Scan, CheckCircle, Clock } from 'lucide-react';

const nomeEq = (item) => item.numero ? `${item.tipo} ${item.numero}` : item.tipo;
const fmt = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const horasAtras = (d) => {
  const h = Math.floor((Date.now() - new Date(d)) / 3600000);
  return h < 1 ? 'Agora' : h === 1 ? '1h' : `${h}h atrás`;
};

export default function Devolucao() {
  const [abertos, setAbertos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [scan, setScan] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmados, setConfirmados] = useState([]);
  const [busca, setBusca] = useState('');
  const scanRef = useRef(null);

  const carregar = () => api('/movimentacoes/abertos').then(setAbertos).catch(() => {});
  useEffect(() => { carregar(); scanRef.current?.focus(); }, []);

  const toggle = (id) => setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const filtrar = (item) => {
    if (!busca) return true;
    const txt = busca.toLowerCase();
    return nomeEq(item).toLowerCase().includes(txt) ||
      (item.patrimonio || '').toLowerCase().includes(txt) ||
      item.pessoa_nome.toLowerCase().includes(txt);
  };

  const toggleAll = () => {
    const filtrados = abertos.filter(filtrar);
    const todos = filtrados.every(e => selecionados.includes(e.item_id));
    if (todos) setSelecionados(prev => prev.filter(id => !filtrados.find(e => e.item_id === id)));
    else {
      const novos = filtrados.map(e => e.item_id).filter(id => !selecionados.includes(id));
      setSelecionados(prev => [...prev, ...novos]);
    }
  };

  // Scanner — busca por patrimônio e seleciona o item
  const handleScan = async (e) => {
    e.preventDefault();
    if (!scan.trim()) return;
    const patrimonio = scan.trim();
    setScan('');
    const item = abertos.find(a => a.patrimonio === patrimonio);
    if (!item) { toast.error('Equipamento não encontrado ou já devolvido'); scanRef.current?.focus(); return; }
    if (selecionados.includes(item.item_id)) { toast.error('Já selecionado'); scanRef.current?.focus(); return; }
    setSelecionados(prev => [...prev, item.item_id]);
    toast.success(`${nomeEq(item)} selecionado`);
    scanRef.current?.focus();
  };

  // Devolução usa item_id — funciona com ou sem patrimônio
  const confirmar = async () => {
    if (selecionados.length === 0) { toast.error('Selecione ao menos um equipamento'); return; }
    setLoading(true);
    const itens = abertos.filter(a => selecionados.includes(a.item_id));
    const sucesso = [];
    const erros = [];

    for (const item of itens) {
      try {
        await api(`/movimentacoes/devolucao/item/${item.item_id}`, { method: 'POST' });
        sucesso.push(item);
      } catch (err) {
        erros.push(`${nomeEq(item)}: ${err.message}`);
      }
    }

    if (sucesso.length > 0) {
      setConfirmados(prev => [...sucesso.map(s => ({ ...s, devolvido_em: new Date() })), ...prev]);
      toast.success(`${sucesso.length} equipamento(s) devolvido(s)!`);
    }
    erros.forEach(e => toast.error(e));
    setSelecionados([]);
    await carregar();
    setLoading(false);
  };

  const filtrados = abertos.filter(filtrar);
  const todosChecked = filtrados.length > 0 && filtrados.every(e => selecionados.includes(e.item_id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Devolução de Equipamentos</h1>
          <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>Selecione os equipamentos que estão voltando</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, maxWidth: 980 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
              Scanner (opcional)
            </div>
            <div style={{
              background: 'rgba(227,6,19,0.04)', border: '2px dashed rgba(227,6,19,0.2)',
              borderRadius: 7, padding: '14px', textAlign: 'center', marginBottom: 10,
            }}>
              <Scan size={22} style={{ color: '#E30613', opacity: 0.5, margin: '0 auto 6px' }} />
              <p style={{ fontSize: 11.5, color: '#A1A1AA' }}>Aponte o scanner para selecionar</p>
            </div>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: 8 }}>
              <input ref={scanRef} value={scan} onChange={e => setScan(e.target.value)}
                placeholder="Aguardando scan..." autoComplete="off" style={{ flex: 1, fontSize: 13 }} />
              <button type="submit" className="btn btn-success" style={{ padding: '8px 12px', fontWeight: 700 }}>OK</button>
            </form>
          </div>

          {selecionados.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
                Devolvendo ({selecionados.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {selecionados.map(id => {
                  const item = abertos.find(a => a.item_id === id);
                  if (!item) return null;
                  return (
                    <div key={id} style={{ padding: '6px 10px', background: 'rgba(22,163,74,0.07)', borderRadius: 6, fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600 }}>{nomeEq(item)}</div>
                      <div style={{ fontSize: 11, color: '#71717A' }}>{item.pessoa_nome}</div>
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-success" onClick={confirmar} disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 13.5 }}>
                <CheckCircle size={15} />
                {loading ? 'Registrando...' : `Confirmar Devolução (${selecionados.length})`}
              </button>
            </div>
          )}

          {confirmados.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
                Devolvidos agora ({confirmados.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {confirmados.map((item, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: '#F4F4F5', borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{nomeEq(item)}</div>
                    <div style={{ fontSize: 11, color: '#A1A1AA' }}>{item.pessoa_nome} • {fmt(item.devolvido_em)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA' }}>
              Equipamentos fora ({abertos.length})
            </div>
            {filtrados.length > 0 && (
              <button onClick={toggleAll} style={{ fontSize: 12, color: '#E30613', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {todosChecked ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            )}
          </div>

          <input placeholder="Buscar por equipamento, patrimônio ou pessoa..." value={busca}
            onChange={e => setBusca(e.target.value)} style={{ marginBottom: 12, fontSize: 13 }} />

          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A1A1AA' }}>
              <CheckCircle size={32} style={{ color: '#16A34A', opacity: 0.35, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13 }}>Nenhum equipamento fora no momento</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 520, overflowY: 'auto' }}>
              {filtrados.map(item => {
                const checked = selecionados.includes(item.item_id);
                const horas = Math.floor((Date.now() - new Date(item.data_retirada)) / 3600000);
                return (
                  <div key={item.item_id} onClick={() => toggle(item.item_id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${checked ? '#16A34A' : '#E4E4E7'}`,
                    background: checked ? 'rgba(22,163,74,0.04)' : '#fff',
                    transition: 'all 0.12s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${checked ? '#16A34A' : '#D4D4D8'}`,
                      background: checked ? '#16A34A' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#09090B' }}>{nomeEq(item)}</div>
                      <div style={{ fontSize: 12, color: '#71717A', marginTop: 2 }}>
                        <strong style={{ color: '#09090B' }}>{item.pessoa_nome}</strong>
                        <span style={{ color: '#A1A1AA' }}> — {item.pessoa_funcao}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>
                        {item.patrimonio
                          ? <span style={{ fontFamily: 'monospace' }}>{item.patrimonio} • </span>
                          : <span>Sem patrimônio • </span>}
                        Retirada: {fmt(item.data_retirada)}
                      </div>
                    </div>
                    <span className={`badge ${horas >= 8 ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: 11, flexShrink: 0 }}>
                      <Clock size={10} />{horasAtras(item.data_retirada)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}