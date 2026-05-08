import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Scan, CheckCircle, ChevronDown, Package, X } from 'lucide-react';

const nomeEq = (eq) => eq.numero ? `${eq.tipo} ${eq.numero}` : eq.patrimonio ? `${eq.tipo} — ${eq.patrimonio}` : eq.tipo;

export default function Retirada() {
  const [pessoas, setPessoas] = useState([]);
  const [pessoaId, setPessoaId] = useState('');
  const [disponiveis, setDisponiveis] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [scan, setScan] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [confirmaveis, setConfirmaveis] = useState([]);
  const [busca, setBusca] = useState('');
  const scanRef = useRef(null);

  useEffect(() => {
    api('/pessoas').then(setPessoas).catch(() => {});
    api('/equipamentos').then(data => setDisponiveis(data.filter(e => e.disponivel))).catch(() => {});
  }, []);

  const toggle = (id) => setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const filtrar = (eq) => {
    if (!busca) return true;
    const txt = busca.toLowerCase();
    return nomeEq(eq).toLowerCase().includes(txt) ||
      (eq.patrimonio || '').toLowerCase().includes(txt) ||
      (eq.descricao || '').toLowerCase().includes(txt);
  };

  const toggleAll = () => {
    const filtrados = disponiveis.filter(filtrar);
    const todos = filtrados.every(e => selecionados.includes(e.id));
    if (todos) setSelecionados(prev => prev.filter(id => !filtrados.find(e => e.id === id)));
    else {
      const novos = filtrados.map(e => e.id).filter(id => !selecionados.includes(id));
      setSelecionados(prev => [...prev, ...novos]);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scan.trim()) return;
    const patrimonio = scan.trim();
    setScan('');
    const eq = disponiveis.find(e => e.patrimonio === patrimonio);
    if (!eq) { toast.error('Equipamento não encontrado ou indisponível'); return; }
    if (selecionados.includes(eq.id)) { toast.error('Já selecionado'); return; }
    setSelecionados(prev => [...prev, eq.id]);
    toast.success(`${nomeEq(eq)} adicionado`);
    scanRef.current?.focus();
  };

  const confirmar = async () => {
    if (!pessoaId) { toast.error('Selecione a pessoa'); return; }
    if (selecionados.length === 0) { toast.error('Selecione ao menos um equipamento'); return; }
    setLoading(true);
    try {
      await api('/movimentacoes/retirada', {
        method: 'POST',
        body: { pessoa_id: parseInt(pessoaId), equipamentos_ids: selecionados },
      });
      setConfirmaveis(disponiveis.filter(e => selecionados.includes(e.id)));
      setConfirmado(true);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const nova = () => {
    setPessoaId(''); setSelecionados([]); setScan(''); setConfirmado(false); setBusca('');
    api('/equipamentos').then(data => setDisponiveis(data.filter(e => e.disponivel))).catch(() => {});
  };

  if (confirmado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(22,163,74,0.09)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={32} style={{ color: '#16A34A' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Retirada registrada!</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320 }}>
          {confirmaveis.map(eq => (
            <div key={eq.id} style={{ background: '#F4F4F5', borderRadius: 7, padding: '8px 14px', fontSize: 13, color: '#52525B', textAlign: 'left' }}>
              {nomeEq(eq)} {eq.patrimonio ? <span style={{ color: '#A1A1AA', fontFamily: 'monospace', fontSize: 11 }}>({eq.patrimonio})</span> : ''}
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={nova} style={{ marginTop: 8 }}>Nova Retirada</button>
      </div>
    );
  }

  const eqFiltrados = disponiveis.filter(filtrar);
  const todosChecked = eqFiltrados.length > 0 && eqFiltrados.every(e => selecionados.includes(e.id));
  const pessoaSel = pessoas.find(p => String(p.id) === String(pessoaId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Retirada de Equipamentos</h1>
          <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>Selecione a pessoa e os equipamentos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, maxWidth: 980 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>01 — Quem está retirando?</div>
            <div style={{ position: 'relative' }}>
              <select value={pessoaId} onChange={e => setPessoaId(e.target.value)} style={{ appearance: 'none', paddingRight: 32 }}>
                <option value="">Selecione...</option>
                {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.funcao}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA', pointerEvents: 'none' }} />
            </div>
            {pessoaSel && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(227,6,19,0.05)', borderRadius: 7, border: '1px solid rgba(227,6,19,0.12)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, background: '#E30613', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{pessoaSel.nome[0]}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{pessoaSel.nome}</div>
                  <div style={{ fontSize: 11, color: '#A1A1AA' }}>{pessoaSel.funcao}</div>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ opacity: pessoaId ? 1 : 0.5, pointerEvents: pessoaId ? 'auto' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>Scanner (opcional)</div>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Scan size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA' }} />
                <input ref={scanRef} value={scan} onChange={e => setScan(e.target.value)} placeholder="Escanear código..." autoComplete="off" style={{ paddingLeft: 30, fontSize: 13 }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px' }}>+</button>
            </form>
          </div>

          {selecionados.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 10 }}>
                Selecionados ({selecionados.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {selecionados.map(id => {
                  const eq = disponiveis.find(e => e.id === id);
                  if (!eq) return null;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#F4F4F5', borderRadius: 6, fontSize: 12.5 }}>
                      <span style={{ fontWeight: 500 }}>{nomeEq(eq)}</span>
                      <button onClick={() => toggle(id)} style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', display: 'flex', padding: 2 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#E30613'}
                        onMouseLeave={e => e.currentTarget.style.color = '#A1A1AA'}>
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-primary" onClick={confirmar} disabled={loading || !pessoaId}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 13.5 }}>
                {loading ? 'Registrando...' : `Confirmar Retirada (${selecionados.length})`}
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA' }}>
              02 — Equipamentos disponíveis ({disponiveis.length})
            </div>
            {eqFiltrados.length > 0 && (
              <button onClick={toggleAll} style={{ fontSize: 12, color: '#E30613', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {todosChecked ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            )}
          </div>

          <input placeholder="Buscar equipamento..." value={busca} onChange={e => setBusca(e.target.value)} style={{ marginBottom: 12, fontSize: 13 }} />

          {eqFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A1A1AA' }}>
              <Package size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13 }}>Nenhum equipamento disponível</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
              {eqFiltrados.map(eq => {
                const checked = selecionados.includes(eq.id);
                const agendado = eq.agendamento_hoje?.pessoa_nome;
                return (
                  <div key={eq.id} onClick={() => toggle(eq.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${checked ? '#E30613' : '#E4E4E7'}`,
                    background: checked ? 'rgba(227,6,19,0.04)' : '#fff',
                    transition: 'all 0.12s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${checked ? '#E30613' : '#D4D4D8'}`,
                      background: checked ? '#E30613' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#09090B' }}>{nomeEq(eq)}</div>
                      <div style={{ fontSize: 11.5, color: '#A1A1AA', marginTop: 1 }}>
                        {eq.patrimonio ? <span style={{ fontFamily: 'monospace' }}>{eq.patrimonio}</span> : 'Sem patrimônio'}
                        {eq.descricao ? ` — ${eq.descricao}` : ''}
                        {agendado ? <span style={{ color: '#D97706', marginLeft: 6 }}>• Agendado: {agendado}</span> : ''}
                      </div>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: 11 }}>Disponível</span>
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