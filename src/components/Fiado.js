// Fiado.jsx
import React, { useState, useEffect } from 'react';
import { getCategorias, criarTransacao, getFiados, criarFiado, pagarFiado, deletarFiado } from '../supabaseClient';
import { formatarMoeda } from '../utils/formatarNumero';

function Fiado({ onUpdate }) {
  const [fiados, setFiados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostraForm, setMostraForm] = useState(false);
  const [formData, setFormData] = useState({ descricao: '', cliente: '', categoria_id: '', valor: '', data_fiado: '' });
  const [erros, setErros] = useState({});
  const [filtroPago, setFiltroPago] = useState('pendente');
  const [carregandoPagamento, setCarregandoPagamento] = useState(null);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const [fiadosRes, catsRes] = await Promise.all([getFiados(), getCategorias()]);
      if (fiadosRes.error) throw new Error('Fiados: ' + fiadosRes.error.message);
      setFiados(fiadosRes.data || []);
      setCategorias((catsRes.data || []).filter(c => c.tipo === 'entrada'));
    } catch (e) {
      setErroCarregamento(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const novosErros = {};
    if (!formData.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória';
    if (!formData.cliente.trim()) novosErros.cliente = 'Cliente é obrigatório';
    if (!formData.categoria_id) novosErros.categoria_id = 'Categoria é obrigatória';
    if (!formData.valor || parseFloat(formData.valor) <= 0) novosErros.valor = 'Valor deve ser maior que 0';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    const dataFormatada = formData.data_fiado ? new Date(formData.data_fiado + 'T00:00:00') : new Date();
    const result = await criarFiado({
      descricao: formData.descricao,
      cliente: formData.cliente,
      categoria_id: formData.categoria_id,
      valor: parseFloat(formData.valor),
      data_fiado: dataFormatada,
      pago: false,
    });
    if (result.success) {
      setMostraForm(false);
      setFormData({ descricao: '', cliente: '', categoria_id: '', valor: '', data_fiado: '' });
      setErros({});
      carregarDados();
      alert('✅ Fiado registrado!');
    } else {
      alert('❌ ' + result.error);
    }
  };

  const handlePagar = async (fiado) => {
    if (!window.confirm(`Confirmar recebimento de ${formatarMoeda(fiado.valor)} de ${fiado.cliente}?\n\nIsso vai lançar como entrada no financeiro.`)) return;
    setCarregandoPagamento(fiado.id);
    const resPagar = await pagarFiado(fiado.id);
    if (!resPagar.success) {
      alert('❌ Erro ao marcar como pago: ' + resPagar.error);
      setCarregandoPagamento(null);
      return;
    }
    const resTransacao = await criarTransacao({
      descricao: `[FIADO] ${fiado.descricao} - ${fiado.cliente}`,
      categoria_id: fiado.categoria_id,
      tipo: 'entrada',
      valor: parseFloat(fiado.valor),
      data_transacao: new Date(),
    });
    setCarregandoPagamento(null);
    if (resTransacao.success) {
      carregarDados();
      if (onUpdate) onUpdate();
      alert('✅ Pagamento recebido e lançado nas entradas!');
    } else {
      alert('⚠️ Fiado marcado como pago, mas erro ao lançar entrada: ' + resTransacao.error);
    }
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fiado?')) {
      await deletarFiado(id);
      carregarDados();
    }
  };

  const fiadosFiltrados = fiados.filter(f => filtroPago === 'pendente' ? !f.pago : f.pago);
  const totalPendente = fiados.filter(f => !f.pago).reduce((acc, f) => acc + parseFloat(f.valor), 0);
  const totalRecebido = fiados.filter(f => f.pago).reduce((acc, f) => acc + parseFloat(f.valor), 0);

  const inputStyle = (erro) => ({
    width: '100%', padding: '11px 14px',
    border: erro ? '2px solid #ff6b6b' : '1.5px solid #ddd',
    borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', transition: 'all 0.2s'
  });

  if (carregando) return <div style={{ background: 'white', padding: '60px 30px', borderRadius: '14px', textAlign: 'center', color: '#888', fontSize: '16px' }}>⏳ Carregando...</div>;

  if (erroCarregamento) return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ color: '#c92a2a', marginTop: 0 }}>❌ Erro ao carregar Fiado</h2>
      <div style={{ background: '#ffe0e0', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', color: '#c92a2a', marginBottom: '20px' }}>{erroCarregamento}</div>
      <button onClick={carregarDados} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🔄 Tentar novamente</button>
    </div>
  );

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <style>{`
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .form-appear { animation: slideDown 0.3s ease-out; }
        .row-appear { animation: fadeIn 0.3s ease-out; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '20px', fontWeight: '700', color: '#333' }}>🤝 Fiado</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px', padding: '18px', borderLeft: '4px solid #ffc107' }}>
          <div style={{ fontSize: '12px', color: '#856404', marginBottom: '8px', fontWeight: '600' }}>⏳ Pendente</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#856404', fontFamily: 'monospace' }}>{formatarMoeda(totalPendente)}</div>
        </div>
        <div style={{ background: '#d3f9d8', border: '1px solid #51cf66', borderRadius: '10px', padding: '18px', borderLeft: '4px solid #51cf66' }}>
          <div style={{ fontSize: '12px', color: '#2f9e44', marginBottom: '8px', fontWeight: '600' }}>✅ Recebido</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2f9e44', fontFamily: 'monospace' }}>{formatarMoeda(totalRecebido)}</div>
        </div>
        <div style={{ background: '#e7f5ff', border: '1px solid #339af0', borderRadius: '10px', padding: '18px', borderLeft: '4px solid #339af0' }}>
          <div style={{ fontSize: '12px', color: '#1864ab', marginBottom: '8px', fontWeight: '600' }}>📋 Total</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1864ab', fontFamily: 'monospace' }}>{fiados.length}</div>
        </div>
      </div>

      <button onClick={() => setMostraForm(!mostraForm)} className="btn-hover"
        style={{ padding: '12px 28px', background: '#f59f00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '25px', fontSize: '15px', fontWeight: '600' }}>
        ➕ Novo Fiado
      </button>

      {mostraForm && (
        <div className="form-appear" style={{ marginBottom: '30px', padding: '25px', background: '#fffbf0', borderRadius: '10px', border: '1px solid #ffc107' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#856404' }}>📝 Registrar Fiado</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Descrição</label>
              <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} style={inputStyle(erros.descricao)} />
              {erros.descricao && <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>{erros.descricao}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Cliente</label>
              <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} style={inputStyle(erros.cliente)} />
              {erros.cliente && <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>{erros.cliente}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Categoria</label>
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} style={inputStyle(erros.categoria_id)}>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {erros.categoria_id && <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>{erros.categoria_id}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Valor (R$)</label>
              <input type="number" name="valor" step="0.01" min="0.01" value={formData.valor} onChange={handleChange} style={inputStyle(erros.valor)} />
              {erros.valor && <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>{erros.valor}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Data</label>
              <input type="date" name="data_fiado" value={formData.data_fiado} onChange={handleChange} style={inputStyle(false)} />
            </div>
          </div>
          <button type="button" onClick={handleSubmit} className="btn-hover" style={{ padding: '11px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px', fontSize: '15px', fontWeight: '600' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} className="btn-hover" style={{ padding: '11px 24px', background: '#aaa', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>❌ Cancelar</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['pendente', 'pago'].map(f => (
          <button key={f} onClick={() => setFiltroPago(f)} className="btn-hover" style={{
            padding: '10px 20px',
            background: filtroPago === f ? (f === 'pendente' ? '#f59f00' : '#51cf66') : '#f5f5f5',
            color: filtroPago === f ? 'white' : '#555',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
          }}>
            {f === 'pendente' ? `⏳ Pendentes (${fiados.filter(fi => !fi.pago).length})` : `✅ Pagos (${fiados.filter(fi => fi.pago).length})`}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Cliente</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Descrição</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Categoria</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#555' }}>Valor</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Data</th>
              {filtroPago === 'pago' && <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Pago em</th>}
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#555' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fiadosFiltrados.length === 0 ? (
              <tr><td colSpan={filtroPago === 'pago' ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>
                {filtroPago === 'pendente' ? '🎉 Nenhum fiado pendente!' : 'Nenhum fiado pago ainda.'}
              </td></tr>
            ) : fiadosFiltrados.map((f, idx) => (
              <tr key={f.id} className="row-appear"
                style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#ffffff' : '#fafafa', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff8e1'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa'}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600' }}>{f.cliente}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px' }}>{f.descricao}</td>
                <td style={{ padding: '14px 16px', color: '#667eea', fontSize: '14px' }}>{f.categorias?.nome || '—'}</td>
                <td style={{ padding: '14px 16px', fontWeight: '600', color: f.pago ? '#2f9e44' : '#856404', fontSize: '14px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {formatarMoeda(parseFloat(f.valor))}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>{new Date(f.data_fiado).toLocaleDateString('pt-BR')}</td>
                {filtroPago === 'pago' && <td style={{ padding: '14px 16px', fontSize: '14px', color: '#2f9e44' }}>{f.data_pagamento ? new Date(f.data_pagamento).toLocaleDateString('pt-BR') : '—'}</td>}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {!f.pago && (
                      <button onClick={() => handlePagar(f)} disabled={carregandoPagamento === f.id} className="btn-hover"
                        style={{ background: carregandoPagamento === f.id ? '#aaa' : '#51cf66', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: carregandoPagamento === f.id ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {carregandoPagamento === f.id ? '⏳...' : '✅'}
                      </button>
                    )}
                    <button onClick={() => handleDeletar(f.id)} className="btn-hover"
                      style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Fiado;