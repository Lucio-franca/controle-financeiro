// Categorias.jsx
import React, { useState, useEffect } from 'react';
import { getCategorias, criarCategoria, atualizarCategoria, deletarCategoria } from '../supabaseClient';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [mostraForm, setMostraForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', tipo: 'entrada' });
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    const result = await getCategorias();
    setCategorias(result.data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErros(prev => ({ ...prev, [name]: '' }));
  };

  const validar = () => {
    const novosErros = {};
    if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    let result;
    if (editando) {
      result = await atualizarCategoria(editando.id, { nome: formData.nome, tipo: formData.tipo });
    } else {
      result = await criarCategoria({ nome: formData.nome, tipo: formData.tipo });
    }

    if (result.success) {
      setMostraForm(false);
      setEditando(null);
      setFormData({ nome: '', tipo: 'entrada' });
      setErros({});
      carregarCategorias();
      alert('✅ ' + (editando ? 'Categoria atualizada!' : 'Categoria criada!'));
    } else {
      alert('❌ ' + result.error);
    }
  };

  const handleEditar = (cat) => {
    setFormData({ nome: cat.nome, tipo: cat.tipo });
    setEditando(cat);
    setMostraForm(true);
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza?')) {
      await deletarCategoria(id);
      carregarCategorias();
    }
  };

  const entradas = categorias.filter(c => c.tipo === 'entrada');
  const saidas = categorias.filter(c => c.tipo === 'saida');

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <style>{`
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-appear { animation: slideDown 0.3s ease-out; }
        .row-appear { animation: fadeIn 0.3s ease-out; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '25px', fontWeight: '700', color: '#333' }}>🏷️ Categorias</h2>

      <button
        onClick={() => { setMostraForm(!mostraForm); setEditando(null); setFormData({ nome: '', tipo: 'entrada' }); }}
        className="btn-hover"
        style={{ padding: '12px 28px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: '600' }}
      >
        ➕ Nova Categoria
      </button>

      {mostraForm && (
        <form onSubmit={handleSubmit} className="form-appear" style={{ marginBottom: '30px', padding: '25px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Ex: Vendas, Estoque..."
                style={{ width: '100%', padding: '11px 14px', border: erros.nome ? '2px solid #ff6b6b' : '1.5px solid #ddd', borderRadius: '8px', fontSize: '15px', transition: 'all 0.2s', boxSizing: 'border-box' }} />
              {erros.nome && <small style={{ color: '#ff6b6b', marginTop: '4px', display: 'block' }}>{erros.nome}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>Tipo</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '15px', transition: 'all 0.2s', boxSizing: 'border-box' }}>
                <option value="entrada">📥 Entrada</option>
                <option value="saida">📤 Saída</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-hover" style={{ padding: '11px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px', fontSize: '15px', fontWeight: '600' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} className="btn-hover" style={{ padding: '11px 24px', background: '#aaa', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>❌ Cancelar</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <h3 style={{ color: '#2f9e44', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>📥 Entradas</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#d3f9d8', borderBottom: '2px solid #2f9e44' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Nome</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {entradas.length === 0 ? (
                <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>Nenhuma categoria</td></tr>
              ) : entradas.map(c => (
                <tr key={c.id} className="row-appear" style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{c.nome}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditar(c)} className="btn-hover" style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px', fontSize: '14px' }}>✏️</button>
                    <button onClick={() => handleDeletar(c.id)} className="btn-hover" style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ color: '#c92a2a', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>📤 Saídas</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#ffe0e0', borderBottom: '2px solid #c92a2a' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Nome</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {saidas.length === 0 ? (
                <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>Nenhuma categoria</td></tr>
              ) : saidas.map(c => (
                <tr key={c.id} className="row-appear" style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{c.nome}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditar(c)} className="btn-hover" style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px', fontSize: '14px' }}>✏️</button>
                    <button onClick={() => handleDeletar(c.id)} className="btn-hover" style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Categorias;