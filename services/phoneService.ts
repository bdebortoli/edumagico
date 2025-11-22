export const formatarTelefone = (telefone: string): string => {
  // Remove caracteres não numéricos
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  // Aplica máscara: (XX) XXXXX-XXXX
  if (telefoneLimpo.length <= 2) {
    return telefoneLimpo;
  } else if (telefoneLimpo.length <= 7) {
    return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2)}`;
  } else {
    return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2, 7)}-${telefoneLimpo.slice(7, 11)}`;
  }
};

export const validarTelefone = (telefone: string): boolean => {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  // Deve ter 10 ou 11 dígitos (com ou sem DDD)
  return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
};

