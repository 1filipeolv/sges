import { useState, useEffect } from 'react';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, CalendarDays, ChevronDown } from 'lucide-react';

function Modal({ onClose, onSave }) {
  const [pessoas, setPessoas] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [form, setForm] = useState({ equipamento_id: '', pessoa_id: '', data: new Date().toISOString().split('T')[0], observacao: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/pessoas').then(setPessoas).catch(() => {});
    api('/equipamentos').then(data => setEquipamentos(data.filter(e => e.disponivel))).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/agendamentos', { method: 'POST', body: form });
      toast.success('Agendamento criado');
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const nomeEq = (eq) => eq.numero ? `${eq.tipo} ${eq.numero}` : eq.patrimonio ? `${eq.tipo} — ${eq.patrimonio}` : eq.tipo;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Novo Agendamento</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Data *</label>
              <input type="date" required value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Pessoa *</label>
              <select required value={form.pessoa_id} onChange={e => setForm(f => ({ ...f, pessoa_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.funcao}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Equipamento *</label>
              <select required value={form.equipamento_id} onChange={e => setForm(f => ({ ...f, equipamento_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{nomeEq(eq)}{eq.patrimonio ? ` (${eq.patrimonio})` : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Observação</label>
              <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Opcional" />
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

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [modal, setModal] = useState(false);

  const carregar = () => api(`/agendamentos?data=${data}`).then(setAgendamentos).catch(() => {});
  useEffect(() => { carregar(); }, [data]);

  const deletar = async (id) => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await api(`/agendamentos/${id}`, { method: 'DELETE' });
      toast.success('Agendamento cancelado');
      carregar();
    } catch (err) { toast.error(err.message); }
  };

  const nomeEq = (a) => a.equipamento_numero ? `${a.equipamento_tipo} ${a.equipamento_numero}` : a.equipamento_patrimonio ? `${a.equipamento_tipo} — ${a.equipamento_patrimonio}` : a.equipamento_tipo;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agendamentos</h1>
          <p style={{ color: '#71717A', fontSize: 13, marginTop: 3 }}>Reservas de equipamentos por dia</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> Novo Agendamento</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <CalendarDays size={16} style={{ color: '#A1A1AA' }} />
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ width: 180 }} />
        {agendamentos.length > 0 && (
          <span style={{ background: 'rgba(217,119,6,0.09)', color: '#D97706', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
            {agendamentos.length} agendamento(s)
          </span>
        )}
      </div>

      <div className="card">
        {agendamentos.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={36} />
            <p style={{ marginTop: 8 }}>Nenhum agendamento para esta data</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Equipamento</th><th>Patrimônio</th><th>Agendado para</th><th>Função</th><th>Registrado por</th><th>Obs.</th><th></th></tr>
              </thead>
              <tbody>
                {agendamentos.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: '#09090B' }}>{nomeEq(a)}</td>
                    <td>
                      {a.equipamento_patrimonio
                        ? <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#F4F4F5', padding: '2px 7px', borderRadius: 4 }}>{a.equipamento_patrimonio}</span>
                        : <span style={{ color: '#A1A1AA' }}>—</span>
                      }
                    </td>
                    <td style={{ fontWeight: 600, color: '#09090B' }}>{a.pessoa_nome}</td>
                    <td><span className="badge badge-blue">{a.pessoa_funcao}</span></td>
                    <td style={{ fontSize: 12, color: '#71717A' }}>{a.operador}</td>
                    <td style={{ fontSize: 12, color: '#71717A' }}>{a.observacao || '—'}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '5px 9px' }} onClick={() => deletar(a.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <Modal onClose={() => setModal(false)} onSave={() => { setModal(false); carregar(); }} />}
    </div>
  );
}