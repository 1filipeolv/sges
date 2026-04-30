import { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package, CalendarDays } from 'lucide-react';

function Modal({ equipamento, onClose, onSave }) {
  const [form, setForm] = useState(equipamento || { numero: '', patrimonio: '', tipo: '', descricao: '' });
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
              <label>Tipo *</label>
              <input required value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Ex: Notebook, Projetor..." />
            </div>
            <div className="form-group">
              <label>Número <span style={{ color: '#A1A1AA', fontWeight: 400 }}>(opcional)</span></label>
              <input type="number" min="1" value={form.numero || ''} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="Ex: 1" />
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Patrimônio <span style={{ color: '#A1A1AA', fontWeight: 400 }}>(opcional)</span></label>
              <input value={form.patrimonio || ''} onChange={e => setForm(f => ({ ...f, patrimonio: e.target.value }))} placeholder="Ex: 001234" style={{ fontFamily: 'monospace' }} />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <input value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Dell Inspiron 15" />
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

const nomeEq = (eq) => eq.numero ? `${eq.tipo} ${eq.numero}` : eq.patrimonio ? `${eq.tipo} — ${eq.patrimonio}` : eq.tipo;

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
      toast.success('Removido');
      carregar();
    } catch (err) { toast.error(err.message); }
  };

  const filtrados = equipamentos.filter(e => {
    const txt = filtro.toLowerCase();
    const matchTxt = !filtro ||
      (e.patrimonio || '').toLowerCase().includes(txt) ||
      e.tipo.toLowerCase().includes(txt) ||
      (e.descricao || '').toLowerCase().includes(txt) ||
      (e.numero ? String(e.numero).includes(txt) : false);
    const matchStatus = statusFiltro === 'todos' ||
      (statusFiltro === 'disponivel' && e.disponivel) ||
      (statusFiltro === 'fora' && !e.disponivel);
    return matchTxt && matchStatus;
  });

  const disponiveis = equipamentos.filter(e => e.disponivel).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Equipamentos</h1>
          <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>Patrimônio cadastrado no sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={14} /> Novo Equipamento</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: `${disponiveis} disponíveis`, val: 'disponivel', color: '#16A34A', bg: 'rgba(22,163,74,0.09)' },
          { label: `${equipamentos.length - disponiveis} fora`, val: 'fora', color: '#E30613', bg: 'rgba(227,6,19,0.07)' },
          { label: `${equipamentos.length} total`, val: 'todos', color: '#52525B', bg: '#F0F0F1' },
        ].map(item => (
          <button key={item.val} onClick={() => setStatusFiltro(item.val)} style={{
            background: statusFiltro === item.val ? item.bg : '#fff',
            border: `1.5px solid ${statusFiltro === item.val ? item.color : '#E4E4E7'}`,
            borderRadius: 20, padding: '4px 14px', fontSize: 12.5,
            fontWeight: 600, color: item.color, cursor: 'pointer',
          }}>{item.label}</button>
        ))}
      </div>

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <input placeholder="Buscar por número, patrimônio, tipo ou descrição..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ maxWidth: 380 }} />
        </div>
        {filtrados.length === 0 ? (
          <div className="empty-state"><Package size={36} /><p style={{ marginTop: 8 }}>Nenhum equipamento encontrado</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Equipamento</th><th>Patrimônio</th><th>Descrição</th><th>Status</th><th>Agendado / Retirado por</th><th></th></tr>
              </thead>
              <tbody>
                {filtrados.map(eq => (
                  <tr key={eq.id}>
                    <td style={{ fontWeight: 600, color: '#09090B' }}>{nomeEq(eq)}</td>
                    <td>{eq.patrimonio ? <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#F4F4F5', padding: '2px 7px', borderRadius: 4 }}>{eq.patrimonio}</span> : <span style={{ color: '#A1A1AA' }}>—</span>}</td>
                    <td style={{ fontSize: 13, color: '#71717A' }}>{eq.descricao || '—'}</td>
                    <td><span className={`badge ${eq.disponivel ? 'badge-green' : 'badge-red'}`}>{eq.disponivel ? 'Disponível' : 'Fora'}</span></td>
                    <td style={{ fontSize: 12.5 }}>
                      {eq.agendamento_hoje
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D97706' }}><CalendarDays size={13} />{eq.agendamento_hoje.pessoa_nome}</span>
                        : eq.retirado_por ? <span style={{ color: '#71717A' }}>{eq.retirado_por}</span>
                        : <span style={{ color: '#A1A1AA' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" style={{ padding: '5px 9px' }} onClick={() => setModal(eq)}><Pencil size={13} /></button>
                        {eq.disponivel && <button className="btn btn-danger" style={{ padding: '5px 9px' }} onClick={() => deletar(eq.id)}><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <Modal equipamento={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); carregar(); }} />}
    </div>
  );
}