import React, { useState, useEffect } from 'react';
import { logoutUser, getTransacoes } from '../supabaseClient';
import { formatarMoeda } from '../utils/formatarNumero';
import Entradas from '../components/Entradas';
import Saidas from '../components/Saidas';
import Transacoes from '../components/Transacoes';
import Relatorios from '../components/Relatorios';
import Categorias from '../components/Categorias';

function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('painel');
  const [transacoes, setTransacoes] = useState([]);

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDados = async () => {
    const trans = await getTransacoes();
    setTransacoes(trans.data || []);
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.reload();
  };

  const entradas = transacoes.filter(t => t.tipo === 'entrada');
  const saidas = transacoes.filter(t => t.tipo === 'saida');
  const totalEntradas = entradas.reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalSaidas = saidas.reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const saldoCaixa = totalEntradas - totalSaidas;

  const tabs = [
    { key: 'painel', label: '📊 Painel' },
    { key: 'entradas', label: '📥 Entradas' },
    { key: 'saidas', label: '📤 Saídas' },
    { key: 'movimentacoes', label: '📋 Movimentações' },
    { key: 'categorias', label: '🏷️ Categorias' },
    { key: 'relatorios', label: '📈 Relatórios' },
  ];

  const cardNumberStyle = { fontSize: '26px', fontWeight: '700', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '25px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>💼 Financeiro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{user?.email}</p>
            <small style={{ opacity: 0.85, fontSize: '12px' }}>👤 Usuário</small>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>
            🚪 Sair
          </button>
        </div>
      </header>

      <div style={{ padding: '40px 30px', maxWidth: '1400px', margin: '0 auto' }}>

        <nav style={{ display: 'flex', gap: '12px', marginBottom: '35px', flexWrap: 'wrap', background: 'white', padding: '18px 24px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '10px 24px',
              background: activeTab === tab.key ? '#667eea' : '#f5f5f5',
              color: activeTab === tab.key ? 'white' : '#555',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.3s',
              boxShadow: activeTab === tab.key ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
            }} onMouseEnter={(e) => { if (activeTab !== tab.key) e.target.style.background = '#efefef'; }} onMouseLeave={(e) => { if (activeTab !== tab.key) e.target.style.background = '#f5f5f5'; }}>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'painel' && (
          <div>
            <h2 style={{ color: '#333', marginTop: 0, marginBottom: '30px', fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              📊 Painel Principal
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '45px' }}>
              {/* SALDO */}
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '28px 24px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)', transition: 'transform 0.3s, box-shadow 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)'; }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', opacity: 0.95, marginBottom: '16px' }}>💰 Saldo em Caixa</h3>
                </div>
                <div style={cardNumberStyle}>
                  {formatarMoeda(saldoCaixa)}
                </div>
              </div>

              {/* ENTRADAS */}
              <div style={{ background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)', color: 'white', padding: '28px 24px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(81, 207, 102, 0.3)', transition: 'transform 0.3s, box-shadow 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(81, 207, 102, 0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(81, 207, 102, 0.3)'; }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', opacity: 0.95, marginBottom: '16px' }}>📥 Total Entradas</h3>
                </div>
                <div style={cardNumberStyle}>
                  {formatarMoeda(totalEntradas)}
                </div>
              </div>

              {/* SAÍDAS */}
              <div style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', color: 'white', padding: '28px 24px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)', transition: 'transform 0.3s, box-shadow 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 107, 107, 0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.3)'; }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', opacity: 0.95, marginBottom: '16px' }}>📤 Total Saídas</h3>
                </div>
                <div style={cardNumberStyle}>
                  {formatarMoeda(totalSaidas)}
                </div>
              </div>

              {/* RESULTADO */}
              <div style={{ background: 'linear-gradient(135deg, #4ecdc4 0%, #44b7a8 100%)', color: 'white', padding: '28px 24px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)', transition: 'transform 0.3s, box-shadow 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(78, 205, 196, 0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(78, 205, 196, 0.3)'; }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', opacity: 0.95, marginBottom: '16px' }}>📊 Resultado</h3>
                </div>
                <div style={cardNumberStyle}>
                  {formatarMoeda(totalEntradas - totalSaidas)}
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🕐 Últimas Movimentações
              </h3>
              {transacoes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '16px', padding: '40px 20px' }}>Nenhuma movimentação registrada</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: '#495057', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: '#495057', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descrição</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: '#495057', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoria</th>
                        <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#495057', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', color: '#495057', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoes.slice(0, 10).map((t, idx) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #e9ecef', transition: 'background 0.2s', background: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f0f3f8'} onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', padding: '5px 10px', borderRadius: '5px', fontWeight: '600', fontSize: '11px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                              {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px' }}>{t.descricao}</td>
                          <td style={{ padding: '14px 16px', color: '#667eea', fontSize: '14px' }}>{t.categorias?.nome || '—'}</td>
                          <td style={{ padding: '14px 16px', fontWeight: '700', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', textAlign: 'right', fontFamily: "'Courier New', monospace", fontSize: '14px' }}>
                            {t.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(Math.abs(t.valor))}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#6c757d', fontSize: '14px' }}>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'entradas' && <Entradas onUpdate={carregarDados} />}
        {activeTab === 'saidas' && <Saidas onUpdate={carregarDados} />}
        {activeTab === 'movimentacoes' && <Transacoes />}
        {activeTab === 'categorias' && <Categorias />}
        {activeTab === 'relatorios' && <Relatorios />}
      </div>
    </div>
  );
}

export default Dashboard;