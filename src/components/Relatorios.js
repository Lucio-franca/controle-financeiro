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

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2>📊 Relatórios</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setFiltroTipo('todos')}>Todos</button>
        <button onClick={() => setFiltroTipo('entrada')}>Entradas</button>
        <button onClick={() => setFiltroTipo('saida')}>Saídas</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p><strong>Total Entradas:</strong> R$ {totalEntradas.toFixed(2)}</p>
        <p><strong>Total Saídas:</strong> R$ {totalSaidas.toFixed(2)}</p>
        <p><strong>Saldo:</strong> R$ {saldo.toFixed(2)}</p>
      </div>

      <table width="100%">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transacoesFiltradas.map(t => (
            <tr key={t.id}>
              <td>{t.tipo}</td>
              <td>{t.descricao}</td>
              <td>R$ {Number(t.valor).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Relatorios;