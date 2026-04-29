import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight } from 'lucide-react';

function SesiLogo({ inverted }) {
  const color = inverted ? '#fff' : '#E30613';
  const textColor = inverted ? 'rgba(255,255,255,0.85)' : '#444';
  const borderColor = inverted ? 'rgba(255,255,255,0.5)' : '#E30613';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        background: color,
        padding: inverted ? '5px 10px' : '5px 10px',
        border: inverted ? '2px solid rgba(255,255,255,0.8)' : 'none',
        borderRadius: 3,
      }}>
        <span style={{
          color: inverted ? '#E30613' : '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: '0.04em',
        }}>SESI</span>
      </div>
      <div style={{ width: 1, height: 28, background: borderColor, opacity: 0.4 }} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: textColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Serviço Social</div>
        <div style={{ fontSize: 9, fontWeight: 600, color: textColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>da Indústria</div>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email, senha } });
      login(token, user);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Painel esquerdo */}
      <div style={{
        width: '44%',
        background: '#E30613',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '44px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', top: -130, right: -130, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', bottom: 40, left: -90, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: 180, right: 30, pointerEvents: 'none' }} />

        <SesiLogo inverted />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 5,
            padding: '3px 11px',
            marginBottom: 18,
          }}>
            <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>SGES</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            Sistema de Gestão de Equipamentos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.65, maxWidth: 290 }}>
            Controle de retirada e devolução com registro em tempo real.
          </p>
        </div>

        <div />
      </div>

      {/* Painel direito */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        background: '#FAFAFA',
      }}>
        <div style={{ width: '100%', maxWidth: 350 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#09090B', marginBottom: 5 }}>Bem-vindo</h2>
            <p style={{ color: '#71717A', fontSize: 13.5 }}>Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#52525B' }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                  style={{ paddingLeft: 36, background: '#fff', borderColor: '#E4E4E7' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#52525B' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA', pointerEvents: 'none' }} />
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
                  style={{ paddingLeft: 36, background: '#fff', borderColor: '#E4E4E7' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              marginTop: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px 20px',
              background: loading ? '#D4D4D8' : '#E30613',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 10px rgba(227,6,19,0.25)',
              transition: 'all 0.14s',
            }}>
              {loading ? 'Entrando...' : <><span>Entrar</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}