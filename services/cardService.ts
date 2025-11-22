// Máscara para número de cartão: 0000 0000 0000 0000
export const formatarNumeroCartao = (numero: string): string => {
  // Remove caracteres não numéricos
  const numeroLimpo = numero.replace(/\D/g, '');
  
  // Limita a 16 dígitos
  const numeroLimitado = numeroLimpo.slice(0, 16);
  
  // Aplica máscara: 0000 0000 0000 0000
  const grupos = [];
  for (let i = 0; i < numeroLimitado.length; i += 4) {
    grupos.push(numeroLimitado.slice(i, i + 4));
  }
  
  return grupos.join(' ');
};

// Máscara para data de validade: MM/AA
export const formatarDataValidade = (data: string): string => {
  // Remove caracteres não numéricos
  const dataLimpa = data.replace(/\D/g, '');
  
  // Limita a 4 dígitos
  const dataLimitada = dataLimpa.slice(0, 4);
  
  // Aplica máscara: MM/AA
  if (dataLimitada.length <= 2) {
    return dataLimitada;
  } else {
    return `${dataLimitada.slice(0, 2)}/${dataLimitada.slice(2, 4)}`;
  }
};

// Máscara para CVC: 000 (3 dígitos)
export const formatarCVC = (cvc: string): string => {
  // Remove caracteres não numéricos
  const cvcLimpo = cvc.replace(/\D/g, '');
  
  // Limita a 3 dígitos
  return cvcLimpo.slice(0, 3);
};

// Validação de número de cartão (Luhn algorithm básico)
export const validarNumeroCartao = (numero: string): boolean => {
  const numeroLimpo = numero.replace(/\D/g, '');
  return numeroLimpo.length >= 13 && numeroLimpo.length <= 19;
};

// Validação de data de validade
export const validarDataValidade = (data: string): boolean => {
  const dataLimpa = data.replace(/\D/g, '');
  if (dataLimpa.length !== 4) return false;
  
  const mes = parseInt(dataLimpa.slice(0, 2));
  const ano = parseInt(dataLimpa.slice(2, 4));
  
  // Mês deve ser entre 01 e 12
  if (mes < 1 || mes > 12) return false;
  
  // Ano deve ser válido (considerando anos futuros)
  const anoAtual = new Date().getFullYear() % 100;
  return ano >= anoAtual;
};

// Validação de CVC
export const validarCVC = (cvc: string): boolean => {
  const cvcLimpo = cvc.replace(/\D/g, '');
  return cvcLimpo.length === 3;
};

