import React, { useState } from 'react';
import { loginUser } from '../supabaseClient';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginUser(email, password);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes waveAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-10px); } 
          75% { transform: translateX(10px); } 
        }
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        body {
          animation: waveAnimation 6s ease-in-out infinite;
          background-size: 200% 200%;
        }
        .login-card { animation: slideInUp 0.8s ease-out; }
        .error-shake { animation: shake 0.5s ease-in-out; }
        .loader { 
          width: 16px; 
          height: 16px; 
          border: 3px solid rgba(255,255,255,0.3); 
          border-top: 3px solid white; 
          border-radius: 50%; 
          animation: spin 0.8s linear infinite; 
          display: inline-block; 
        }
        .input-field {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-field:focus {
          border-color: #667eea !important;
          background: rgba(102, 126, 234, 0.1) !important;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.2) !important;
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #0f0c29)', backgroundSize: '200% 200%', animation: 'waveAnimation 8s ease infinite', zIndex: 0 }}></div>

      <div className="login-card" style={{ background: 'rgba(30, 30, 46, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '50px 40px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 10 }}>
        <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '40px', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px', margin: '0 0 40px 0' }}>💼 Financeiro</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com"
              className="input-field"
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                border: '1.5px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '10px', 
                background: 'rgba(102, 126, 234, 0.05)',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required 
            />
            <label style={{ position: 'absolute', left: '16px', top: '-8px', fontSize: '12px', color: '#999', background: 'rgba(30, 30, 46, 0.95)', padding: '0 8px' }}>Email</label>
          </div>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="input-field"
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                border: '1.5px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '10px', 
                background: 'rgba(102, 126, 234, 0.05)',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required 
            />
            <label style={{ position: 'absolute', left: '16px', top: '-8px', fontSize: '12px', color: '#999', background: 'rgba(30, 30, 46, 0.95)', padding: '0 8px' }}>Senha</label>
          </div>

          {error && <div className="error-shake" style={{ background: 'rgba(201, 42, 42, 0.1)', color: '#ff6b6b', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(255, 107, 107, 0.3)', lineHeight: '1.5' }}>❌ {error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: loading ? 'rgba(102, 126, 234, 0.6)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '700', 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: loading ? 0.8 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)'; } }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
          >
            {loading ? <><div className="loader"></div> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '30px' }}>v1.0 • Controle Financeiro</p>
      </div>
    </div>
  );
}

export default Login;