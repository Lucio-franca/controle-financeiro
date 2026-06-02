import React, { useState, useEffect } from 'react';
import { getTransacoes, getCategorias } from '../supabaseClient';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('desc');

  useEffect(() => {
    carregarDados();
    adicionarEstiloPrint();
  }, []);

  const adicionarEstiloPrint = () => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        * {
          margin: 0;
          padding: 0;
        }
        
        body {
          background: white;
          color: #333;
        }

        /* Ocultar botões e elementos desnecessários */
        .filtros-print,
        button,
        .btn-filtro {
          display: none !important;
        }

        /* Header de impressão */
        .print-header {
          display: block !important;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
        }

        .print-header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }

        .print-header p {
          font-size: 12px;
          color: #666;
        }

        /* Conteúdo principal */
        .relatorio-container {
          background: white;
          padding: 20px;
        }

        /* Cards */
        .cards-resumo {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 20px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .card-resumo {
          border-left: 5px solid !important;
          padding: 15px !important;
          background: white !important;
          border: 1px solid #ddd;
        }

        /* Tabelas */
        table {
          width: 100%;
          margin-bottom: 30px;
          page-break-inside: avoid;
          border-collapse: collapse;
        }

        thead {
          background: #f0f0f0 !important;
          border-bottom: 2px solid #333 !important;
        }

        th {
          padding: 12px !important;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ddd;
        }

        td {
          padding: 10px !important;
          border: 1px solid #ddd;
        }

        tbody tr:nth-child(even) {
          background: #f9f9f9;
        }

        h2, h3 {
          margin-top: 20px;
          margin-bottom: 15px;
          page-break-after: avoid;
          border-bottom: 2px solid #667eea;
          padding-bottom: 8px;
        }

        /* Quebra de página */
        .relatorio-section {
          page-break-inside: avoid;
          margin-bottom: 40px;
        }

        /* Cores em impressão */
        .badge-entrada {
          background: #d3f9d8 !important;
          color: #2f9e44 !important;
        }

        .badge-saida {
          background: #ffe0e0 !important;
          color: #c92a2a !important;
        }

        /* Remover sombras em print */
        * {
          box-shadow: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const carregarDados = async () => {
    const [trans, cats] = await Promise.all([
      getTransacoes(),
      getCategorias()
    ]);
    setTransacoes(trans.data || []);
    setCategorias(cats.data || []);
  };

  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const saldo = totalEntradas - totalSaidas;
  const rendimento = saldo > 0 ? saldo : 0;

  const transacoesFiltradas = [...transacoes]
    .filter(t => filtroTipo === 'todos' ? true : t.tipo === filtroTipo)
    .sort((a, b) => {
      const dA = new Date(a.data_transacao);
      const dB = new Date(b.data_transacao);
      return ordenacao === 'desc' ? dB - dA : dA - dB;
    });

  // Agrupar entradas por categoria
  const entradasPorCategoria = categorias
    .filter(c => c.tipo === 'entrada')
    .map(cat => {
      const total = transacoes
        .filter(t => t.tipo === 'entrada' && t.categoria_id === cat.id)
        .reduce((acc, t) => acc + Number(t.valor), 0);
      const qtd = transacoes.filter(t => t.tipo === 'entrada' && t.categoria_id === cat.id).length;
      return { ...cat, total, qtd };
    });

  // Agrupar saídas por categoria
  const saidasPorCategoria = categorias
    .filter(c => c.tipo === 'saida')
    .map(cat => {
      const total = transacoes
        .filter(t => t.tipo === 'saida' && t.categoria_id === cat.id)
        .reduce((acc, t) => acc + Number(t.valor), 0);
      const qtd = transacoes.filter(t => t.tipo === 'saida' && t.categoria_id === cat.id).length;
      return { ...cat, total, qtd };
    });

  const handleImprimirRelatorio = () => {
    window.print();
  };

  const cardStyle = (bgColor, textColor) => ({
    background: bgColor,
    padding: '20px',
    borderRadius: '8px',
    borderLeft: '5px solid',
    borderColor: textColor,
    color: textColor,
    flex: 1,
    minWidth: '200px'
  });

  const btnStyle = (ativo) => ({
    padding: '10px 20px',
    background: ativo ? '#667eea' : '#ffffff',
    color: ativo ? 'white' : '#333',
    border: ativo ? 'none' : '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: ativo ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none',
    marginRight: '8px'
  });

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }} className="relatorio-container">
      {/* HEADER IMPRESSÃO (visível apenas no print) */}
      <div className="print-header" style={{ display: 'none' }}>
        <h1>📊 Relatório Financeiro</h1>
        <p>Data: {new Date().toLocaleString('pt-BR')}</p>
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', margin: 0 }}>📊 Relatórios</h2>
        <button 
          onClick={handleImprimirRelatorio}
          style={{
            padding: '10px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#5568d3'}
          onMouseLeave={(e) => e.target.style.background = '#667eea'}
        >
          📋 Relatório Analítico
        </button>
      </div>

      {/* CARDS DE RESUMO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '40px' }} className="cards-resumo">
        <div style={cardStyle('#cfe0f8', '#4a5cc7')} className="card-resumo">
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.85 }}>💰 Saldos em Caixa</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>R$ {saldo.toFixed(2)}</div>
        </div>
        <div style={cardStyle('#a8e6c1', '#1b8a4f')} className="card-resumo">
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.85 }}>📈 Total Entradas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>R$ {totalEntradas.toFixed(2)}</div>
        </div>
        <div style={cardStyle('#ffb3ba', '#c92a2a')} className="card-resumo">
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.85 }}>📉 Total Saídas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>R$ {totalSaidas.toFixed(2)}</div>
        </div>
        <div style={cardStyle('#d4d4d4', '#595959')} className="card-resumo">
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.85 }}>💵 Rendimento</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>R$ {rendimento.toFixed(2)}</div>
        </div>
      </div>

      {/* ENTRADAS POR CATEGORIA */}
      <div style={{ marginBottom: '40px' }} className="relatorio-section">
        <h3 style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>📥 Entradas por Categoria</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Categoria</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Qtd Lançamentos</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {entradasPorCategoria.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{cat.nome}</td>
                <td style={{ padding: '12px' }}>{cat.qtd}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2f9e44' }}>R$ {cat.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAÍDAS POR CATEGORIA */}
      <div style={{ marginBottom: '40px' }} className="relatorio-section">
        <h3 style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>📤 Saídas por Categoria</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Categoria</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Qtd Lançamentos</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {saidasPorCategoria.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{cat.nome}</td>
                <td style={{ padding: '12px' }}>{cat.qtd}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#c92a2a' }}>R$ {cat.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TODAS AS MOVIMENTAÇÕES */}
      <div className="relatorio-section">
        <h3 style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>📋 Todas as Movimentações</h3>
        
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }} className="filtros-print">
          <button style={btnStyle(filtroTipo === 'todos')} onClick={() => setFiltroTipo('todos')} className="btn-filtro">Todos</button>
          <button style={btnStyle(filtroTipo === 'entrada')} onClick={() => setFiltroTipo('entrada')} className="btn-filtro">📥 Entradas</button>
          <button style={btnStyle(filtroTipo === 'saida')} onClick={() => setFiltroTipo('saida')} className="btn-filtro">📤 Saídas</button>
        </div>

        {transacoesFiltradas.length === 0 ? (
          <p style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '16px',
            padding: '40px'
          }}>
            Nenhuma movimentação registrada
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
            <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Tipo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Descrição</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Categoria</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Valor</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Saldo após</th>
                <th 
                  onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                  style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Data {ordenacao === 'desc' ? '↓' : '↑'}
                </th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0',
                      color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }} className={t.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida'}>
                      {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{t.descricao}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#667eea' }}>{t.categorias?.nome || '—'}</td>
                  <td style={{
                    padding: '12px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a'
                  }}>
                    {t.tipo === 'entrada' ? '+' : '-'} R$ {Number(t.valor).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>R$ {Number(t.saldo_apos || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{new Date(t.data_transacao).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Relatorios;