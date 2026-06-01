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
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', marginTop: 0, marginBottom: '25px' }}>🏷️ Categorias</h2>

      <button
        onClick={() => { setMostraForm(!mostraForm); setEditando(null); setFormData({ nome: '', tipo: 'entrada' }); }}
        style={{ padding: '14px 32px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '30px', fontSize: '16px', fontWeight: 'bold' }}
      >
        ➕ Nova Categoria
      </button>

      {mostraForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '25px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Ex: Vendas, Estoque, Aluguel..."
                style={{ width: '100%', padding: '10px', border: erros.nome ? '2px solid #c92a2a' : '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }} />
              {erros.nome && <small style={{ color: '#c92a2a' }}>{erros.nome}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tipo</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px' }}>
                <option value="entrada">📥 Entrada (receita)</option>
                <option value="saida">📤 Saída (despesa)</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ padding: '12px 28px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '12px', fontSize: '16px', fontWeight: 'bold' }}>💾 Salvar</button>
          <button type="button" onClick={() => { setMostraForm(false); setErros({}); }} style={{ padding: '12px 28px', background: '#999', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>❌ Cancelar</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <h3 style={{ color: '#2f9e44', marginBottom: '15px' }}>📥 Categorias de Entrada</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#d3f9d8', borderBottom: '2px solid #2f9e44' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {entradas.length === 0 ? (
                <tr><td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Nenhuma categoria</td></tr>
              ) : entradas.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{c.nome}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditar(c)} style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>✏️</button>
                    <button onClick={() => handleDeletar(c.id)} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ color: '#c92a2a', marginBottom: '15px' }}>📤 Categorias de Saída</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#ffe0e0', borderBottom: '2px solid #c92a2a' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {saidas.length === 0 ? (
                <tr><td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#999' }}>Nenhuma categoria</td></tr>
              ) : saidas.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{c.nome}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEditar(c)} style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>✏️</button>
                    <button onClick={() => handleDeletar(c.id)} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
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