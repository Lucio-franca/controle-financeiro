import React, { useState, useEffect } from 'react';
import { getTransacoes, getCategorias } from '../supabaseClient';

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [, setCategorias] = useState([]); // <- CORRIGIDO (não usado diretamente)
  const [filtroTipo, setFiltroTipo] = useState('todos');

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

  const transacoesFiltradas =
    filtroTipo === 'todos'
      ? transacoes
      : transacoes.filter(t => t.tipo === filtroTipo);

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2>📋 Movimentações</h2>

      <div>
        <button onClick={() => setFiltroTipo('todos')}>Todos</button>
        <button onClick={() => setFiltroTipo('entrada')}>Entradas</button>
        <button onClick={() => setFiltroTipo('saida')}>Saídas</button>
      </div>

      <table>
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
              <td>R$ {parseFloat(t.valor).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Transacoes;