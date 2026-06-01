import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ======================== AUTENTICAÇÃO ========================

export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ======================== CAIXA ========================

export const getCaixa = async () => {
  try {
    const { data, error } = await supabase.from('caixa').select('*').single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, data: { saldo: 0 }, error: error.message };
  }
};

const atualizarCaixa = async (novoSaldo) => {
  const { data: caixaAtual } = await supabase.from('caixa').select('id').single();
  if (!caixaAtual) {
    await supabase.from('caixa').insert([{ saldo: novoSaldo }]);
  } else {
    await supabase.from('caixa').update({ saldo: novoSaldo, atualizado_em: new Date() }).eq('id', caixaAtual.id);
  }
};

// ======================== CATEGORIAS ========================

export const getCategorias = async () => {
  try {
    const { data, error } = await supabase.from('categorias').select('*').eq('ativo', true).order('nome');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

export const criarCategoria = async (categoria) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('categorias').insert([{ ...categoria, criado_por: user?.id }]).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const atualizarCategoria = async (id, categoria) => {
  try {
    const { data, error } = await supabase.from('categorias').update(categoria).eq('id', id).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletarCategoria = async (id) => {
  try {
    const { data, error } = await supabase.from('categorias').update({ ativo: false }).eq('id', id).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ======================== TRANSAÇÕES ========================

export const getTransacoes = async () => {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .select('*, categorias(nome, tipo)')
      .is('deletado_em', null)
      .order('data_transacao', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

export const criarTransacao = async (transacao) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: caixaAtual } = await supabase.from('caixa').select('saldo').single();
    const saldoAtual = parseFloat(caixaAtual?.saldo || 0);
    const valor = parseFloat(transacao.valor);

    let novoSaldo;
    if (transacao.tipo === 'entrada') {
      novoSaldo = saldoAtual + valor;
    } else {
      if (saldoAtual < valor) throw new Error('Saldo insuficiente no caixa');
      novoSaldo = saldoAtual - valor;
    }

    const { data, error } = await supabase.from('transacoes').insert([{
      descricao: transacao.descricao,
      tipo: transacao.tipo,
      categoria_id: transacao.categoria_id,
      valor,
      data_transacao: transacao.data_transacao ? transacao.data_transacao + 'T12:00:00' : new Date(),
      saldo_apos: novoSaldo,
      criado_por: user?.id
    }]).select();

    if (error) throw error;

    await atualizarCaixa(novoSaldo);

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletarTransacao = async (id) => {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .update({ deletado_em: new Date() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};