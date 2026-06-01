import React, { useState, useEffect } from 'react';
import { getTransacoes } from '../supabaseClient';

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const trans = await getTransacoes();
    setTransacoes(trans.data || []);
  };

  const getNomeCategoria = (t) => t.categorias?.nome || '—';

  const transacoesFiltradas =
    filtroTipo === 'todos'
      ? transacoes
      : transacoes.filter((t) => t.tipo === filtroTipo);

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '25px' }}>
        📋 Movimentações
      </h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        {['todos', 'entrada', 'saida'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroTipo(f)}
            style={{
              padding: '10px 20px',
              background: filtroTipo === f ? '#667eea' : '#f5f5f5',
              color: filtroTipo === f ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {f === 'todos'
              ? 'Todos'
              : f === 'entrada'
              ? '📥 Entradas'
              : '📤 Saídas'}
          </button>
        ))}
      </div>

      {transacoesFiltradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', fontSize: '18px', padding: '40px' }}>
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
              <th style={{ padding: '14px', textAlign: 'left' }}>Data</th>
            </tr>
          </thead>

          <tbody>
            {transacoesFiltradas.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '14px' }}>
                  <span
                    style={{
                      background:
                        t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0',
                      color:
                        t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                  </span>
                </td>

                <td style={{ padding: '14px', fontSize: '15px' }}>
                  {t.descricao}
                </td>

                <td style={{ padding: '14px', fontSize: '15px', color: '#667eea' }}>
                  {getNomeCategoria(t)}
                </td>

                <td
                  style={{
                    padding: '14px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    color:
                      t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a',
                  }}
                >
                  {t.tipo === 'entrada' ? '+' : '-'} R${' '}
                  {parseFloat(t.valor).toFixed(2)}
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