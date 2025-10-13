// Tipos de erro conhecidos
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  UPLOAD: 'UPLOAD_ERROR',
  API: 'API_ERROR',
  NETWORK: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Classe personalizada para erros da aplicação
export class AppError extends Error {
  constructor(type, message, details = null) {
    super(message);
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Função central para tratamento de erros
export function handleError(error, context = '') {
  // Log do erro
  console.error(`[${context}] ${error.message}`, {
    type: error.type || ErrorTypes.UNKNOWN,
    details: error.details || error.stack,
    timestamp: error.timestamp || new Date().toISOString()
  });

  // Transforma erros comuns em AppError
  if (!(error instanceof AppError)) {
    if (error.name === 'NetworkError') {
      return new AppError(
        ErrorTypes.NETWORK,
        'Erro de conexão. Verifique sua internet.',
        error.message
      );
    }
    
    if (error.name === 'TypeError') {
      return new AppError(
        ErrorTypes.VALIDATION,
        'Erro de validação nos dados.',
        error.message
      );
    }

    return new AppError(
      ErrorTypes.UNKNOWN,
      'Ocorreu um erro inesperado.',
      error.message
    );
  }

  return error;
}

// Função para gerar mensagem amigável para o usuário
export function getUserFriendlyMessage(error) {
  switch (error.type) {
    case ErrorTypes.VALIDATION:
      return 'Verifique os dados informados e tente novamente.';
    
    case ErrorTypes.UPLOAD:
      return 'Erro ao enviar arquivos. Verifique o tamanho e formato dos arquivos.';
    
    case ErrorTypes.API:
      return 'Erro ao processar sua solicitação. Tente novamente em alguns minutos.';
    
    case ErrorTypes.NETWORK:
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    
    default:
      return 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.';
  }
}

// Hook para tratamento de erros em componentes
export function useErrorHandler(onError) {
  return async (error, context) => {
    const handled = handleError(error, context);
    const userMessage = getUserFriendlyMessage(handled);
    
    if (onError) {
      onError(userMessage, handled);
    }
    
    return handled;
  };
}