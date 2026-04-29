import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Usuário ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0D',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(227,6,19,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(227,6,19,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Red accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '4px',
        background: 'linear-gradient(to bottom, #E30613 40%, transparent)',
      }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <SesiLogo size={48} />
            <div style={{
              width: 1, height: 40,
              background: 'rgba(255,255,255,0.15)',
            }} />
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
              }}>Sistema de Gestão</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: 'white',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>Equipamentos</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            SGES
          </div>
          <div style={{
            width: 48, height: 4,
            background: '#E30613',
            borderRadius: 2,
            marginBottom: 24,
          }} />
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.45)',
            maxWidth: 320,
            lineHeight: 1.6,
          }}>
            Controle completo de retirada e devolução de equipamentos com rastreabilidade total.
          </p>
        </div>

        {/* Stats decorative */}
        <div style={{ marginTop: 60, display: 'flex', gap: 40 }}>
          {[
            { label: 'Controle', value: '100%' },
            { label: 'Rastreável', value: '24/7' },
            { label: 'Scanner', value: 'QR/BAR' },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 24, fontWeight: 800,
                color: 'white', letterSpacing: '-0.02em',
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 56px',
        background: 'white',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 28, fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: '#0D0D0D',
            marginBottom: 6,
          }}>Acesso ao Sistema</h2>
          <p style={{ fontSize: 14, color: '#878787' }}>
            Digite suas credenciais para continuar
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEE8E8', color: '#C00',
            border: '1px solid rgba(227,6,19,0.2)',
            borderRadius: 8, padding: '12px 16px',
            fontSize: 14, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#3A3A3A',
            }}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="Digite seu usuário"
              style={{
                height: 48, padding: '0 16px',
                border: '1.5px solid #E8E8E8',
                borderRadius: 8, fontSize: 15,
                fontFamily: "'Barlow', sans-serif",
                color: '#0D0D0D', outline: 'none',
                transition: 'border-color 180ms',
                background: '#FAFAFA',
              }}
              onFocus={e => e.target.style.borderColor = '#E30613'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#3A3A3A',
            }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                height: 48, padding: '0 16px',
                border: '1.5px solid #E8E8E8',
                borderRadius: 8, fontSize: 15,
                fontFamily: "'Barlow', sans-serif",
                color: '#0D0D0D', outline: 'none',
                transition: 'border-color 180ms',
                background: '#FAFAFA',
              }}
              onFocus={e => e.target.style.borderColor = '#E30613'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 52, width: '100%',
              background: loading ? '#878787' : '#E30613',
              color: 'white', border: 'none',
              borderRadius: 8, fontSize: 15,
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 700, letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              transition: 'all 180ms',
              marginTop: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <p style={{ fontSize: 12, color: '#878787', textAlign: 'center' }}>
            SESI — Serviço Social da Indústria
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

function SesiLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="8" fill="#E30613"/>
      <text x="50%" y="57%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="'Barlow Condensed', sans-serif" fontWeight="800" fontSize="18" fill="white"
        letterSpacing="0">SESI</text>
    </svg>
  );
}
