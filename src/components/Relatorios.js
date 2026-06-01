import React, { useState, useEffect } from 'react';
import { getTransacoes, getCaixa } from '../supabaseClient';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [caixa, setCaixa] = useState({ saldo: 0 });
  const [filtro, setFiltro] = useState('recente');

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDados = async () => {
    const [trans, caixaData] = await Promise.all([
      getTransacoes(),
      getCaixa()
    ]);

    setTransacoes(trans.data || []);
    setCaixa(caixaData.data || { saldo: 0 });
  };

  const entradas = transacoes.filter(t => t.tipo === 'entrada');
  const saidas = transacoes.filter(t => t.tipo === 'saida');

  const totalEntradas = entradas.reduce(
    (acc, t) => acc + parseFloat(t.valor),
    0
  );

  const totalSaidas = saidas.reduce(
    (acc, t) => acc + parseFloat(t.valor),
    0
  );

  const saldoCaixa = parseFloat(caixa.saldo || 0);

  const transacoesOrdenadas = [...transacoes].sort((a, b) => {
    const dA = new Date(a.data_transacao);
    const dB = new Date(b.data_transacao);
    return filtro === 'antiga' ? dA - dB : dB - dA;
  });

  const gastosPorCategoria = saidas.reduce((acc, t) => {
    const nomeCategoria = t.categorias?.nome || 'Sem categoria';
    const existing = acc.find(a => a.nome === nomeCategoria);

    if (existing) {
      existing.total += parseFloat(t.valor);
      existing.qtd += 1;
    } else {
      acc.push({
        nome: nomeCategoria,
        total: parseFloat(t.valor),
        qtd: 1
      });
    }

    return acc;
  }, []).sort((a, b) => b.total - a.total);

  const entradasPorCategoria = entradas.reduce((acc, t) => {
    const nomeCategoria = t.categorias?.nome || 'Sem categoria';
    const existing = acc.find(a => a.nome === nomeCategoria);

    if (existing) {
      existing.total += parseFloat(t.valor);
      existing.qtd += 1;
    } else {
      acc.push({
        nome: nomeCategoria,
        total: parseFloat(t.valor),
        qtd: 1
      });
    }

    return acc;
  }, []).sort((a, b) => b.total - a.total);

  const imprimirRelatorio = () => {
    const janela = window.open('', '', 'width=700,height=900');

    janela.document.write(`
      <html>
        <head>
          <title>Relatório Contábil</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; }
            .verde { color: #2f9e44; }
            .vermelho { color: #c92a2a; }
            .azul { color: #667eea; }
          </style>
        </head>
        <body>
          <h1>RELATÓRIO — ${new Date().toLocaleDateString()}</h1>

          <p><b>Saldo:</b> R$ ${saldoCaixa.toFixed(2)}</p>
          <p><b>Entradas:</b> R$ ${totalEntradas.toFixed(2)}</p>
          <p><b>Saídas:</b> R$ ${totalSaidas.toFixed(2)}</p>
          <p><b>Resultado:</b> R$ ${(totalEntradas - totalSaidas).toFixed(2)}</p>

          <script>window.print();</script>
        </body>
      </html>
    `);

    janela.document.close();
  };

  return (
    <div>
      <h2>Relatórios</h2>

      <button onClick={imprimirRelatorio}>
        Imprimir
      </button>

      <h3>Movimentações</h3>

      <div>
        <button onClick={() => setFiltro('recente')}>
          Mais recente
        </button>
        <button onClick={() => setFiltro('antiga')}>
          Mais antiga
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {transacoesOrdenadas.map(t => (
            <tr key={t.id}>
              <td>{t.tipo}</td>
              <td>{t.descricao}</td>
              <td>{t.valor}</td>
              <td>
                {new Date(t.data_transacao).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Relatorios;