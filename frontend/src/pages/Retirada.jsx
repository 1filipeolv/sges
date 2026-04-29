import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Scan, X, CheckCircle, ChevronDown, Package } from 'lucide-react';

export default function Retirada() {
  const [pessoas, setPessoas] = useState([]);
  const [pessoaId, setPessoaId] = useState('');
  const [equipamentos, setEquipamentos] = useState([]);
  const [scan, setScan] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => { api('/pessoas').then(setPessoas).catch(() => {}); }, []);
  useEffect(() => { if (pessoaId && scanRef.current) scanRef.current.focus(); }, [pessoaId]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scan.trim()) return;
    const patrimonio = scan.trim();
    setScan('');

    if (equipamentos.find(e => e.patrimonio === patrimonio)) {
      toast.error('Equipamento já adicionado'); return;
    }

    try {
      const eq = await api(`/equipamentos/scan/${encodeURIComponent(patrimonio)}`);
      if (!eq.disponivel) {
        toast.error(`${eq.patrimonio} já está fora — devolva antes de retirar novamente`); return;
      }
      setEquipamentos(prev => [...prev, eq]);
      toast.success(`${eq.tipo} adicionado`);
    } catch (err) {
      toast.error(err.message);
    }
    scanRef.current?.focus();
  };

  const confirmar = async () => {
    if (!pessoaId) { toast.error('Selecione a pessoa'); return; }
    if (equipamentos.length === 0) { toast.error('Escaneie ao menos um equipamento'); return; }
    setLoading(true);
    try {
      await api('/movimentacoes/retirada', {
        method: 'POST',
        body: { pessoa_id: parseInt(pessoaId), equipamentos_ids: equipamentos.map(e => e.id) },
      });
      setConfirmado(true);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const novaRetirada = () => {
    setPessoaId(''); setEquipamentos([]); setScan(''); setConfirmado(false);
  };

  if (confirmado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'rgba(26,158,92,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={36} style={{ color: '#1A9E5C' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Retirada registrada!</h2>
        <p style={{ color: '#888', fontSize: 14 }}>{equipamentos.length} equipamento(s) retirado(s) com sucesso.</p>
        <button className="btn btn-primary" onClick={novaRetirada} style={{ marginTop: 8 }}>
          Nova Retirada
        </button>
      </div>
    );
  }

  const pessoaSel = pessoas.find(p => String(p.id) === String(pessoaId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Retirada de Equipamentos</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Selecione a pessoa e escaneie os equipamentos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 920 }}>
        {/* Esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pessoa */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', marginBottom: 12 }}>
              01 — Quem está retirando?
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={pessoaId}
                onChange={e => setPessoaId(e.target.value)}
                style={{ appearance: 'none', paddingRight: 36, fontWeight: pessoaId ? 500 : 400 }}
              >
                <option value="">Selecione a pessoa...</option>
                {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.funcao}</option>)}
              </select>
              <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
            </div>

            {pessoaSel && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(227,6,19,0.05)', borderRadius: 7, border: '1px solid rgba(227,6,19,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: '#E30613', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{pessoaSel.nome[0]}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{pessoaSel.nome}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{pessoaSel.funcao}</div>
                </div>
              </div>
            )}
          </div>

          {/* Scanner */}
          <div className="card" style={{ opacity: pessoaId ? 1 : 0.55, pointerEvents: pessoaId ? 'auto' : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', marginBottom: 12 }}>
              02 — Escanear equipamento
            </div>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Scan size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                <input
                  ref={scanRef}
                  value={scan}
                  onChange={e => setScan(e.target.value)}
                  placeholder="Aponte o scanner aqui..."
                  autoComplete="off"
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>+</button>
            </form>
            {!pessoaId && <p style={{ marginTop: 10, fontSize: 12, color: '#bbb' }}>Selecione a pessoa primeiro</p>}
          </div>
        </div>

        {/* Direita — lista */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>03 — Equipamentos</span>
            {equipamentos.length > 0 && (
              <span style={{ background: '#E30613', color: '#fff', borderRadius: 20, padding: '1px 10px', fontSize: 11 }}>
                {equipamentos.length}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {equipamentos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bbb' }}>
                <Scan size={36} style={{ opacity: 0.25, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13 }}>Nenhum equipamento escaneado</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {equipamentos.map((eq, i) => (
                  <div key={eq.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#F8F8F8',
                    borderRadius: 7,
                    border: '1px solid #EBEBEB',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 22, height: 22, background: '#E30613', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111', fontFamily: 'monospace' }}>{eq.patrimonio}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{eq.tipo}{eq.descricao ? ` — ${eq.descricao}` : ''}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEquipamentos(prev => prev.filter(e => e.id !== eq.id))}
                      style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#E30613'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={confirmar}
            disabled={loading || equipamentos.length === 0 || !pessoaId}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, opacity: (equipamentos.length === 0 || !pessoaId) ? 0.5 : 1 }}
          >
            {loading ? 'Registrando...' : `Confirmar Retirada${equipamentos.length > 0 ? ` (${equipamentos.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
