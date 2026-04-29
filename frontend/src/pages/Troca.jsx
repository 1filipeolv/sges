import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Scan, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';

export default function Troca() {
  const [etapa, setEtapa] = useState(1); // 1=scan saida, 2=scan entrada, 3=confirmado
  const [scanSaida, setScanSaida] = useState('');
  const [scanEntrada, setScanEntrada] = useState('');
  const [eqSaida, setEqSaida] = useState(null);
  const [eqEntrada, setEqEntrada] = useState(null);
  const [loading, setLoading] = useState(false);
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  useEffect(() => {
    if (etapa === 1) ref1.current?.focus();
    if (etapa === 2) ref2.current?.focus();
  }, [etapa]);

  const handleSaida = async (e) => {
    e.preventDefault();
    if (!scanSaida.trim()) return;
    try {
      const eq = await api(`/equipamentos/scan/${encodeURIComponent(scanSaida.trim())}`);
      if (eq.disponivel) { toast.error('Este equipamento está disponível — não precisa de troca'); setScanSaida(''); return; }
      setEqSaida(eq);
      setEtapa(2);
    } catch (err) {
      toast.error(err.message);
      setScanSaida('');
    }
  };

  const handleEntrada = async (e) => {
    e.preventDefault();
    if (!scanEntrada.trim()) return;
    if (scanEntrada.trim() === scanSaida.trim()) { toast.error('Scan do mesmo equipamento'); setScanEntrada(''); return; }
    try {
      const eq = await api(`/equipamentos/scan/${encodeURIComponent(scanEntrada.trim())}`);
      if (!eq.disponivel) { toast.error('Substituto também está fora'); setScanEntrada(''); return; }
      setEqEntrada(eq);
    } catch (err) {
      toast.error(err.message);
      setScanEntrada('');
    }
  };

  const confirmar = async () => {
    setLoading(true);
    try {
      await api('/movimentacoes/troca', {
        method: 'POST',
        body: { patrimonio_saida: eqSaida.patrimonio, patrimonio_entrada: eqEntrada.patrimonio },
      });
      setEtapa(3);
      toast.success('Troca realizada!');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const nova = () => {
    setEtapa(1); setScanSaida(''); setScanEntrada('');
    setEqSaida(null); setEqEntrada(null);
  };

  const nomeEq = (eq) => eq?.numero ? `${eq.tipo} ${eq.numero}` : eq?.patrimonio ? `${eq.tipo} — ${eq.patrimonio}` : eq?.tipo;

  if (etapa === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(22,163,74,0.09)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={32} style={{ color: '#16A34A' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Troca realizada!</h2>
        <p style={{ color: '#71717A', fontSize: 13 }}>
          <strong>{nomeEq(eqSaida)}</strong> devolvido → <strong>{nomeEq(eqEntrada)}</strong> retirado
        </p>
        <button className="btn btn-primary" onClick={nova} style={{ marginTop: 8 }}>Nova Troca</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Troca de Equipamento</h1>
          <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>Devolve o com defeito e retira o substituto em uma operação</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Etapa 1 — equipamento com defeito */}
        <div className="card" style={{ opacity: etapa >= 1 ? 1 : 0.4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 12 }}>
            01 — Equipamento com defeito (a devolver)
          </div>

          {eqSaida ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(227,6,19,0.05)', borderRadius: 7, border: '1px solid rgba(227,6,19,0.15)' }}>
              <CheckCircle size={16} style={{ color: '#E30613', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{nomeEq(eqSaida)}</div>
                {eqSaida.patrimonio && <div style={{ fontSize: 11, color: '#A1A1AA', fontFamily: 'monospace' }}>{eqSaida.patrimonio}</div>}
              </div>
              <button onClick={() => { setEqSaida(null); setScanSaida(''); setEqEntrada(null); setScanEntrada(''); setEtapa(1); }}
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer', fontSize: 12 }}>
                Alterar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaida} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Scan size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA' }} />
                <input ref={ref1} value={scanSaida} onChange={e => setScanSaida(e.target.value)} placeholder="Escaneie o equipamento com defeito..." autoComplete="off" style={{ paddingLeft: 34 }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '9px 14px' }}>OK</button>
            </form>
          )}
        </div>

        {/* Seta */}
        {eqSaida && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArrowRight size={20} style={{ color: '#A1A1AA' }} />
          </div>
        )}

        {/* Etapa 2 — substituto */}
        {eqSaida && (
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A1A1AA', marginBottom: 12 }}>
              02 — Equipamento substituto (a retirar)
            </div>

            {eqEntrada ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(22,163,74,0.07)', borderRadius: 7, border: '1px solid rgba(22,163,74,0.2)' }}>
                <CheckCircle size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{nomeEq(eqEntrada)}</div>
                  {eqEntrada.patrimonio && <div style={{ fontSize: 11, color: '#A1A1AA', fontFamily: 'monospace' }}>{eqEntrada.patrimonio}</div>}
                </div>
                <button onClick={() => { setEqEntrada(null); setScanEntrada(''); }}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#A1A1AA', cursor: 'pointer', fontSize: 12 }}>
                  Alterar
                </button>
              </div>
            ) : (
              <form onSubmit={handleEntrada} style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Scan size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA' }} />
                  <input ref={ref2} value={scanEntrada} onChange={e => setScanEntrada(e.target.value)} placeholder="Escaneie o equipamento substituto..." autoComplete="off" style={{ paddingLeft: 34 }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 14px' }}>OK</button>
              </form>
            )}
          </div>
        )}

        {/* Confirmar */}
        {eqSaida && eqEntrada && (
          <button className="btn btn-primary" onClick={confirmar} disabled={loading}
            style={{ justifyContent: 'center', padding: '13px', fontSize: 14 }}>
            <RefreshCw size={15} />
            {loading ? 'Processando...' : `Confirmar Troca — ${nomeEq(eqSaida)} → ${nomeEq(eqEntrada)}`}
          </button>
        )}
      </div>
    </div>
  );
}