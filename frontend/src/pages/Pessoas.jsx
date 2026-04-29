import { useState, useEffect } from 'react';
import api from '../api';

const FUNCOES = ['Professor', 'Coordenador', 'Diretor', 'Administrativo', 'Técnico', 'Aluno', 'Outro'];

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nome: '', funcao: '', email: '', telefone: '' });
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pessoas');
      setPessoas(Array.isArray(res.data) ? res.data : []);
    } catch { setPessoas([]); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setForm({ nome: '', funcao: '', email: '', telefone: '' });
    setMensagem(null);
    setModal('new');
  };

  const openEdit = (p) => {
    setForm({ nome: p.nome, funcao: p.funcao || '', email: p.email || '', telefone: p.telefone || '' });
    setMensagem(null);
    setModal(p);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { setMensagem({ type: 'error', text: 'Nome é obrigatório.' }); return; }
    setSaving(true);
    try {
      if (modal === 'new') await api.post('/pessoas', form);
      else await api.put(`/pessoas/${modal.id}`, form);
      setModal(null);
      fetchData();
    } catch (err) {
      setMensagem({ type: 'error', text: err.response?.data?.message || 'Erro ao salvar.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmar exclusão?')) return;
    try {
      await api.delete(`/pessoas/${id}`);
      fetchData();
    } catch (err) {
      setMensagem({ type: 'error', text: err.response?.data?.message || 'Não foi possível excluir.' });
    }
  };

  const filtered = pessoas.filter(p =>
    !search || p.nome?.toLowerCase().includes(search.toLowerCase()) || p.funcao?.toLowerCase().includes(search.toLowerCase())
  );

  const funcaoColor = (f) => {
    const map = { Professor: '#3B82F6', Coordenador: '#8B5CF6', Diretor: '#E30613', Administrativo: '#F59E0B', Técnico: '#22C55E', Aluno: '#06B6D4' };
    return map[f] || '#878787';
  };

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#0D0D0D', lineHeight: 1 }}>Pessoas</div>
          <div style={{ fontSize: 14, color: '#878787', marginTop: 4 }}>Cadastro de pessoas autorizadas</div>
        </div>
        <button onClick={openNew} style={btnPrimary}>+ Nova Pessoa</button>
      </div>

      {mensagem && !modal && (
        <div style={{ ...alertBg(mensagem.type), marginBottom: 16 }}>
          <span>{mensagem.text}</span>
          <button onClick={() => setMensagem(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou função..."
          style={{ ...inputBase, flex: 1, maxWidth: 360 }}
          onFocus={e => e.target.style.borderColor = '#E30613'}
          onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
        <div style={{ fontSize: 13, color: '#878787' }}>
          <span style={{ fontWeight: 700, color: '#0D0D0D' }}>{filtered.length}</span> pessoas
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #E8E8E8', borderTopColor: '#E30613', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#878787' }}>
            <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>👥</div>
            <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: 4 }}>Nenhuma pessoa cadastrada</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Cadastre a primeira pessoa</div>
            <button onClick={openNew} style={btnPrimary}>+ Nova Pessoa</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Nome', 'Função', 'E-mail', 'Telefone', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#878787', borderBottom: '1px solid #F4F4F4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F9F9F9', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `${funcaoColor(p.funcao)}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: funcaoColor(p.funcao), flexShrink: 0,
                      }}>{p.nome?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {p.funcao ? (
                      <span style={{
                        padding: '3px 10px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        background: `${funcaoColor(p.funcao)}15`, color: funcaoColor(p.funcao),
                      }}>{p.funcao}</span>
                    ) : <span style={{ color: '#878787', fontSize: 13 }}>–</span>}
                  </td>
                  <td style={{ padding: '13px 16px', color: '#878787', fontSize: 13 }}>{p.email || '–'}</td>
                  <td style={{ padding: '13px 16px', color: '#878787', fontSize: 13 }}>{p.telefone || '–'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn onClick={() => openEdit(p)} label="✏" />
                      <ActionBtn onClick={() => handleDelete(p.id)} label="🗑" danger />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <div style={overlayBase} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={modalBase}>
            <div style={modalHead}>
              <span style={modalTitle}>{modal === 'new' ? 'Nova Pessoa' : 'Editar Pessoa'}</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#878787', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mensagem && <div style={alertBg(mensagem.type)}><span>{mensagem.text}</span></div>}
              <FormField label="Nome Completo *" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="Nome da pessoa" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={labelStyle}>Função</label>
                <select value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))} style={{ ...inputBase, height: 42, appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36, cursor: 'pointer' }}>
                  <option value="">Selecione...</option>
                  {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <FormField label="E-mail" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@sesi.org.br" type="email" />
              <FormField label="Telefone" value={form.telefone} onChange={v => setForm(f => ({ ...f, telefone: v }))} placeholder="(11) 99999-9999" />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F4F4F4', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModal(null)} style={btnSecondary}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>{saving ? 'Salvando...' : modal === 'new' ? '+ Criar' : '✓ Salvar'}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...inputBase, height: 42 }}
        onFocus={e => e.target.style.borderColor = '#E30613'}
        onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
    </div>
  );
}

function ActionBtn({ onClick, label, danger }) {
  return (
    <button onClick={onClick} style={{ width: 32, height: 32, background: '#F4F4F4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, transition: 'all 150ms', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEE8E8' : '#EEF4FF'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#F4F4F4'; }}
    >{label}</button>
  );
}

const btnPrimary = { height: 40, padding: '0 20px', background: '#E30613', color: 'white', border: 'none', borderRadius: 8, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnSecondary = { height: 40, padding: '0 20px', background: 'white', color: '#3A3A3A', border: '1.5px solid #E8E8E8', borderRadius: 8, fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const inputBase = { border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 14, fontFamily: "'Barlow', sans-serif", color: '#0D0D0D', outline: 'none', transition: 'border-color 180ms', background: 'white', padding: '0 12px', width: '100%' };
const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' };
const overlayBase = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 };
const modalBase = { background: 'white', borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' };
const modalHead = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F4F4F4' };
const modalTitle = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' };
const alertBg = (type) => ({ background: type === 'error' ? '#FEE8E8' : '#E8F8EF', color: type === 'error' ? '#C00' : '#1A7A40', border: `1px solid ${type === 'error' ? 'rgba(227,6,19,0.2)' : 'rgba(26,122,64,0.2)'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 });
const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23878787' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
