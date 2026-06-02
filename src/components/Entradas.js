import React, { useState, useEffect } from 'react';
import { getCategorias, criarTransacao, getTransacoes, deletarTransacao } from '../supabaseClient';
import { formatarMoeda } from '../utils/formatarNumero';

function Entradas({ onUpdate }) {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostraForm, setMostraForm] = useState(false);
  const [formData, setFormData] = useState({ descricao: '', categoria_id: '', valor: '', data_transacao: '' });
  const [erros, setErros] = useState({});
  const [ordenacao, setOrdenacao] = useState('desc');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [trans, cats] = await Promise.all([getTransacoes(), getCategorias()]);
    setTransacoes((trans.data || []).filter(t => t.tipo === 'entrada'));
    setCategorias((cats.data || []).filter(c => c.tipo === 'entrada'));
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
      tipo: 'entrada',
      valor: parseFloat(formData.valor),
      data_transacao: dataFormatada
    });

    if (result.success) {
      setMostraForm(false);
      setFormData({ descricao: '', categoria_id: '', valor: '', data_transacao: '' });
      setErros({});
      carregarDados();
      onUpdate();
      alert('✅ Entrada registrada!');
    } else {
      alert('❌ ' + result.error);
    }
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrada?')) {
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

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '20px', fontWeight: '700' }}>📥 Entradas</h2>

      <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: 'bold', background: '#d3f9d8', padding: '18px', borderRadius: '8px', color: '#2f9e44', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total de Entradas:</span>
        <span>{formatarMoeda(total)}</span>
      </div>

      <button
        onClick={() => setMostraForm(!mostraForm)}
        style={{ padding: '12px 28px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.3s' }}
        onMouseEnter={(e) => e.target.style.background = '#40c057'}
        onMouseLeave={(e) => e.target.style.background = '#51cf66'}
      >
        ➕ Nova Entrada
      </button>

      {mostraForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '25px', background: '#f9f9f9', borderRadius: '10px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Descrição</label>
              <input type="text" name="descricao" value={formData.descricao} onChange={handleChange}
                style={{ width: '100%', padding: '12px', border: erros.descricao ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
              {erros.descricao && <small style={{ color: '#c92a2a', display: 'block', marginTop: '4px' }}>{erros.descricao}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Categoria</label>
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange}
                style={{ width: '100%', padding: '12px', border: erros.categoria_id ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {erros.categoria_id && <small style={{ color: '#c92a2a', display: 'block', marginTop: '4px' }}>{erros.categoria_id}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Valor (R$)</label>
              <input type="number" name="valor" step="0.01" min="0.01" value={formData.valor} onChange={handleChange}
                style={{ width: '100%', padding: '12px', border: erros.valor ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
              {erros.valor && <small style={{ color: '#c92a2a', display: 'block', marginTop: '4px' }}>{erros.valor}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '15px' }}>Data</label>
              <input type="date" name="data_transacao" value={formData.data_transacao} onChange={handleChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />
            </div>
          </div>
          <button type="submit" style={{ padding: '12px 28px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '12px', fontSize: '16px', fontWeight: 'bold' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} style={{ padding: '12px 28px', background: '#999', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>❌ Cancelar</button>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#495057' }}>Descrição</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#495057' }}>Categoria</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: '#495057' }}>Valor</th>
              <th onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#495057', cursor: 'pointer', userSelect: 'none' }}>
                Data {ordenacao === 'desc' ? '↓' : '↑'}
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontSize: '14px', color: '#495057' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradas.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontSize: '15px' }}>{t.descricao}</td>
                <td style={{ padding: '14px 16px', color: '#667eea', fontSize: '15px' }}>{t.categorias?.nome || '—'}</td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#2f9e44', fontSize: '15px', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(parseFloat(t.valor))}</td>
                <td style={{ padding: '14px 16px', fontSize: '15px', color: '#666' }}>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button onClick={() => handleDeletar(t.id)} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#fa5252'} onMouseLeave={(e) => e.target.style.background = '#ff6b6b'}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Entradas;