export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(valor));
  } catch (error) {
    return 'R$ 0,00';
  }
};

export const formatarDecimal = (valor, casas = 2) => {
  if (valor === null || valor === undefined || isNaN(valor)) return '0,00';
  try {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(parseFloat(valor));
  } catch (error) {
    return '0,00';
  }
};

export const formatarNumeroAbreviado = (valor, casas = 2) => {
  if (valor === null || valor === undefined || isNaN(valor)) return '0';
  const numero = Math.abs(parseFloat(valor));
  const sinal = parseFloat(valor) < 0 ? '-' : '';
  const unidades = [
    { limite: 1e12, simbolo: 'T' },
    { limite: 1e9, simbolo: 'B' },
    { limite: 1e6, simbolo: 'M' },
    { limite: 1e3, simbolo: 'K' },
  ];
  for (const unidade of unidades) {
    if (numero >= unidade.limite) {
      return sinal + (numero / unidade.limite).toFixed(casas) + unidade.simbolo;
    }
  }
  return sinal + numero.toFixed(casas);
};