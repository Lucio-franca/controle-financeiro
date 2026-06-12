// Saidas.jsx
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
    width: '100%', padding: '11px 14px',
    border: erro ? '2px solid #ff6b6b' : '1.5px solid #ddd',
    borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', transition: 'all 0.2s'
  });

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

      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '20px', fontWeight: '700', color: '#333' }}>📤 Saídas</h2>

      <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: '600', background: '#ffe0e0', padding: '18px', borderRadius: '10px', color: '#c92a2a', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', border: '1px solid #ff6b6b' }}>
        <span>Total de Saídas:</span>
        <span>{formatarMoeda(total)}</span>
      </div>

      <button onClick={() => setMostraForm(!mostraForm)} className="btn-hover"
        style={{ padding: '12px 28px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontSize: '15px', fontWeight: '600' }}>
        ➕ Nova Saída
      </button>

      {mostraForm && (
        <form onSubmit={handleSubmit} className="form-appear" style={{ marginBottom: '30px', padding: '25px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Descrição</label>
              <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} style={inputStyle(erros.descricao)} />
              {erros.descricao && <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>{erros.descricao}</small>}
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
              <input type="date" name="data_transacao" value={formData.data_transacao} onChange={handleChange} style={inputStyle(false)} />
            </div>
          </div>
          <button type="submit" className="btn-hover" style={{ padding: '11px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px', fontSize: '15px', fontWeight: '600' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} className="btn-hover" style={{ padding: '11px 24px', background: '#aaa', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>❌ Cancelar</button>
        </form>
      )}

      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Descrição</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555' }}>Categoria</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#555' }}>Valor</th>
              <th onClick={() => setOrdenacao(o => o === 'desc' ? 'asc' : 'desc')}
                style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#555', cursor: 'pointer', userSelect: 'none' }}>
                Data {ordenacao === 'desc' ? '↓' : '↑'}
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#555' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradas.map((t, idx) => (
              <tr key={t.id} className="row-appear"
                style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#ffffff' : '#f8f9fa', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fff0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}>
                <td style={{ padding: '14px 16px', fontSize: '14px' }}>{t.descricao}</td>
                <td style={{ padding: '14px 16px', color: '#667eea', fontSize: '14px' }}>{t.categorias?.nome || '—'}</td>
                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#c92a2a', fontSize: '14px', textAlign: 'right', fontFamily: 'monospace' }}>{formatarMoeda(parseFloat(t.valor))}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#666' }}>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button onClick={() => handleDeletar(t.id)} className="btn-hover"
                    style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
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