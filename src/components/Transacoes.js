// Transacoes.jsx
import React, { useState, useEffect } from 'react';
import { getTransacoes } from '../supabaseClient';
import { formatarMoeda } from '../utils/formatarNumero';

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('desc');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const trans = await getTransacoes();
    setTransacoes(trans.data || []);
  };

  const getNomeCategoria = (t) => t.categorias?.nome || '—';

  const transacoesFiltradas = [...transacoes]
    .filter(t => filtroTipo === 'todos' ? true : t.tipo === filtroTipo)
    .sort((a, b) => {
      const dA = new Date(a.data_transacao);
      const dB = new Date(b.data_transacao);
      return ordenacao === 'desc' ? dB - dA : dA - dB;
    });

  const btnStyle = (ativo) => ({
    padding: '10px 20px',
    background: ativo ? '#667eea' : '#f5f5f5',
    color: ativo ? 'white' : '#555',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: ativo ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
  });

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .row-appear { animation: fadeIn 0.3s ease-out; }
      `}</style>

      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '25px', fontWeight: '700', color: '#333' }}>
        📋 Movimentações
      </h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button style={btnStyle(filtroTipo === 'todos')} onClick={() => setFiltroTipo('todos')}>Todos</button>
        <button style={btnStyle(filtroTipo === 'entrada')} onClick={() => setFiltroTipo('entrada')}>📥 Entradas</button>
        <button style={btnStyle(filtroTipo === 'saida')} onClick={() => setFiltroTipo('saida')}>📤 Saídas</button>
      </div>

      {transacoesFiltradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', fontSize: '16px', padding: '40px' }}>Nenhuma movimentação registrada</p>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Tipo</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Descrição</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Categoria</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#555' }}>Valor</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#555' }}>Saldo após</th>
                <th onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                  style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555', cursor: 'pointer', userSelect: 'none' }}>
                  Data {ordenacao === 'desc' ? '↓' : '↑'}
                </th>
              </tr>
            </thead>

            <tbody>
              {transacoesFiltradas.map((t, idx) => (
                <tr key={t.id} className="row-appear"
                  style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#ffffff' : '#f8f9fa', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f3f8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}>
                  
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', padding: '5px 10px', borderRadius: '6px', fontWeight: '600', fontSize: '12px', display: 'inline-block' }}>
                      {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#333' }}>{t.descricao}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#667eea' }}>{getNomeCategoria(t)}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', fontSize: '14px', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', textAlign: 'right', fontFamily: 'monospace' }}>
                    {t.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(Math.abs(parseFloat(t.valor)))}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#555', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(parseFloat(t.saldo_apos || 0))}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transacoes;