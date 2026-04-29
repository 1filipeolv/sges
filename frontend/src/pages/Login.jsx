import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight } from 'lucide-react';

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>

      {/* Painel esquerdo */}
      <div style={{
        width: '42%',
        background: '#E30613',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', top: -120, right: -120, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', bottom: 60, left: -80, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: 200, right: 40, pointerEvents: 'none' }} />

        {/* Logo */}
        <img
          src="https://www.sesisp.org.br/images/Logo-SESI-SP.svg"
          alt="SESI SP"
          style={{ height: 34, objectFit: 'contain', objectPosition: 'left', display: 'block', filter: 'brightness(0) invert(1)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />

        {/* Texto */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            padding: '4px 12px',
            marginBottom: 20,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              SGES
            </span>
          </div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
            marginBottom: 14,
          }}>
            Sistema de Gestão de Equipamentos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.6, maxWidth: 300 }}>
            Controle de retirada e devolução com registro em tempo real.
          </p>
        </div>

        {/* sem rodapé */}
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
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 6 }}>
              Bem-vindo
            </h2>
            <p style={{ color: '#888', fontSize: 14 }}>Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={{ paddingLeft: 38, background: '#fff' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required style={{ paddingLeft: 38, background: '#fff' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 24px',
                background: loading ? '#ccc' : '#E30613',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 3px 12px rgba(227,6,19,0.28)',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Entrando...' : <><span>Entrar</span><ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}