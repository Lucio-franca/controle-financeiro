import React, { useState, useEffect } from 'react';
import { getCategorias, criarTransacao, getTransacoes, deletarTransacao } from '../supabaseClient';
import { formatarMoeda } from '../utils/formatarNumero';

function Saidas({ onUpdate }) {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostraForm, setMostraForm] = useState(false);
  const [formData, setFormData] = useState({ descricao: '', categoria_id: '', valor: '', data_transacao: '' });
  const [erros, setErros] = useState({});
  const [ordenacao, setOrdenacao] = useState('desc');

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    const [trans, cats] = await Promise.all([getTransacoes(), getCategorias()]);
    setTransacoes((trans.data || []).filter(t => t.tipo === 'saida'));
    setCategorias((cats.data || []).filter(c => c.tipo === 'saida'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const novosErros = {};
    if (!formData.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória';
    if (!formData.categoria_id) novosErros.categoria_id = 'Categoria é obrigatória';
    if (!formData.valor || parseFloat(formData.valor) <= 0) novosErros.valor = 'Valor deve ser maior que 0';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    const dataFormatada = formData.data_transacao ? new Date(formData.data_transacao + 'T00:00:00') : new Date();
    const result = await criarTransacao({
      descricao: formData.descricao,
      categoria_id: formData.categoria_id,
      tipo: 'saida',
      valor: parseFloat(formData.valor),
      data_transacao: dataFormatada
    });
    if (result.success) {
      setMostraForm(false);
      setFormData({ descricao: '', categoria_id: '', valor: '', data_transacao: '' });
      setErros({});
      carregarDados();
      onUpdate();
      alert('✅ Saída registrada!');
    } else {
      alert('❌ ' + result.error);
    }
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta saída?')) {
      await deletarTransacao(id);
      carregarDados();
      onUpdate();
    }
  };

  const total = transacoes.reduce((acc, t) => acc + parseFloat(t.valor), 0);

  const transacoesFiltradas = [...transacoes].sort((a, b) => {
    const dA = new Date(a.data_transacao);
    const dB = new Date(b.data_transacao);
    return ordenacao === 'desc' ? dB - dA : dA - dB;
  });

  const inputStyle = (erro) => ({
    width: '100%', padding: '12px',
    border: erro ? '2px solid #c92a2a' : '1px solid #ddd',
    borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
  });

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '20px', fontWeight: '700' }}>📤 Saídas</h2>

      <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: 'bold', background: '#ffe0e0', padding: '18px', borderRadius: '8px', color: '#c92a2a', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total de Saídas:</span>
        <span>{formatarMoeda(total)}</span>
      </div>

      <button onClick={() => setMostraForm(!mostraForm)}
        style={{ padding: '12px 28px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.3s' }}
        onMouseEnter={(e) => e.target.style.background = '#fa5252'}
        onMouseLeave={(e) => e.target.style.background = '#ff6b6b'}>
        ➕ Nova Saída
      </button>

      {mostraForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '25px', background: '#f9f9f9', borderRadius: '10px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Descrição</label>
              <input type="text" name="descricao" value={formData.descricao} onChange={handleChange}
                placeholder="Ex: Compra de estoque, Conta de luz..." style={inputStyle(erros.descricao)} />
              {erros.descricao && <small style={{ color: '#c92a2a', display: 'block', marginTop: '4px' }}>{erros.descricao}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Categoria</label>
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} style={inputStyle(erros.categoria_id)}>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {erros.categoria_id && <small style={{ color: '#c92a2a', display: 'block', marginTop: '4px' }}>{erros.categoria_id}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Valor (R$)</label>
              <input type="number" name="valor" step="0.01" min="0.01" value={formData.valor} onChange={handleChange} style={inputStyle(erros.valor)} />
              {erros.valor && <small style={{ color: '#c92a2a', display: 'block', marginTop: '4px' }}>{erros.valor}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Data</label>
              <input type="date" name="data_transacao" value={formData.data_transacao} onChange={handleChange} style={inputStyle(false)} />
            </div>
          </div>
          <button type="submit" style={{ padding: '12px 28px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '12px', fontSize: '16px', fontWeight: 'bold' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} style={{ padding: '12px 28px', background: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>❌ Cancelar</button>
        </form>
      )}

      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#495057', background: '#f8f9fa' }}>Descrição</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#495057', background: '#f8f9fa' }}>Categoria</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: '#495057', background: '#f8f9fa' }}>Valor</th>
              <th onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#495057', cursor: 'pointer', userSelect: 'none', background: '#f8f9fa' }}>
                Data {ordenacao === 'desc' ? '↓' : '↑'}
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '14px', color: '#495057', background: '#f8f9fa' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradas.map((t, idx) => (
              <tr key={t.id}
                style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s', background: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}>
                <td style={{ padding: '14px 16px', fontSize: '15px' }}>{t.descricao}</td>
                <td style={{ padding: '14px 16px', color: '#667eea', fontSize: '15px' }}>{t.categorias?.nome || '—'}</td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#c92a2a', fontSize: '15px', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(parseFloat(t.valor))}</td>
                <td style={{ padding: '14px 16px', fontSize: '15px', color: '#666' }}>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button onClick={() => handleDeletar(t.id)}
                    style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.target.style.background = '#fa5252'}
                    onMouseLeave={(e) => e.target.style.background = '#ff6b6b'}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Saidas;