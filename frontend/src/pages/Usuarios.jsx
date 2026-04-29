import { useState, useEffect } from 'react';
import api from '../api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', perfil: 'OPERADOR' });
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch { setUsuarios([]); }
    finally { setLoading(false); }
  };

  const openNew = () => { setForm({ username: '', password: '', perfil: 'OPERADOR' }); setMensagem(null); setModal('new'); };
  const openEdit = (u) => { setForm({ username: u.username, password: '', perfil: u.perfil }); setMensagem(null); setModal(u); };

  const handleSave = async () => {
    if (!form.username.trim()) { setMensagem({ type: 'error', text: 'Usuário é obrigatório.' }); return; }
    if (modal === 'new' && !form.password.trim()) { setMensagem({ type: 'error', text: 'Senha é obrigatória.' }); return; }
    setSaving(true);
    try {
      const payload = { username: form.username, perfil: form.perfil };
      if (form.password) payload.password = form.password;
      if (modal === 'new') await api.post('/usuarios', payload);
      else await api.put(`/usuarios/${modal.id}`, payload);
      setModal(null);
      fetchData();
    } catch (err) {
      setMensagem({ type: 'error', text: err.response?.data?.message || 'Erro ao salvar.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmar exclusão deste usuário?')) return;
    try { await api.delete(`/usuarios/${id}`); fetchData(); }
    catch (err) { setMensagem({ type: 'error', text: err.response?.data?.message || 'Não foi possível excluir.' }); }
  };

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#0D0D0D', lineHeight: 1 }}>Usuários</div>
          <div style={{ fontSize: 14, color: '#878787', marginTop: 4 }}>Gerenciamento de acesso ao sistema</div>
        </div>
        <button onClick={openNew} style={btnPrimary}>+ Novo Usuário</button>
      </div>

      {mensagem && !modal && (
        <div style={{ ...alertStyle(mensagem.type), marginBottom: 16 }}>
          <span>{mensagem.text}</span>
          <button onClick={() => setMensagem(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5 }}>✕</button>
        </div>
      )}

      {/* Info notice */}
      <div style={{ background: '#EEF4FF', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#1D4ED8' }}>
        <span>ℹ</span>
        <span>Apenas administradores podem gerenciar usuários. Mantenha as credenciais seguras.</span>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #E8E8E8', borderTopColor: '#E30613', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#878787' }}>
            <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>👤</div>
            <div style={{ fontWeight: 600, color: '#3A3A3A', marginBottom: 4 }}>Nenhum usuário</div>
            <button onClick={openNew} style={{ ...btnPrimary, marginTop: 16 }}>+ Novo Usuário</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Usuário', 'Perfil', 'Criado em', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#878787', borderBottom: '1px solid #F4F4F4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F9F9F9', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.perfil === 'ADMIN' ? '#FEE8E8' : '#F4F4F4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                        color: u.perfil === 'ADMIN' ? '#E30613' : '#878787',
                        flexShrink: 0,
                      }}>{u.username?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      padding: '3px 12px', borderRadius: 99,
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: u.perfil === 'ADMIN' ? '#FEE8E8' : '#F4F4F4',
                      color: u.perfil === 'ADMIN' ? '#E30613' : '#878787',
                    }}>{u.perfil}</span>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#878787', fontSize: 13 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '–'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn onClick={() => openEdit(u)} label="✏" />
                      <ActionBtn onClick={() => handleDelete(u.id)} label="🗑" danger />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={modalBox}>
            <div style={modalHead}>
              <span style={modalTitle}>{modal === 'new' ? 'Novo Usuário' : 'Editar Usuário'}</span>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#878787', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mensagem && <div style={alertStyle(mensagem.type)}><span>{mensagem.text}</span></div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={lbl}>Usuário *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Nome de usuário"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#E30613'}
                  onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={lbl}>{modal === 'new' ? 'Senha *' : 'Nova Senha (deixe em branco para manter)'}</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={modal === 'new' ? 'Digite a senha' : '••••••••'}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#E30613'}
                  onBlur={e => e.target.style.borderColor = '#E8E8E8'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={lbl}>Perfil</label>
                <select value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
                  style={{ ...inp, height: 42, appearance: 'none', backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36, cursor: 'pointer' }}>
                  <option value="OPERADOR">OPERADOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 14, fontSize: 13, color: '#878787', display: 'flex', gap: 8 }}>
                <span>ℹ</span>
                <span><strong style={{ color: '#3A3A3A' }}>ADMIN:</strong> acesso total ao sistema. <strong style={{ color: '#3A3A3A' }}>OPERADOR:</strong> retiradas, devoluções e histórico.</span>
              </div>
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
const inp = { height: 42, padding: '0 12px', border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 14, fontFamily: "'Barlow', sans-serif", color: '#0D0D0D', outline: 'none', transition: 'border-color 180ms', background: 'white', width: '100%' };
const lbl = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3A3A3A' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 };
const modalBox = { background: 'white', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' };
const modalHead = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F4F4F4' };
const modalTitle = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' };
const alertStyle = (type) => ({ background: type === 'error' ? '#FEE8E8' : '#E8F8EF', color: type === 'error' ? '#C00' : '#1A7A40', border: `1px solid ${type === 'error' ? 'rgba(227,6,19,0.2)' : 'rgba(26,122,64,0.2)'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 });
const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23878787' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
