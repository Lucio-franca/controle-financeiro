import React, { useState, useEffect } from 'react';
import { getTransacoes } from '../supabaseClient';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const result = await getTransacoes();
    setTransacoes(result.data || []);
  };

  const transacoesFiltradas =
    filtroTipo === 'todos'
      ? transacoes
      : transacoes.filter(t => t.tipo === filtroTipo);

  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const saldo = totalEntradas - totalSaidas;

  const btnStyle = (ativo) => ({
    padding: '10px 20px',
    marginRight: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: ativo ? '#667eea' : '#f5f5f5',
    color: ativo ? 'white' : '#333'
  });

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px' }}>📊 Relatórios</h2>

      <div style={{ marginBottom: 20 }}>
        <button style={btnStyle(filtroTipo === 'todos')} onClick={() => setFiltroTipo('todos')}>Todos</button>
        <button style={btnStyle(filtroTipo === 'entrada')} onClick={() => setFiltroTipo('entrada')}>📥 Entradas</button>
        <button style={btnStyle(filtroTipo === 'saida')} onClick={() => setFiltroTipo('saida')}>📤 Saídas</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p><strong>Total Entradas:</strong> R$ {totalEntradas.toFixed(2)}</p>
        <p><strong>Total Saídas:</strong> R$ {totalSaidas.toFixed(2)}</p>
        <p><strong>Saldo:</strong> R$ {saldo.toFixed(2)}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Descrição</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transacoesFiltradas.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{t.tipo}</td>
              <td style={{ padding: '12px' }}>{t.descricao}</td>
              <td style={{
                padding: '12px',
                fontWeight: 'bold',
                color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a'
              }}>
                R$ {Number(t.valor).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Relatorios;