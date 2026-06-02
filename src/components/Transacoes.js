import React, { useState, useEffect } from 'react';
import { getTransacoes, getCategorias } from '../supabaseClient';

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('desc');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [trans, cats] = await Promise.all([
      getTransacoes(),
      getCategorias()
    ]);

    setTransacoes(trans.data || []);
    setCategorias(cats.data || []);
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
    padding: '8px 16px',
    background: ativo ? '#667eea' : '#ffffff',
    color: ativo ? 'white' : '#333',
    border: ativo ? 'none' : '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: ativo ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
  });

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '25px' }}>
        📋 Movimentações
      </h2>

      {/* BOTÕES DE FILTRO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <button
          style={btnStyle(filtroTipo === 'todos')}
          onClick={() => setFiltroTipo('todos')}
        >
          Todos
        </button>

        <button
          style={btnStyle(filtroTipo === 'entrada')}
          onClick={() => setFiltroTipo('entrada')}
        >
          📥 Entradas
        </button>

        <button
          style={btnStyle(filtroTipo === 'saida')}
          onClick={() => setFiltroTipo('saida')}
        >
          📤 Saídas
        </button>
      </div>

      {/* LISTA VAZIA */}
      {transacoesFiltradas.length === 0 ? (
        <p style={{
          textAlign: 'center',
          color: '#999',
          fontSize: '18px',
          padding: '40px'
        }}>
          Nenhuma movimentação registrada
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '14px', textAlign: 'left' }}>Tipo</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Descrição</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Categoria</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Valor</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Saldo após</th>
              <th
                onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                style={{ 
                  padding: '14px', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  userSelect: 'none',
                  fontWeight: 'bold'
                }}
              >
                Data {ordenacao === 'desc' ? '↓' : '↑'}
              </th>
            </tr>
          </thead>

          <tbody>
            {transacoesFiltradas.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                
                <td style={{ padding: '14px' }}>
                  <span style={{
                    background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0',
                    color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                  </span>
                </td>

                <td style={{ padding: '14px', fontSize: '15px' }}>
                  {t.descricao}
                </td>

                <td style={{
                  padding: '14px',
                  fontSize: '15px',
                  color: '#667eea'
                }}>
                  {getNomeCategoria(t)}
                </td>

                <td style={{
                  padding: '14px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a'
                }}>
                  {t.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(t.valor).toFixed(2)}
                </td>

                <td style={{ padding: '14px', fontSize: '15px', color: '#555' }}>
                  R$ {parseFloat(t.saldo_apos || 0).toFixed(2)}
                </td>

                <td style={{ padding: '14px', fontSize: '15px' }}>
                  {new Date(t.data_transacao).toLocaleDateString()}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transacoes;