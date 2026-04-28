import { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

const TIPOS = ['Notebook', 'Chromebook', 'Tablet', 'Celular', 'Projetor', 'Cabo HDMI', 'Carregador', 'Fone de ouvido', 'Câmera', 'Outro'];

function Modal({ equipamento, onClose, onSave }) {
  const [form, setForm] = useState(equipamento || { patrimonio: '', tipo: '', descricao: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (equipamento?.id) {
        await api(`/equipamentos/${equipamento.id}`, { method: 'PUT', body: form });
        toast.success('Equipamento atualizado');
      } else {
        await api('/equipamentos', { method: 'POST', body: form });
        toast.success('Equipamento cadastrado');
      }
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{equipamento?.id ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Nº Patrimônio *</label>
              <input required value={form.patrimonio} onChange={e => setForm(f => ({ ...f, patrimonio: e.target.value }))} placeholder="Ex: 001234" style={{ fontFamily: 'monospace' }} />
            </div>
            <div className="form-group">
              <label>Tipo *</label>
              <select required value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Selecione...</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Descrição</label>
              <input value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Dell Inspiron 15, Samsung Galaxy A54..." />
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

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [modal, setModal] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  const carregar = () => api('/equipamentos').then(setEquipamentos).catch(() => {});
  useEffect(() => { carregar(); }, []);

  const deletar = async (id) => {
    if (!confirm('Deletar este equipamento?')) return;
    try {
      await api(`/equipamentos/${id}`, { method: 'DELETE' });
      toast.success('Equipamento removido');
      carregar();
    } catch (err) { toast.error(err.message); }
  };

  const filtrados = equipamentos.filter(e => {
    const matchTexto = !filtro || e.patrimonio.toLowerCase().includes(filtro.toLowerCase()) || e.tipo.toLowerCase().includes(filtro.toLowerCase()) || (e.descricao || '').toLowerCase().includes(filtro.toLowerCase());
    const matchStatus = statusFiltro === 'todos' || (statusFiltro === 'disponivel' && e.disponivel) || (statusFiltro === 'fora' && !e.disponivel);
    return matchTexto && matchStatus;
  });

  const disponiveis = equipamentos.filter(e => e.disponivel).length;
  const fora = equipamentos.length - disponiveis;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Equipamentos</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Patrimônio cadastrado no sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Novo Equipamento
        </button>
      </div>

      {/* Contadores */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: `${disponiveis} disponíveis`, cls: 'badge-green', val: 'disponivel' },
          { label: `${fora} fora`, cls: 'badge-red', val: 'fora' },
          { label: `${equipamentos.length} total`, cls: 'badge-blue', val: 'todos' },
        ].map(item => (
          <button
            key={item.val}
            onClick={() => setStatusFiltro(item.val)}
            style={{
              background: statusFiltro === item.val ? (item.val === 'disponivel' ? 'rgba(26,158,92,0.12)' : item.val === 'fora' ? 'rgba(227,6,19,0.08)' : '#F0F0F0') : '#fff',
              border: `1.5px solid ${statusFiltro === item.val ? (item.val === 'disponivel' ? 'rgba(26,158,92,0.3)' : item.val === 'fora' ? 'rgba(227,6,19,0.2)' : '#ddd') : '#EBEBEB'}`,
              borderRadius: 20,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: item.val === 'disponivel' ? '#1A9E5C' : item.val === 'fora' ? '#E30613' : '#555',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Buscar por patrimônio, tipo ou descrição..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>

        {filtrados.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <p style={{ marginTop: 8 }}>Nenhum equipamento encontrado</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patrimônio</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Retirado por</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(eq => (
                  <tr key={eq.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111', background: '#F5F5F5', padding: '2px 8px', borderRadius: 4 }}>
                        {eq.patrimonio}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: '#333' }}>{eq.tipo}</td>
                    <td style={{ fontSize: 13, color: '#888' }}>{eq.descricao || '—'}</td>
                    <td>
                      <span className={`badge ${eq.disponivel ? 'badge-green' : 'badge-red'}`}>
                        {eq.disponivel ? 'Disponível' : 'Fora'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#888' }}>{eq.retirado_por || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setModal(eq)}><Pencil size={13} /></button>
                        {eq.disponivel && (
                          <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => deletar(eq.id)}><Trash2 size={13} /></button>
                        )}
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
          equipamento={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); carregar(); }}
        />
      )}
    </div>
  );
}
