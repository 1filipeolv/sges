import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Scan, CheckCircle, Clock, User, Package } from 'lucide-react';

export default function Devolucao() {
  const [scan, setScan] = useState('');
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => { scanRef.current?.focus(); }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scan.trim()) return;
    const patrimonio = scan.trim();
    setScan('');
    setLoading(true);
    try {
      const res = await api(`/movimentacoes/devolucao/${encodeURIComponent(patrimonio)}`, { method: 'POST' });
      setResultado(res.equipamento);
      setHistorico(prev => [{ ...res.equipamento, devolvido_em: new Date() }, ...prev.slice(0, 9)]);
      toast.success(`${res.equipamento?.tipo || patrimonio} devolvido!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      scanRef.current?.focus();
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Devolução de Equipamentos</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Passe o scanner no equipamento para registrar a devolução</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, maxWidth: 920 }}>

        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Scanner */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', marginBottom: 14 }}>
              Scanner de devolução
            </div>

            <div style={{
              background: 'rgba(227,6,19,0.04)',
              border: '2px dashed rgba(227,6,19,0.2)',
              borderRadius: 8,
              padding: '20px 16px',
              textAlign: 'center',
              marginBottom: 14,
            }}>
              <Scan size={28} style={{ color: '#E30613', opacity: 0.6, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                Campo ativo — aponte o scanner<br />no código de barras do equipamento
              </p>
            </div>

            <form onSubmit={handleScan} style={{ display: 'flex', gap: 8 }}>
              <input
                ref={scanRef}
                value={scan}
                onChange={e => setScan(e.target.value)}
                placeholder="Aguardando scan..."
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: '10px 14px', fontWeight: 700 }}>
                {loading ? '...' : 'OK'}
              </button>
            </form>
          </div>

          {/* Card do último devolvido */}
          {resultado && (
            <div style={{
              background: '#fff',
              border: '1.5px solid rgba(26,158,92,0.3)',
              borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 2px 12px rgba(26,158,92,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, background: 'rgba(26,158,92,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={15} style={{ color: '#1A9E5C' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#1A9E5C' }}>Devolvido com sucesso</span>
              </div>

              {[
                ['Patrimônio', <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{resultado.patrimonio}</span>],
                ['Tipo', resultado.tipo],
                ['Devolvido por', resultado.pessoa_nome],
                ['Retirada em', formatDate(resultado.data_retirada)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F2F2F2', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{label}</span>
                  <span style={{ color: '#111', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico da sessão */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888' }}>
                Devoluções desta sessão
              </div>
            </div>
            {historico.length > 0 && (
              <span style={{ background: 'rgba(26,158,92,0.1)', color: '#1A9E5C', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 700 }}>
                {historico.length}
              </span>
            )}
          </div>

          {historico.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#bbb' }}>
              <Package size={36} style={{ opacity: 0.25, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13 }}>Nenhuma devolução registrada ainda</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patrimônio</th>
                    <th>Tipo</th>
                    <th>Devolvido por</th>
                    <th>Retirada</th>
                    <th>Devolução</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item, i) => (
                    <tr key={i}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111', background: '#F5F5F5', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{item.patrimonio}</span></td>
                      <td style={{ fontWeight: 500 }}>{item.tipo}</td>
                      <td>{item.pessoa_nome}</td>
                      <td style={{ fontSize: 12, color: '#888' }}>{formatDate(item.data_retirada)}</td>
                      <td><span className="badge badge-green">{formatDate(item.devolvido_em)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
