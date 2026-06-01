import React, { useState, useEffect } from 'react';
import { getCategorias, criarTransacao, getTransacoes, deletarTransacao } from '../supabaseClient';

function Saidas({ onUpdate }) {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostraForm, setMostraForm] = useState(false);
  const [formData, setFormData] = useState({ descricao: '', categoria_id: '', valor: '', data_transacao: '' });
  const [erros, setErros] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

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

    const result = await criarTransacao({
      ...formData,
      tipo: 'saida',
      valor: parseFloat(formData.valor)
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

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '20px' }}>📤 Saídas</h2>

      <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: 'bold', background: '#ffe0e0', padding: '15px', borderRadius: '6px', color: '#c92a2a' }}>
        Total de Saídas: R$ {total.toFixed(2)}
      </div>

      <button
        onClick={() => setMostraForm(!mostraForm)}
        style={{ padding: '14px 32px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: 'bold' }}
      >
        ➕ Nova Saída
      </button>

      {mostraForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '25px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Descrição</label>
              <input type="text" name="descricao" value={formData.descricao} onChange={handleChange}
                placeholder="Ex: Compra de estoque, Conta de luz..."
                style={{ width: '100%', padding: '10px', border: erros.descricao ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              {erros.descricao && <small style={{ color: '#c92a2a' }}>{erros.descricao}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Categoria</label>
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: erros.categoria_id ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {erros.categoria_id && <small style={{ color: '#c92a2a' }}>{erros.categoria_id}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Valor (R$)</label>
              <input type="number" name="valor" step="0.01" min="0.01" value={formData.valor} onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: erros.valor ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              {erros.valor && <small style={{ color: '#c92a2a' }}>{erros.valor}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Data</label>
              <input type="date" name="data_transacao" value={formData.data_transacao} onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
            </div>
          </div>
          <button type="submit" style={{ padding: '12px 28px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '12px', fontSize: '16px', fontWeight: 'bold' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} style={{ padding: '12px 28px', background: '#999', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>❌ Cancelar</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
          <tr>
            <th style={{ padding: '14px', textAlign: 'left' }}>Descrição</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Categoria</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Valor</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Data</th>
            <th style={{ padding: '14px', textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {transacoes.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '14px' }}>{t.descricao}</td>
              <td style={{ padding: '14px', color: '#667eea' }}>{t.categorias?.nome || '—'}</td>
              <td style={{ padding: '14px', fontWeight: 'bold', color: '#c92a2a' }}>R$ {parseFloat(t.valor).toFixed(2)}</td>
              <td style={{ padding: '14px' }}>{new Date(t.data_transacao).toLocaleDateString()}</td>
              <td style={{ padding: '14px', textAlign: 'center' }}>
                <button onClick={() => handleDeletar(t.id)} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Saidas;