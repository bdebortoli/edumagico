export interface CEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const buscarCEP = async (cep: string): Promise<CEPResponse | null> => {
  try {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    // Valida se tem 8 dígitos
    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos');
    }

    // Busca na API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: CEPResponse = await response.json();

    // Verifica se o CEP foi encontrado
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};

export const formatarCEP = (cep: string): string => {
  // Remove caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, '');
  
  // Aplica máscara: 00000-000
  if (cepLimpo.length <= 5) {
      return cepLimpo;
  }
  return cepLimpo.slice(0, 5) + '-' + cepLimpo.slice(5, 8);
};

