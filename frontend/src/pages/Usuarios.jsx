import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ShieldCheck, Shield } from 'lucide-react';

function Modal({ usuario, onClose, onSave }) {
  const [form, setForm] = useState(usuario || { nome: '', email: '', senha: '', perfil: 'OPERADOR' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (usuario?.id) {
        await api(`/auth/usuarios/${usuario.id}`, { method: 'PUT', body: form });
        toast.success('Usuário atualizado');
      } else {
        await api('/auth/usuarios', { method: 'POST', body: form });
        toast.success('Usuário criado');
      }
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{usuario?.id ? 'Editar Usuário' : 'Novo Usuário'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome *</label>
              <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@sesi.com.br" />
            </div>
            <div className="form-group">
              <label>Perfil *</label>
              <select value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
                <option value="OPERADOR">Operador</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{usuario?.id ? 'Nova Senha (vazio = manter atual)' : 'Senha *'}</label>
              <input type="password" value={form.senha || ''} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="••••••••" required={!usuario?.id} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null);
  const { user } = useAuth();

  const carregar = () => api('/auth/usuarios').then(setUsuarios).catch(() => {});
  useEffect(() => { carregar(); }, []);

  const deletar = async (id) => {
    if (!confirm('Deletar este usuário?')) return;
    try {
      await api(`/auth/usuarios/${id}`, { method: 'DELETE' });
      toast.success('Usuário removido');
      carregar();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Usuários do Sistema</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Quem tem acesso ao SGES</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Novo Usuário
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Cadastrado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30,
                        background: u.perfil === 'ADMIN' ? '#E30613' : '#F0F0F0',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: u.perfil === 'ADMIN' ? '#fff' : '#555', fontSize: 12, fontWeight: 700 }}>
                          {u.nome[0]}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>
                          {u.nome}
                          {u.id === user?.id && <span style={{ marginLeft: 6, fontSize: 10, color: '#aaa', fontWeight: 400 }}>(você)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#555' }}>{u.email}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: u.perfil === 'ADMIN' ? 'rgba(227,6,19,0.08)' : '#F0F0F0',
                      color: u.perfil === 'ADMIN' ? '#E30613' : '#555',
                    }}>
                      {u.perfil === 'ADMIN' ? <ShieldCheck size={11} /> : <Shield size={11} />}
                      {u.perfil}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#aaa' }}>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setModal(u)}><Pencil size={13} /></button>
                      {u.id !== user?.id && (
                        <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => deletar(u.id)}><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal
          usuario={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
}
