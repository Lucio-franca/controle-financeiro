import React, { useState, useEffect } from 'react';
import { logoutUser, getTransacoes, getCaixa } from '../supabaseClient';
import Entradas from '../components/Entradas';
import Saidas from '../components/Saidas';
import Transacoes from '../components/Transacoes';
import Relatorios from '../components/Relatorios';
import Categorias from '../components/Categorias';

function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('painel');
  const [transacoes, setTransacoes] = useState([]);
  const [caixa, setCaixa] = useState({ saldo: 0 });

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDados = async () => {
    const [trans, caixaData] = await Promise.all([getTransacoes(), getCaixa()]);
    setTransacoes(trans.data || []);
    setCaixa(caixaData.data || { saldo: 0 });
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.reload();
  };

  const entradas = transacoes.filter(t => t.tipo === 'entrada');
  const saidas = transacoes.filter(t => t.tipo === 'saida');
  const totalEntradas = entradas.reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalSaidas = saidas.reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const saldoCaixa = parseFloat(caixa.saldo || 0);

  const tabs = [
    { key: 'painel', label: '📊 Painel' },
    { key: 'entradas', label: '📥 Entradas' },
    { key: 'saidas', label: '📤 Saídas' },
    { key: 'movimentacoes', label: '📋 Movimentações' },
    { key: 'categorias', label: '🏷️ Categorias' },
    { key: 'relatorios', label: '📈 Relatórios' },
  ];

  return (
    <div>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white', padding: '20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>💼 Financeiro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{user?.email}</p>
            <small style={{ opacity: 0.9 }}>👤 Usuário</small>
          </div>
          <button onClick={handleLogout} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚪 Sair
          </button>
        </div>
      </header>

      <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>

        <nav style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '12px 20px', background: activeTab === tab.key ? '#667eea' : '#f5f5f5',
              color: activeTab === tab.key ? 'white' : '#333',
              border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px'
            }}>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'painel' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
            <h2 style={{ color: '#667eea', marginTop: 0, fontSize: '26px', marginBottom: '30px' }}>📊 Painel Principal</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>💰 Saldo em Caixa</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>R$ {saldoCaixa.toFixed(2)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #51cf66, #37b24d)', color: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📥 Total Entradas</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>R$ {totalEntradas.toFixed(2)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)', color: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📤 Total Saídas</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>R$ {totalSaidas.toFixed(2)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #4ecdc4, #44b7a8)', color: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📊 Resultado</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>R$ {(totalEntradas - totalSaidas).toFixed(2)}</div>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px' }}>🕐 Últimas Movimentações</h3>
            {transacoes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma movimentação registrada</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <tr>
                    <th style={{ padding: '14px', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '14px', textAlign: 'left' }}>Descrição</th>
                    <th style={{ padding: '14px', textAlign: 'left' }}>Categoria</th>
                    <th style={{ padding: '14px', textAlign: 'left' }}>Valor</th>
                    <th style={{ padding: '14px', textAlign: 'left' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.slice(0, 10).map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                          {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>{t.descricao}</td>
                      <td style={{ padding: '14px', color: '#667eea' }}>{t.categorias?.nome || '—'}</td>
                      <td style={{ padding: '14px', fontWeight: 'bold', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a' }}>
                        {t.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(t.valor).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px' }}>{new Date(t.data_transacao).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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