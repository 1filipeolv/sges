import { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

function Modal({ pessoa, onClose, onSave }) {
  const [form, setForm] = useState(pessoa || { nome: '', funcao: '', contato: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (pessoa?.id) {
        await api(`/pessoas/${pessoa.id}`, { method: 'PUT', body: form });
        toast.success('Pessoa atualizada');
      } else {
        await api('/pessoas', { method: 'POST', body: form });
        toast.success('Pessoa cadastrada');
      }
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{pessoa?.id ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome *</label>
              <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Função *</label>
              <input required value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))} placeholder="Ex: Professor, Coordenador..." />
            </div>
            <div className="form-group">
              <label>Contato</label>
              <input value={form.contato || ''} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="Telefone ou email" />
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

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState('');

  const carregar = () => api('/pessoas').then(setPessoas).catch(() => {});
  useEffect(() => { carregar(); }, []);

  const deletar = async (id) => {
    if (!confirm('Deletar esta pessoa?')) return;
    try {
      await api(`/pessoas/${id}`, { method: 'DELETE' });
      toast.success('Pessoa removida');
      carregar();
    } catch (err) { toast.error(err.message); }
  };

  const filtradas = pessoas.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.funcao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pessoas</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Quem pode retirar equipamentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Nova Pessoa
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input placeholder="Buscar por nome ou função..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {filtradas.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p style={{ marginTop: 8 }}>Nenhuma pessoa cadastrada</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Função</th>
                  <th>Contato</th>
                  <th>Cadastrado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, background: 'rgba(227,6,19,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#E30613', fontSize: 12, fontWeight: 700 }}>{p.nome[0]}</span>
                        </div>
                        <span style={{ color: '#111', fontWeight: 600 }}>{p.nome}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{p.funcao}</span></td>
                    <td style={{ fontSize: 13, color: '#888' }}>{p.contato || '—'}</td>
                    <td style={{ fontSize: 12, color: '#aaa' }}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setModal(p)}><Pencil size={13} /></button>
                        <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => deletar(p.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          pessoa={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
}
