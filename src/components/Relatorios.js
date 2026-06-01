import React, { useState, useEffect } from 'react';
import { getTransacoes, getCategorias, getCaixa } from '../supabaseClient';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [caixa, setCaixa] = useState({ saldo: 0 });
  const [filtro, setFiltro] = useState('recente');

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarDados = async () => {
    const [trans, cats, caixaData] = await Promise.all([getTransacoes(), getCategorias(), getCaixa()]);
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

  const imprimirRelatorio = () => {
    const janela = window.open('', '', 'width=700,height=900');
    janela.document.write(`
      <html>
        <head>
          <title>Relatório Contábil</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
            .verde { color: #2f9e44; } .vermelho { color: #c92a2a; } .azul { color: #667eea; }
          </style>
        </head>
        <body>
          <h1>📋 RELATÓRIO CONTÁBIL — ${new Date().toLocaleDateString()}</h1>
          <div class="card"><strong>💰 Saldo em Caixa:</strong> <span class="azul">R$ ${saldoCaixa.toFixed(2)}</span></div>
          <div class="card"><strong>📥 Total de Entradas:</strong> <span class="verde">R$ ${totalEntradas.toFixed(2)}</span></div>
          <div class="card"><strong>📤 Total de Saídas:</strong> <span class="vermelho">R$ ${totalSaidas.toFixed(2)}</span></div>
          <div class="card"><strong>📊 Resultado:</strong> R$ ${(totalEntradas - totalSaidas).toFixed(2)}</div>

          <h2>📥 Entradas por Categoria</h2>
          <table>
            <thead><tr><th>Categoria</th><th>Qtd</th><th>Total</th></tr></thead>
            <tbody>${entradasPorCategoria.map(c => `<tr><td>${c.nome}</td><td>${c.qtd}</td><td class="verde">R$ ${c.total.toFixed(2)}</td></tr>`).join('')}</tbody>
          </table>

          <h2>📤 Saídas por Categoria</h2>
          <table>
            <thead><tr><th>Categoria</th><th>Qtd</th><th>Total</th></tr></thead>
            <tbody>${gastosPorCategoria.map(c => `<tr><td>${c.nome}</td><td>${c.qtd}</td><td class="vermelho">R$ ${c.total.toFixed(2)}</td></tr>`).join('')}</tbody>
          </table>

          <h2>📋 Todas as Movimentações</h2>
          <table>
            <thead><tr><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th></tr></thead>
            <tbody>${transacoesOrdenadas.map(t => `
              <tr>
                <td>${t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}</td>
                <td>${t.descricao}</td>
                <td>${t.categorias?.nome || '—'}</td>
                <td class="${t.tipo === 'entrada' ? 'verde' : 'vermelho'}">${t.tipo === 'entrada' ? '+' : '-'} R$ ${parseFloat(t.valor).toFixed(2)}</td>
                <td>${new Date(t.data_transacao).toLocaleDateString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '25px' }}>📋 Relatórios</h2>

      <button onClick={imprimirRelatorio} style={{ padding: '14px 32px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: 'bold' }}>
        🖨️ Imprimir Relatório
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#e8f4fd', padding: '20px', borderRadius: '8px', textAlign: 'center', borderLeft: '4px solid #667eea' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '14px' }}>💰 Saldo em Caixa</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>R$ {saldoCaixa.toFixed(2)}</div>
        </div>
        <div style={{ background: '#d3f9d8', padding: '20px', borderRadius: '8px', textAlign: 'center', borderLeft: '4px solid #2f9e44' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '14px' }}>📥 Total Entradas</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2f9e44' }}>R$ {totalEntradas.toFixed(2)}</div>
        </div>
        <div style={{ background: '#ffe0e0', padding: '20px', borderRadius: '8px', textAlign: 'center', borderLeft: '4px solid #c92a2a' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '14px' }}>📤 Total Saídas</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c92a2a' }}>R$ {totalSaidas.toFixed(2)}</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center', borderLeft: '4px solid #333' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '14px' }}>📊 Resultado</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: totalEntradas - totalSaidas >= 0 ? '#2f9e44' : '#c92a2a' }}>
            R$ {(totalEntradas - totalSaidas).toFixed(2)}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '15px' }}>📥 Entradas por Categoria</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left' }}>Categoria</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Qtd Lançamentos</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {entradasPorCategoria.length === 0 ? (
            <tr><td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Sem dados</td></tr>
          ) : entradasPorCategoria.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{c.nome}</td>
              <td style={{ padding: '12px' }}>{c.qtd}</td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: '#2f9e44' }}>R$ {c.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginBottom: '15px' }}>📤 Saídas por Categoria</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left' }}>Categoria</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Qtd Lançamentos</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {gastosPorCategoria.length === 0 ? (
            <tr><td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Sem dados</td></tr>
          ) : gastosPorCategoria.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{c.nome}</td>
              <td style={{ padding: '12px' }}>{c.qtd}</td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: '#c92a2a' }}>R$ {c.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginBottom: '15px' }}>📋 Todas as Movimentações</h3>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setFiltro('recente')} style={{ padding: '10px 20px', background: filtro === 'recente' ? '#667eea' : '#f5f5f5', color: filtro === 'recente' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⬆️ Mais Recente
        </button>
        <button onClick={() => setFiltro('antiga')} style={{ padding: '10px 20px', background: filtro === 'antiga' ? '#667eea' : '#f5f5f5', color: filtro === 'antiga' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⬇️ Mais Antiga
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Descrição</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Categoria</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Valor</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Saldo após</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Data</th>
          </tr>
        </thead>
        <tbody>
          {transacoesOrdenadas.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>
                <span style={{ background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                  {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{t.descricao}</td>
              <td style={{ padding: '12px', color: '#667eea' }}>{t.categorias?.nome || '—'}</td>
              <td style={{ padding: '12px', fontWeight: 'bold', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a' }}>
                {t.tipo === 'entrada' ? '+' : '-'} R$ {parseFloat(t.valor).toFixed(2)}
              </td>
              <td style={{ padding: '12px', color: '#555' }}>R$ {parseFloat(t.saldo_apos || 0).toFixed(2)}</td>
              <td style={{ padding: '12px' }}>{new Date(t.data_transacao).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Relatorios;