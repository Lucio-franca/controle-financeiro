import React, { useState, useEffect } from 'react';
import { getTransacoes, getCategorias, getCaixa } from '../supabaseClient';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [, setCategorias] = useState([]); // <- CORRIGIDO (não usado no código)
  const [caixa, setCaixa] = useState({ saldo: 0 });
  const [filtro, setFiltro] = useState('recente');

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDados = async () => {
    const [trans, cats, caixaData] = await Promise.all([
      getTransacoes(),
      getCategorias(),
      getCaixa()
    ]);

    setTransacoes(trans.data || []);
    setCategorias(cats.data || []);
    setCaixa(caixaData.data || { saldo: 0 });
  };

  const entradas = transacoes.filter(t => t.tipo === 'entrada');
  const saidas = transacoes.filter(t => t.tipo === 'saida');

  const totalEntradas = entradas.reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalSaidas = saidas.reduce((acc, t) => acc + parseFloat(t.valor), 0);
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
      acc.push({ nome: nomeCategoria, total: parseFloat(t.valor), qtd: 1 });
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
      acc.push({ nome: nomeCategoria, total: parseFloat(t.valor), qtd: 1 });
    }

    return acc;
  }, []).sort((a, b) => b.total - a.total);

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2>📋 Relatórios</h2>

      <div>
        <p>Saldo: R$ {saldoCaixa.toFixed(2)}</p>
        <p>Entradas: R$ {totalEntradas.toFixed(2)}</p>
        <p>Saídas: R$ {totalSaidas.toFixed(2)}</p>
      </div>

    </div>
  );
}

export default Relatorios;