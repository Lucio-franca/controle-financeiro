// Relatorios.jsx
import React, { useState, useEffect } from "react";
import { getTransacoes, getCategorias, getFiados } from "../supabaseClient";
import { formatarMoeda } from "../utils/formatarNumero";
import * as XLSX from "xlsx";

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fiados, setFiados] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("desc");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  useEffect(() => {
    carregarDados();
    adicionarEstiloPrint();
  }, []);

  const adicionarEstiloPrint = () => {
    const style = document.createElement("style");
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
      @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .card-appear { animation: slideInUp 0.5s ease-out; }
      .btn-hover { transition: all 0.3s ease; }
      .btn-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
      @media (prefers-reduced-motion: reduce) {
        .card-appear { animation: none; }
        .btn-hover { transition: none; }
        .btn-hover:hover { transform: none; }
      }
    `;
    document.head.appendChild(style);
  };

  const carregarDados = async () => {
    const [trans, cats, fiadosRes] = await Promise.all([
      getTransacoes(),
      getCategorias(),
      getFiados(),
    ]);
    setTransacoes(trans.data || []);
    setCategorias(cats.data || []);
    setFiados(fiadosRes.data || []);
  };

  const totalEntradas = transacoes
    .filter((t) => t.tipo === "entrada")
    .reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = transacoes
    .filter((t) => t.tipo === "saida")
    .reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;
  const rendimento = saldo > 0 ? saldo : 0;

  const fiadosPendentes = fiados.filter((f) => !f.pago);
  const fiadosPagos = fiados.filter((f) => f.pago);
  const totalFiadoPendente = fiadosPendentes.reduce(
    (acc, f) => acc + Number(f.valor),
    0,
  );
  const totalFiadoPago = fiadosPagos.reduce(
    (acc, f) => acc + Number(f.valor),
    0,
  );

  // Helper: converte data da transação para string "YYYY-MM-DD" para comparação
  const toDateStr = (dataISO) =>
    new Date(dataISO).toLocaleDateString("en-CA");

  const transacoesFiltradas = [...transacoes]
    .filter((t) => (filtroTipo === "todos" ? true : t.tipo === filtroTipo))
    .filter((t) => {
      const dataT = toDateStr(t.data_transacao);
      if (dataInicio && dataT < dataInicio) return false;
      if (dataFim && dataT > dataFim) return false;
      return true;
    })
    .filter((t) => {
      if (!categoriaFiltro) return true;
      return t.categoria_id === categoriaFiltro;
    })
    .sort((a, b) => {
      const dA = new Date(a.data_transacao);
      const dB = new Date(b.data_transacao);
      return ordenacao === "desc" ? dB - dA : dA - dB;
    });

  const temFiltroAtivo =
    dataInicio || dataFim || categoriaFiltro || filtroTipo !== "todos";

  const limparFiltros = () => {
    setFiltroTipo("todos");
    setDataInicio("");
    setDataFim("");
    setCategoriaFiltro("");
  };

  // Atalhos rápidos de período
  const aplicarPeriodo = (periodo) => {
    const hoje = new Date();
    const fimStr = hoje.toLocaleDateString("en-CA");

    if (periodo === "7d") {
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 6);
      setDataInicio(inicio.toLocaleDateString("en-CA"));
      setDataFim(fimStr);
    } else if (periodo === "30d") {
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 29);
      setDataInicio(inicio.toLocaleDateString("en-CA"));
      setDataFim(fimStr);
    } else if (periodo === "mes") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(inicio.toLocaleDateString("en-CA"));
      setDataFim(fimStr);
    } else if (periodo === "ano") {
      const inicio = new Date(hoje.getFullYear(), 0, 1);
      setDataInicio(inicio.toLocaleDateString("en-CA"));
      setDataFim(fimStr);
    }
  };

  const entradasPorCategoria = categorias
    .filter((c) => c.tipo === "entrada")
    .map((cat) => {
      const total = transacoes
        .filter((t) => t.tipo === "entrada" && t.categoria_id === cat.id)
        .reduce((acc, t) => acc + Number(t.valor), 0);
      const qtd = transacoes.filter(
        (t) => t.tipo === "entrada" && t.categoria_id === cat.id,
      ).length;
      return { ...cat, total, qtd };
    });

  const saidasPorCategoria = categorias
    .filter((c) => c.tipo === "saida")
    .map((cat) => {
      const total = transacoes
        .filter((t) => t.tipo === "saida" && t.categoria_id === cat.id)
        .reduce((acc, t) => acc + Number(t.valor), 0);
      const qtd = transacoes.filter(
        (t) => t.tipo === "saida" && t.categoria_id === cat.id,
      ).length;
      return { ...cat, total, qtd };
    });

  const gerarExcel = () => {
    const wb = XLSX.utils.book_new();
    const dataAtual = new Date().toLocaleDateString("pt-BR");

    const resumoData = [
      ["RESUMO EXECUTIVO FINANCEIRO"],
      [],
      ["Data do Relatório", new Date().toLocaleString("pt-BR")],
      [],
      ["INDICADORES PRINCIPAIS"],
      ["Descrição", "Valor (R$)"],
      ["Saldo em Caixa", saldo],
      ["Total de Entradas", totalEntradas],
      ["Total de Saídas", totalSaidas],
      ["Rendimento", rendimento],
      [],
      ["FIADOS"],
      ["Total Pendente a Receber", totalFiadoPendente],
      ["Total já Recebido (Fiado)", totalFiadoPago],
      ["Qtd Fiados Pendentes", fiadosPendentes.length],
      ["Qtd Fiados Pagos", fiadosPagos.length],
    ];

    const fiadosData = [
      ["FIADOS"],
      [],
      [
        "Cliente",
        "Descrição",
        "Valor (R$)",
        "Status",
        "Data Fiado",
        "Data Pagamento",
      ],
      ...fiados.map((f) => [
        f.cliente,
        f.descricao,
        Number(f.valor),
        f.pago ? "PAGO" : "PENDENTE",
        new Date(f.data_fiado).toLocaleDateString("pt-BR"),
        f.data_pagamento
          ? new Date(f.data_pagamento).toLocaleDateString("pt-BR")
          : "-",
      ]),
    ];

    const entradasData = [
      ["ENTRADAS POR CATEGORIA"],
      [],
      ["Categoria", "Quantidade", "Total (R$)"],
      ...entradasPorCategoria.map((cat) => [cat.nome, cat.qtd, cat.total]),
    ];

    const saidasData = [
      ["SAÍDAS POR CATEGORIA"],
      [],
      ["Categoria", "Quantidade", "Total (R$)"],
      ...saidasPorCategoria.map((cat) => [cat.nome, cat.qtd, cat.total]),
    ];

    const movData = [
      ["TODAS AS MOVIMENTAÇÕES"],
      [],
      ["Tipo", "Descrição", "Categoria", "Valor (R$)", "Data"],
      ...transacoes
        .sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao))
        .map((t) => [
          t.tipo === "entrada" ? "ENTRADA" : "SAÍDA",
          t.descricao,
          t.categorias?.nome || "-",
          t.tipo === "entrada" ? Number(t.valor) : -Number(t.valor),
          new Date(t.data_transacao).toLocaleDateString("pt-BR"),
        ]),
    ];

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(resumoData),
      "Resumo",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(fiadosData),
      "Fiados",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(entradasData),
      "Entradas",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(saidasData),
      "Saídas",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(movData),
      "Movimentações",
    );

    XLSX.writeFile(
      wb,
      `Relatorio_Financeiro_${dataAtual.replace(/\//g, "-")}.xlsx`,
    );
  };

  const thStyle = {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "700",
    fontSize: "12px",
    color: "#556575",
    background: "#f0f2f5",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };
  const tdStyle = { padding: "14px 16px", fontSize: "14px", color: "#333" };

  // Label do período ativo para exibir no contador
  const labelPeriodo = () => {
    if (!dataInicio && !dataFim) return null;
    const fmt = (s) =>
      new Date(s + "T00:00:00").toLocaleDateString("pt-BR");
    if (dataInicio && dataFim)
      return `${fmt(dataInicio)} até ${fmt(dataFim)}`;
    if (dataInicio) return `a partir de ${fmt(dataInicio)}`;
    return `até ${fmt(dataFim)}`;
  };

  return (
    <div
      style={{ background: "#f5f7fa", borderRadius: "14px", padding: "30px" }}
      className="relatorio-container"
    >
      <div className="print-header" style={{ display: "none" }}>
        <h1>📊 Relatório Financeiro</h1>
        <p>Data: {new Date().toLocaleString("pt-BR")}</p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            margin: 0,
            fontWeight: "700",
            color: "#1a1a1a",
          }}
        >
          📊 Relatórios
        </h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={gerarExcel}
            className="btn-hover"
            style={{
              padding: "11px 26px",
              background: "#51cf66",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(81, 207, 102, 0.2)",
            }}
          >
            📥 Excel
          </button>
          <button
            onClick={() => window.print()}
            className="btn-hover"
            style={{
              padding: "11px 26px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2)",
            }}
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* ── CARDS RESUMO ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          marginBottom: "45px",
        }}
      >
        {[
          {
            label: "💰 Saldo",
            valor: saldo,
            bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          },
          {
            label: "📈 Entradas",
            valor: totalEntradas,
            bg: "linear-gradient(135deg, #51cf66 0%, #37b24d 100%)",
          },
          {
            label: "📉 Saídas",
            valor: totalSaidas,
            bg: "linear-gradient(135deg, #ff6b6b 0%, #f03e3e 100%)",
          },
          {
            label: "💵 Rendimento",
            valor: rendimento,
            bg: "linear-gradient(135deg, #ffd43b 0%, #ffb700 100%)",
          },
        ].map((c, i) => (
          <div
            key={i}
            className="card-appear"
            style={{
              background: c.bg,
              color: "white",
              padding: "26px",
              borderRadius: "12px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
              cursor: "default",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 14px 35px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
            }}
          >
            <div
              style={{
                fontSize: "13px",
                marginBottom: "10px",
                opacity: 0.9,
                fontWeight: "600",
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                fontFamily: "monospace",
                letterSpacing: "-1px",
              }}
            >
              {formatarMoeda(c.valor)}
            </div>
          </div>
        ))}
      </div>

      {/* ── FIADOS ── */}
      <div style={{ marginBottom: "45px" }} className="relatorio-section">
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "20px",
            fontWeight: "700",
            color: "#1a1a1a",
          }}
        >
          🤝 Resumo de Fiados
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >
          {[
            {
              label: "⏳ Pendente",
              valor: formatarMoeda(totalFiadoPendente),
              sub: `${fiadosPendentes.length} fiado(s)`,
              bg: "#fff3cd",
              border: "#ffc107",
              color: "#856404",
            },
            {
              label: "✅ Recebido",
              valor: formatarMoeda(totalFiadoPago),
              sub: `${fiadosPagos.length} fiado(s)`,
              bg: "#d3f9d8",
              border: "#51cf66",
              color: "#2f9e44",
            },
            {
              label: "📋 Total",
              valor: fiados.length,
              sub: "Total geral",
              bg: "#e7f5ff",
              border: "#339af0",
              color: "#1864ab",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="card-appear"
              style={{
                background: card.bg,
                border: `2px solid ${card.border}`,
                borderRadius: "12px",
                padding: "22px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-4px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div
                style={{
                  fontSize: "12px",
                  color: card.color,
                  marginBottom: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: card.color,
                  fontFamily: "monospace",
                }}
              >
                {card.valor}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  color: card.color,
                  opacity: 0.75,
                }}
              >
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {fiadosPendentes.length > 0 && (
          <>
            <h4
              style={{
                fontSize: "14px",
                marginBottom: "12px",
                color: "#1a1a1a",
                fontWeight: "700",
              }}
            >
              ⏳ Fiados Pendentes
            </h4>
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "320px",
                marginBottom: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#fff",
                }}
              >
                <thead style={{ position: "sticky", top: 0 }}>
                  <tr style={{ background: "#fff3cd", borderBottom: "2px solid #ffc107" }}>
                    {["Cliente", "Descrição", "Valor", "Data"].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          ...thStyle,
                          background: "#fff3cd",
                          color: "#856404",
                          textAlign: h === "Valor" ? "right" : "left",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fiadosPendentes.map((f, idx) => (
                    <tr
                      key={f.id}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        background: idx % 2 === 0 ? "#fff" : "#fafafa",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fffbf0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          idx % 2 === 0 ? "#fff" : "#fafafa")
                      }
                    >
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{f.cliente}</td>
                      <td style={tdStyle}>{f.descricao}</td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "#856404",
                          fontWeight: "700",
                          textAlign: "right",
                          fontFamily: "monospace",
                        }}
                      >
                        {formatarMoeda(Number(f.valor))}
                      </td>
                      <td style={{ ...tdStyle, color: "#888" }}>
                        {new Date(f.data_fiado).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── ENTRADAS POR CATEGORIA ── */}
      <div style={{ marginBottom: "45px" }} className="relatorio-section">
        <h3
          style={{ fontSize: "18px", marginBottom: "15px", fontWeight: "700", color: "#1a1a1a" }}
        >
          📥 Entradas por Categoria
        </h3>
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "320px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead style={{ position: "sticky", top: 0 }}>
              <tr style={{ background: "#f0f2f5", borderBottom: "2px solid #ddd" }}>
                <th style={thStyle}>Categoria</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Qtd</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {entradasPorCategoria.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ ...tdStyle, textAlign: "center", padding: "30px", color: "#999" }}>
                    Nenhuma entrada registrada
                  </td>
                </tr>
              ) : (
                entradasPorCategoria.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    style={{ borderBottom: "1px solid #f0f0f0", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td style={tdStyle}>{cat.nome}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "600" }}>{cat.qtd}</td>
                    <td style={{ ...tdStyle, fontWeight: "700", color: "#2f9e44", textAlign: "right", fontFamily: "monospace" }}>
                      {formatarMoeda(cat.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SAÍDAS POR CATEGORIA ── */}
      <div style={{ marginBottom: "45px" }} className="relatorio-section">
        <h3
          style={{ fontSize: "18px", marginBottom: "15px", fontWeight: "700", color: "#1a1a1a" }}
        >
          📤 Saídas por Categoria
        </h3>
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "320px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead style={{ position: "sticky", top: 0 }}>
              <tr style={{ background: "#f0f2f5", borderBottom: "2px solid #ddd" }}>
                <th style={thStyle}>Categoria</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Qtd</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {saidasPorCategoria.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ ...tdStyle, textAlign: "center", padding: "30px", color: "#999" }}>
                    Nenhuma saída registrada
                  </td>
                </tr>
              ) : (
                saidasPorCategoria.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    style={{ borderBottom: "1px solid #f0f0f0", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td style={tdStyle}>{cat.nome}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "600" }}>{cat.qtd}</td>
                    <td style={{ ...tdStyle, fontWeight: "700", color: "#ff6b6b", textAlign: "right", fontFamily: "monospace" }}>
                      {formatarMoeda(cat.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TODAS AS MOVIMENTAÇÕES ── */}
      <div className="relatorio-section">
        <h3
          style={{ fontSize: "18px", marginBottom: "15px", fontWeight: "700", color: "#1a1a1a" }}
        >
          📋 Todas as Movimentações
        </h3>

        {/* PAINEL DE FILTROS */}
        <div
          className="filtros-print"
          style={{
            marginBottom: "20px",
            padding: "20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Linha 1: range de datas + atalhos rápidos */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {/* Data início */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#556575",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                📅 Data inicial
              </label>
              <input
                type="date"
                value={dataInicio}
                max={dataFim || undefined}
                onChange={(e) => setDataInicio(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: dataInicio ? "1.5px solid #667eea" : "1.5px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                  background: dataInicio ? "#f8f9ff" : "#fff",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              />
            </div>

            {/* Separador */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingBottom: "2px",
                color: "#aaa",
                fontSize: "18px",
                fontWeight: "300",
                userSelect: "none",
              }}
            >
              →
            </div>

            {/* Data fim */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#556575",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                📅 Data final
              </label>
              <input
                type="date"
                value={dataFim}
                min={dataInicio || undefined}
                onChange={(e) => setDataFim(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: dataFim ? "1.5px solid #667eea" : "1.5px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                  background: dataFim ? "#f8f9ff" : "#fff",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              />
            </div>

            {/* Atalhos rápidos */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { key: "7d", label: "7 dias" },
                { key: "30d", label: "30 dias" },
                { key: "mes", label: "Este mês" },
                { key: "ano", label: "Este ano" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => aplicarPeriodo(p.key)}
                  className="btn-hover"
                  style={{
                    padding: "10px 14px",
                    background: "#f0f2f5",
                    color: "#556575",
                    border: "1.5px solid #e2e5ea",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#667eea";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f0f2f5";
                    e.currentTarget.style.color = "#556575";
                    e.currentTarget.style.borderColor = "#e2e5ea";
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Linha 2: categoria + tipo + limpar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {/* Categoria */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#556575",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Categoria
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{
                  padding: "10px 14px",
                  border: categoriaFiltro ? "1.5px solid #667eea" : "1.5px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  minWidth: "180px",
                  background: categoriaFiltro ? "#f8f9ff" : "#fff",
                  outline: "none",
                }}
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tipo === "entrada" ? "📥" : "📤"} {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div style={{ display: "flex", gap: "8px" }}>
              {["todos", "entrada", "saida"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroTipo(f)}
                  className="btn-hover"
                  style={{
                    padding: "10px 16px",
                    background: filtroTipo === f ? "#667eea" : "#f0f2f5",
                    color: filtroTipo === f ? "white" : "#556575",
                    border: filtroTipo === f ? "1.5px solid #667eea" : "1.5px solid #e2e5ea",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {f === "todos" ? "Todos" : f === "entrada" ? "📥 Entradas" : "📤 Saídas"}
                </button>
              ))}
            </div>

            {/* Limpar filtros */}
            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="btn-hover"
                style={{
                  padding: "10px 18px",
                  background: "#fff0f0",
                  color: "#ff6b6b",
                  border: "1.5px solid #ffcdd2",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                ✖ Limpar filtros
              </button>
            )}

            {/* Contador de resultados */}
            {temFiltroAtivo && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    background: "#667eea",
                    color: "white",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {transacoesFiltradas.length}
                </span>
                <span style={{ fontSize: "13px", color: "#556575", fontWeight: "500" }}>
                  resultado(s)
                  {labelPeriodo() && (
                    <span style={{ color: "#667eea", marginLeft: "4px" }}>
                      · {labelPeriodo()}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TABELA DE MOVIMENTAÇÕES */}
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "420px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead style={{ position: "sticky", top: 0 }}>
              <tr style={{ background: "#f0f2f5", borderBottom: "2px solid #ddd" }}>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Descrição</th>
                <th style={thStyle}>Categoria</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Valor</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Saldo</th>
                <th
                  onClick={() =>
                    setOrdenacao((o) => (o === "desc" ? "asc" : "desc"))
                  }
                  style={{ ...thStyle, cursor: "pointer", userSelect: "none" }}
                >
                  Data {ordenacao === "desc" ? "↓" : "↑"}
                </th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      padding: "40px",
                      color: "#999",
                    }}
                  >
                    {temFiltroAtivo
                      ? "Nenhuma movimentação encontrada para o período selecionado"
                      : "Nenhuma movimentação"}
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map((t, idx) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: "1px solid #f0f0f0",
                      background: idx % 2 === 0 ? "#fff" : "#fafafa",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8f9ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        idx % 2 === 0 ? "#fff" : "#fafafa")
                    }
                  >
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: t.tipo === "entrada" ? "#d3f9d8" : "#ffe0e0",
                          color: t.tipo === "entrada" ? "#2f9e44" : "#ff6b6b",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "11px",
                          display: "inline-block",
                        }}
                      >
                        {t.tipo === "entrada" ? "📥 IN" : "📤 OUT"}
                      </span>
                    </td>
                    <td style={tdStyle}>{t.descricao}</td>
                    <td style={{ ...tdStyle, color: "#667eea", fontWeight: "500" }}>
                      {t.categorias?.nome || "—"}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "700",
                        color: t.tipo === "entrada" ? "#2f9e44" : "#ff6b6b",
                        textAlign: "right",
                        fontFamily: "monospace",
                      }}
                    >
                      {t.tipo === "entrada" ? "+" : "-"}
                      {formatarMoeda(Math.abs(Number(t.valor)))}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: "#556575",
                        fontWeight: "600",
                      }}
                    >
                      {formatarMoeda(Number(t.saldo_apos || 0))}
                    </td>
                    <td style={{ ...tdStyle, color: "#888" }}>
                      {new Date(t.data_transacao).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Relatorios;