import React, { useState, useEffect } from 'react';
import { getTransacoes, getCategorias, getFiados } from '../supabaseClient';
import { formatarMoeda } from '../utils/formatarNumero';
import * as XLSX from 'xlsx';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fiados, setFiados] = useState([]);
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
        * { margin: 0; padding: 0; }
        body { background: white; color: #333; }
        .filtros-print, button, .btn-filtro { display: none !important; }
        .print-header { display: block !important; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .print-header h1 { font-size: 28px; margin-bottom: 5px; }
        .relatorio-container { background: white; padding: 20px; }
        table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
        th, td { padding: 10px !important; border: 1px solid #ddd; }
        thead { background: #f0f0f0 !important; }
        h2, h3 { margin-top: 20px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
        .relatorio-section { page-break-inside: avoid; margin-bottom: 40px; }
        * { box-shadow: none !important; max-height: none !important; overflow: visible !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const carregarDados = async () => {
    const [trans, cats, fiadosRes] = await Promise.all([getTransacoes(), getCategorias(), getFiados()]);
    setTransacoes(trans.data || []);
    setCategorias(cats.data || []);
    setFiados(fiadosRes.data || []);
  };

  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;
  const rendimento = saldo > 0 ? saldo : 0;

  const fiadosPendentes = fiados.filter(f => !f.pago);
  const fiadosPagos = fiados.filter(f => f.pago);
  const totalFiadoPendente = fiadosPendentes.reduce((acc, f) => acc + Number(f.valor), 0);
  const totalFiadoPago = fiadosPagos.reduce((acc, f) => acc + Number(f.valor), 0);

  const transacoesFiltradas = [...transacoes]
    .filter(t => filtroTipo === 'todos' ? true : t.tipo === filtroTipo)
    .sort((a, b) => {
      const dA = new Date(a.data_transacao);
      const dB = new Date(b.data_transacao);
      return ordenacao === 'desc' ? dB - dA : dA - dB;
    });

  const entradasPorCategoria = categorias.filter(c => c.tipo === 'entrada').map(cat => {
    const total = transacoes.filter(t => t.tipo === 'entrada' && t.categoria_id === cat.id).reduce((acc, t) => acc + Number(t.valor), 0);
    const qtd = transacoes.filter(t => t.tipo === 'entrada' && t.categoria_id === cat.id).length;
    return { ...cat, total, qtd };
  });

  const saidasPorCategoria = categorias.filter(c => c.tipo === 'saida').map(cat => {
    const total = transacoes.filter(t => t.tipo === 'saida' && t.categoria_id === cat.id).reduce((acc, t) => acc + Number(t.valor), 0);
    const qtd = transacoes.filter(t => t.tipo === 'saida' && t.categoria_id === cat.id).length;
    return { ...cat, total, qtd };
  });

  const gerarExcel = () => {
    const wb = XLSX.utils.book_new();
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const resumoData = [
      ['RESUMO EXECUTIVO FINANCEIRO'],
      [],
      ['Data do Relatório', new Date().toLocaleString('pt-BR')],
      [],
      ['INDICADORES PRINCIPAIS'],
      ['Descrição', 'Valor (R$)'],
      ['Saldo em Caixa', saldo],
      ['Total de Entradas', totalEntradas],
      ['Total de Saídas', totalSaidas],
      ['Rendimento', rendimento],
      [],
      ['FIADOS'],
      ['Total Pendente a Receber', totalFiadoPendente],
      ['Total já Recebido (Fiado)', totalFiadoPago],
      ['Qtd Fiados Pendentes', fiadosPendentes.length],
      ['Qtd Fiados Pagos', fiadosPagos.length],
    ];

    const fiadosData = [
      ['FIADOS'],
      [],
      ['Cliente', 'Descrição', 'Valor (R$)', 'Status', 'Data Fiado', 'Data Pagamento'],
      ...fiados.map(f => [
        f.cliente,
        f.descricao,
        Number(f.valor),
        f.pago ? 'PAGO' : 'PENDENTE',
        new Date(f.data_fiado).toLocaleDateString('pt-BR'),
        f.data_pagamento ? new Date(f.data_pagamento).toLocaleDateString('pt-BR') : '-'
      ])
    ];

    const entradasData = [
      ['ENTRADAS POR CATEGORIA'],
      [],
      ['Categoria', 'Quantidade', 'Total (R$)'],
      ...entradasPorCategoria.map(cat => [cat.nome, cat.qtd, cat.total])
    ];

    const saidasData = [
      ['SAÍDAS POR CATEGORIA'],
      [],
      ['Categoria', 'Quantidade', 'Total (R$)'],
      ...saidasPorCategoria.map(cat => [cat.nome, cat.qtd, cat.total])
    ];

    const movData = [
      ['TODAS AS MOVIMENTAÇÕES'],
      [],
      ['Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Data'],
      ...transacoes
        .sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao))
        .map(t => [
          t.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA',
          t.descricao,
          t.categorias?.nome || '-',
          t.tipo === 'entrada' ? Number(t.valor) : -Number(t.valor),
          new Date(t.data_transacao).toLocaleDateString('pt-BR')
        ])
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fiadosData), 'Fiados');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(entradasData), 'Entradas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(saidasData), 'Saídas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(movData), 'Movimentações');

    XLSX.writeFile(wb, `Relatorio_Financeiro_${dataAtual.replace(/\//g, '-')}.xlsx`);
  };

  const thStyle = (extra = {}) => ({ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#495057', background: '#f5f5f5', ...extra });
  const tdStyle = (extra = {}) => ({ padding: '12px 16px', fontSize: '14px', ...extra });

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} className="relatorio-container">
      <div className="print-header" style={{ display: 'none' }}>
        <h1>📊 Relatório Financeiro</h1>
        <p>Data: {new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '700' }}>📊 Relatórios</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={gerarExcel}
            style={{ padding: '10px 24px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            onMouseEnter={(e) => e.target.style.background = '#40c057'}
            onMouseLeave={(e) => e.target.style.background = '#51cf66'}>
            📥 Exportar Excel
          </button>
          <button onClick={() => window.print()}
            style={{ padding: '10px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
            onMouseEnter={(e) => e.target.style.background = '#5568d3'}
            onMouseLeave={(e) => e.target.style.background = '#667eea'}>
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        {[
          { label: '💰 Saldo em Caixa', valor: saldo, bg: '#cfe0f8', color: '#4a5cc7' },
          { label: '📈 Total Entradas', valor: totalEntradas, bg: '#a8e6c1', color: '#1b8a4f' },
          { label: '📉 Total Saídas', valor: totalSaidas, bg: '#ffb3ba', color: '#c92a2a' },
          { label: '💵 Rendimento', valor: rendimento, bg: '#d4d4d4', color: '#595959' },
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, padding: '20px', borderRadius: '10px', borderLeft: `5px solid ${c.color}`, color: c.color, fontFamily: 'monospace' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.85 }}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatarMoeda(c.valor)}</div>
          </div>
        ))}
      </div>

      {/* SEÇÃO FIADOS */}
      <div style={{ marginBottom: '40px' }} className="relatorio-section">
        <h3 style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold', color: '#333', borderBottom: '2px solid #f59f00', paddingBottom: '8px' }}>🤝 Resumo de Fiados</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: '#fff3cd', padding: '18px', borderRadius: '10px', borderLeft: '5px solid #f59f00', color: '#856404', fontFamily: 'monospace' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>⏳ Pendente a Receber</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatarMoeda(totalFiadoPendente)}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>{fiadosPendentes.length} fiado(s)</div>
          </div>
          <div style={{ background: '#d3f9d8', padding: '18px', borderRadius: '10px', borderLeft: '5px solid #51cf66', color: '#2f9e44', fontFamily: 'monospace' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>✅ Já Recebido</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatarMoeda(totalFiadoPago)}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>{fiadosPagos.length} fiado(s)</div>
          </div>
          <div style={{ background: '#e7f5ff', padding: '18px', borderRadius: '10px', borderLeft: '5px solid #339af0', color: '#1864ab', fontFamily: 'monospace' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>📋 Total Geral Fiados</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatarMoeda(totalFiadoPendente + totalFiadoPago)}</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>{fiados.length} fiado(s)</div>
          </div>
        </div>

        {fiadosPendentes.length > 0 && (
          <>
            <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#856404' }}>⏳ Fiados Pendentes</h4>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '300px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fffbf0' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: '#fff3cd', borderBottom: '2px solid #ffc107' }}>
                    <th style={thStyle({ background: '#fff3cd', color: '#856404' })}>Cliente</th>
                    <th style={thStyle({ background: '#fff3cd', color: '#856404' })}>Descrição</th>
                    <th style={thStyle({ background: '#fff3cd', color: '#856404', textAlign: 'right' })}>Valor</th>
                    <th style={thStyle({ background: '#fff3cd', color: '#856404' })}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {fiadosPendentes.map((f, idx) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#ffffff' : '#fffbf0' }}>
                      <td style={{ ...tdStyle(), fontWeight: '600' }}>{f.cliente}</td>
                      <td style={tdStyle()}>{f.descricao}</td>
                      <td style={{ ...tdStyle(), color: '#856404', fontWeight: 'bold', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(Number(f.valor))}</td>
                      <td style={{ ...tdStyle(), color: '#666' }}>{new Date(f.data_fiado).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Entradas por categoria */}
      <div style={{ marginBottom: '40px' }} className="relatorio-section">
        <h3 style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>📥 Entradas por Categoria</h3>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '300px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle()}>Categoria</th>
                <th style={thStyle({ textAlign: 'right' })}>Qtd</th>
                <th style={thStyle({ textAlign: 'right' })}>Total</th>
              </tr>
            </thead>
            <tbody>
              {entradasPorCategoria.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle()}>{cat.nome}</td>
                  <td style={{ ...tdStyle(), textAlign: 'right' }}>{cat.qtd}</td>
                  <td style={{ ...tdStyle(), fontWeight: 'bold', color: '#2f9e44', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(cat.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saídas por categoria */}
      <div style={{ marginBottom: '40px' }} className="relatorio-section">
        <h3 style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>📤 Saídas por Categoria</h3>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '300px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle()}>Categoria</th>
                <th style={thStyle({ textAlign: 'right' })}>Qtd</th>
                <th style={thStyle({ textAlign: 'right' })}>Total</th>
              </tr>
            </thead>
            <tbody>
              {saidasPorCategoria.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle()}>{cat.nome}</td>
                  <td style={{ ...tdStyle(), textAlign: 'right' }}>{cat.qtd}</td>
                  <td style={{ ...tdStyle(), fontWeight: 'bold', color: '#c92a2a', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(cat.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Todas as movimentações */}
      <div className="relatorio-section">
        <h3 style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>📋 Todas as Movimentações</h3>
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }} className="filtros-print">
          {['todos', 'entrada', 'saida'].map(f => (
            <button key={f}
              onClick={() => setFiltroTipo(f)}
              style={{ padding: '10px 20px', background: filtroTipo === f ? '#667eea' : '#ffffff', color: filtroTipo === f ? 'white' : '#333', border: filtroTipo === f ? 'none' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
              {f === 'todos' ? 'Todos' : f === 'entrada' ? '📥 Entradas' : '📤 Saídas'}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle()}>Tipo</th>
                <th style={thStyle()}>Descrição</th>
                <th style={thStyle()}>Categoria</th>
                <th style={thStyle({ textAlign: 'right' })}>Valor</th>
                <th style={thStyle({ textAlign: 'right' })}>Saldo após</th>
                <th onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                  style={{ ...thStyle(), cursor: 'pointer', userSelect: 'none' }}>
                  Data {ordenacao === 'desc' ? '↓' : '↑'}
                </th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Nenhuma movimentação registrada</td></tr>
              ) : transacoesFiltradas.map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                  <td style={tdStyle()}>
                    <span style={{ background: t.tipo === 'entrada' ? '#d3f9d8' : '#ffe0e0', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                      {t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                    </span>
                  </td>
                  <td style={tdStyle()}>{t.descricao}</td>
                  <td style={{ ...tdStyle(), color: '#667eea' }}>{t.categorias?.nome || '—'}</td>
                  <td style={{ ...tdStyle(), fontWeight: 'bold', color: t.tipo === 'entrada' ? '#2f9e44' : '#c92a2a', textAlign: 'right', fontFamily: 'monospace' }}>
                    {t.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(Math.abs(Number(t.valor)))}
                  </td>
                  <td style={{ ...tdStyle(), textAlign: 'right', fontFamily: 'monospace', color: '#555' }}>{formatarMoeda(Number(t.saldo_apos || 0))}</td>
                  <td style={{ ...tdStyle(), color: '#666' }}>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Relatorios;