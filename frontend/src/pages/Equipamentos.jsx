import { useState, useEffect } from 'react';
import api from '../api';

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | equipment object
  const [form, setForm] = useState({ nome: '', patrimonio: '', descricao: '', categoria: '' });
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipamentos');
      setEquipamentos(Array.isArray(res.data) ? res.data : []);
    } catch { setEquipamentos([]); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setForm({ nome: '', patrimonio: '', descricao: '', categoria: '' });
    setModal('new');
  };

  const openEdit = (eq) => {
    setForm({ nome: eq.nome, patrimonio: eq.patrimonio, descricao: eq.descricao || '', categoria: eq.categoria || '' });
    setModal(eq);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.patrimonio.trim()) { setMensagem({ type: 'error', text: 'Nome e patrimônio são obrigatórios.' }); return; }
    setSaving(true);
    try {
      if (modal === 'new') {
        await api.post('/equipamentos', form);
      } else {
        await api.put(`/equipamentos/${modal.id}`, form);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      setMensagem({ type: 'error', text: err.response?.data?.message || 'Erro ao salvar.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmar exclusão?')) return;
    try {
      await api.delete(`/equipamentos/${id}`);
      fetchData();
    } catch (err) {
      setMensagem({ type: 'error', text: err.response?.data?.message || 'Não foi possível excluir.' });
    }
  };

  const filtered = equipamentos.filter(e =>
    !search || e.nome?.toLowerCase().includes(search.toLowerCase()) || e.patrimonio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#0D0D0D', lineHeight: 1 }}>Equipamentos</div>
          <div style={{ fontSize: 14, color: '#878787', marginTop: 4 }}>Cadastro e gestão de equipamentos</div>
        </div>
        <button onClick={openNew} style={btnPrimaryStyle}>+ Novo Equipamento</button>
      </div>

      {mensagem && (
        <div style={{ ...alertStyle(mensagem.type), marginBottom: 16 }}>
          <span>{mensagem.type === 'error' ? '✕' : '✓'}</span>
          <span style={{ flex: 1 }}>{mensagem.text}</span>
          <button onClick={() => setMensagem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5 }}>✕</button>
        </div>
      )}

      {/* Search + stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou patrimônio..."
          style={{ ...inputStyle, flex: 1, maxWidth: 360 }}
          onFocus={e => e.target.style.borderColor = '#E30613'}
          onBlur={e => e.target.style.borderColor = '#E8E8E8'}
        />
        <div style={{ fontSize: 13, color: '#878787' }}>
          <span style={{ fontWeight: 700, color: '#0D0D0D' }}>{filtered.length}</span> equipamentos
          {filtered.filter(e => e.status === 'em_uso').length > 0 && (
            <span style={{ marginLeft: 12 }}>
              <span style={{ fontWeight: 700, color: '#E30613' }}>{filtered.filter(e => e.status === 'em_uso').length}</span> em uso
            </span>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #E8E8E8', borderTopColor: '#E30613', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#878787' }}>
            <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>💻</div>
            <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: 4 }}>Nenhum equipamento</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Cadastre o primeiro equipamento</div>
            <button onClick={openNew} style={btnPrimaryStyle}>+ Novo Equipamento</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Patrimônio', 'Nome', 'Categoria', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#878787', borderBottom: '1px solid #F4F4F4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => (
                <tr key={eq.id} style={{ borderBottom: '1px solid #F9F9F9', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: 'monospace', background: '#F4F4F4', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{eq.patrimonio}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 600 }}>{eq.nome}</td>
                  <td style={{ padding: '13px 16px', color: '#878787', fontSize: 13 }}>{eq.categoria || '–'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99,
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: eq.status === 'em_uso' ? '#FEE8E8' : '#E8F8EF',
                      color: eq.status === 'em_uso' ? '#E30613' : '#1A7A40',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      {eq.status === 'em_uso' ? 'Em uso' : 'Disponível'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(eq)} style={btnIconStyle('#3B82F6')}>✏</button>
                      <button onClick={() => handleDelete(eq.id)} style={btnIconStyle('#E30613')}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <span style={modalTitleStyle}>{modal === 'new' ? 'Novo Equipamento' : 'Editar Equipamento'}</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#878787', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mensagem && <div style={alertStyle(mensagem.type)}><span>{mensagem.text}</span></div>}
              <Field label="Nome do Equipamento *" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="Ex: Notebook Dell Inspiron" />
              <Field label="Patrimônio *" value={form.patrimonio} onChange={v => setForm(f => ({ ...f, patrimonio: v }))} placeholder="Ex: 00123456" mono />
              <Field label="Categoria" value={form.categoria} onChange={v => setForm(f => ({ ...f, categoria: v }))} placeholder="Ex: Informática, Audiovisual..." />
              <Field label="Descrição" value={form.descricao} onChange={v => setForm(f => ({ ...f, descricao: v }))} placeholder="Detalhes adicionais..." textarea />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F4F4F4', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModal(null)} style={btnSecondaryStyle}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimaryStyle}>
                {saving ? 'Salvando...' : modal === 'new' ? '+ Criar' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, textarea }) {
  const base = {
    border: '1.5px solid #E8E8E8', borderRadius: 8,
    fontSize: 14, fontFamily: mono ? 'monospace' : "'Barlow', sans-serif",
    color: '#0D0D0D', outline: 'none',
    transition: 'border-color 180ms', background: 'white', width: '100%',
    padding: '0 12px',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...base, padding: '10px 12px', resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = '#E30613'}
            onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...base, height: 42 }}
            onFocus={e => e.target.style.borderColor = '#E30613'}
            onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
      }
    </div>
  );
}

const btnPrimaryStyle = {
  height: 40, padding: '0 20px', background: '#E30613', color: 'white',
  border: 'none', borderRadius: 8, fontFamily: "'Barlow', sans-serif",
  fontWeight: 700, fontSize: 14, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondaryStyle = {
  height: 40, padding: '0 20px', background: 'white', color: '#3A3A3A',
  border: '1.5px solid #E8E8E8', borderRadius: 8, fontFamily: "'Barlow', sans-serif",
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const btnIconStyle = (hoverColor) => ({
  width: 32, height: 32, background: '#F4F4F4', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 14,
  transition: 'all 150ms', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});
const inputStyle = {
  height: 40, padding: '0 12px', border: '1.5px solid #E8E8E8',
  borderRadius: 8, fontSize: 14, fontFamily: "'Barlow', sans-serif",
  color: '#0D0D0D', outline: 'none', transition: 'border-color 180ms',
  background: 'white',
};
const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 1000, padding: 24,
  animation: 'fadeIn 0.15s ease',
};
const modalStyle = {
  background: 'white', borderRadius: 14, width: '100%', maxWidth: 520,
  boxShadow: '0 8px 40px rgba(0,0,0,0.15)', animation: 'slideUp 0.2s ease',
};
const modalHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 24px', borderBottom: '1px solid #F4F4F4',
};
const modalTitleStyle = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
};
const alertStyle = (type) => ({
  background: type === 'error' ? '#FEE8E8' : '#E8F8EF',
  color: type === 'error' ? '#C00' : '#1A7A40',
  border: `1px solid ${type === 'error' ? 'rgba(227,6,19,0.2)' : 'rgba(26,122,64,0.2)'}`,
  borderRadius: 8, padding: '10px 14px', fontSize: 13,
  display: 'flex', alignItems: 'center', gap: 8,
});
