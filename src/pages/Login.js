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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', borderRadius: '10px', padding: '40px', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: '30px' }}>🏪 Portabilidade</h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }} required />
          </div>

          {error && <div style={{ background: '#ffe0e0', color: '#c92a2a', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>❌ {error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '⏳ Entrando...' : '🚪 Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;