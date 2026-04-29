import { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function Retirada() {
  const [pessoas, setPessoas] = useState([]);
  const [pessoaSelecionada, setPessoaSelecionada] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [itens, setItens] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => {
    api.get('/pessoas').then(r => setPessoas(r.data)).catch(() => {});
    if (scanRef.current) scanRef.current.focus();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    const patrimonio = scanInput.trim();
    if (!patrimonio) return;
    setScanInput('');
    setMensagem(null);

    if (itens.find(i => i.patrimonio === patrimonio)) {
      setMensagem({ type: 'warning', text: `Equipamento ${patrimonio} já está na lista.` });
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/equipamentos/patrimonio/${patrimonio}`);
      const eq = res.data;
      if (eq.status === 'em_uso') {
        setMensagem({ type: 'error', text: `${eq.nome} (${patrimonio}) já está retirado. Devolva antes de retirar novamente.` });
      } else {
        setItens(prev => [...prev, { id: eq.id, patrimonio: eq.patrimonio, nome: eq.nome }]);
        setMensagem({ type: 'success', text: `${eq.nome} adicionado à lista.` });
      }
    } catch {
      setMensagem({ type: 'error', text: `Patrimônio "${patrimonio}" não encontrado.` });
    } finally {
      setLoading(false);
      if (scanRef.current) scanRef.current.focus();
    }
  };

  const removeItem = (patrimonio) => {
    setItens(prev => prev.filter(i => i.patrimonio !== patrimonio));
  };

  const handleSubmit = async () => {
    if (!pessoaSelecionada) { setMensagem({ type: 'error', text: 'Selecione uma pessoa.' }); return; }
    if (itens.length === 0) { setMensagem({ type: 'error', text: 'Adicione pelo menos um equipamento.' }); return; }
    setSubmitting(true);
    setMensagem(null);
    try {
      await api.post('/movimentacoes/retirada', {
        pessoa_id: pessoaSelecionada,
        equipamentos: itens.map(i => i.id),
      });
      setMensagem({ type: 'success', text: `Retirada registrada com sucesso! ${itens.length} equipamento(s).` });
      setItens([]);
      setPessoaSelecionada('');
    } catch (err) {
      setMensagem({ type: 'error', text: err.response?.data?.message || 'Erro ao registrar retirada.' });
    } finally {
      setSubmitting(false);
      if (scanRef.current) scanRef.current.focus();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#0D0D0D', lineHeight: 1 }}>Retirada</div>
        <div style={{ fontSize: 14, color: '#878787', marginTop: 4 }}>Escaneie os equipamentos e selecione a pessoa responsável</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }}>

        {/* Left: Scanner + List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Scanner input */}
          <div style={{
            background: '#0D0D0D', borderRadius: 14, padding: 28,
            border: '2px solid transparent',
            transition: 'border-color 200ms',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 22 }}>📷</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'white' }}>Scanner de Código de Barras</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Aponte o scanner ou digite o patrimônio</div>
              </div>
            </div>
            <form onSubmit={handleScan} style={{ display: 'flex', gap: 10 }}>
              <input
                ref={scanRef}
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder="Patrimônio do equipamento..."
                autoComplete="off"
                style={{
                  flex: 1, height: 48, padding: '0 16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, fontSize: 15,
                  fontFamily: "'Barlow', sans-serif",
                  color: 'white', outline: 'none',
                  letterSpacing: '0.04em',
                  transition: 'border-color 180ms',
                }}
                onFocus={e => e.target.style.borderColor = '#E30613'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <button type="submit" disabled={loading} style={{
                height: 48, padding: '0 24px',
                background: '#E30613', color: 'white',
                border: 'none', borderRadius: 8,
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 700, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: loading ? 0.7 : 1,
                transition: 'all 150ms',
              }}>
                {loading ? <Spinner /> : '+ Adicionar'}
              </button>
            </form>
          </div>

          {/* Mensagem */}
          {mensagem && <Alert type={mensagem.type} text={mensagem.text} onClose={() => setMensagem(null)} />}

          {/* Equipment list */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Equipamentos na lista
              </div>
              {itens.length > 0 && (
                <span style={{ background: '#E30613', color: 'white', fontSize: 12, fontWeight: 700, borderRadius: 99, padding: '2px 10px' }}>
                  {itens.length}
                </span>
              )}
            </div>

            {itens.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#878787' }}>
                <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>📦</div>
                <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: 4 }}>Nenhum equipamento</div>
                <div style={{ fontSize: 13 }}>Escaneie ou digite o patrimônio acima</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    {['#', 'Patrimônio', 'Equipamento', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#878787', borderBottom: '1px solid #F4F4F4' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, i) => (
                    <tr key={item.patrimonio} style={{ borderBottom: '1px solid #F9F9F9' }}>
                      <td style={{ padding: '12px 16px', color: '#878787', fontWeight: 700, fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'monospace', background: '#F4F4F4', padding: '3px 8px', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>{item.patrimonio}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.nome}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => removeItem(item.patrimonio)} style={{
                          background: 'transparent', border: 'none',
                          color: '#878787', cursor: 'pointer', fontSize: 16,
                          padding: '4px 8px', borderRadius: 6,
                          transition: 'all 150ms',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEE8E8'; e.currentTarget.style.color = '#E30613'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#878787'; }}
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Confirm panel */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F4F4F4' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmar Retirada</div>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' }}>Pessoa Responsável</label>
              <select
                value={pessoaSelecionada}
                onChange={e => setPessoaSelecionada(e.target.value)}
                style={{
                  height: 44, padding: '0 14px',
                  border: '1.5px solid #E8E8E8', borderRadius: 8,
                  fontSize: 14, fontFamily: "'Barlow', sans-serif",
                  color: pessoaSelecionada ? '#0D0D0D' : '#878787',
                  background: 'white', outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23878787' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  paddingRight: 36,
                }}
              >
                <option value="">Selecione uma pessoa...</option>
                {pessoas.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} {p.funcao ? `— ${p.funcao}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div style={{ background: '#F9F9F9', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#878787', marginBottom: 12 }}>Resumo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SummaryRow label="Equipamentos" value={itens.length} bold />
                <SummaryRow label="Responsável" value={pessoaSelecionada ? pessoas.find(p => p.id == pessoaSelecionada)?.nome || '–' : '–'} />
                <SummaryRow label="Data/Hora" value={new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || itens.length === 0 || !pessoaSelecionada}
              style={{
                height: 48, width: '100%',
                background: submitting || itens.length === 0 || !pessoaSelecionada ? '#E8E8E8' : '#E30613',
                color: submitting || itens.length === 0 || !pessoaSelecionada ? '#878787' : 'white',
                border: 'none', borderRadius: 8,
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 700, fontSize: 15,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: submitting || itens.length === 0 || !pessoaSelecionada ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 180ms',
              }}
            >
              {submitting ? <><Spinner /> Registrando...</> : '✓ Confirmar Retirada'}
            </button>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#878787' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: '#0D0D0D' }}>{value}</span>
    </div>
  );
}

function Alert({ type, text, onClose }) {
  const styles = {
    success: { background: '#E8F8EF', color: '#1A7A40', border: '1px solid rgba(26,122,64,0.2)', icon: '✓' },
    error: { background: '#FEE8E8', color: '#C00', border: '1px solid rgba(227,6,19,0.2)', icon: '✕' },
    warning: { background: '#FFF3E0', color: '#B35A00', border: '1px solid rgba(179,90,0,0.2)', icon: '⚠' },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{ ...s, borderRadius: 8, padding: '12px 16px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span>{s.icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, opacity: 0.5 }}>✕</button>
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}
