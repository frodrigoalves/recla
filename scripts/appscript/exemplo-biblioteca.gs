/**
 * Exemplo de uso da biblioteca Topbus
 * ID: 11sizcsJ5PW-zMb7rpthjCrzRM1O4df8b7GXmIOsLCm69ECta0j-4rXJG
 */

// Configure suas credenciais
const CONFIG = {
  SHEET_ID: 'seu_id_da_planilha',
  SHEET_NAME: 'Publico',
  DRIVE_FOLDER_ID: 'id_da_pasta_drive'
};

/**
 * Exemplo: Registrar nova reclamação
 */
function exemploRegistrarReclamacao() {
  // Dados da reclamação
  const dados = {
    assunto: 'Atraso do ônibus',
    descricao: 'Ônibus atrasou 30 minutos no ponto.',
    data_hora_ocorrencia: new Date().toISOString(),
    linha: '9105 - NOVA VISTA/SION',
    numero_veiculo: 'AB123',
    local_ocorrencia: 'Av. Amazonas, 1234',
    tipo_onibus: 'Convencional',
    
    // Dados do reclamante
    nome_completo: 'João da Silva',
    email: 'joao@email.com',
    telefone: '31999998888',
    quer_retorno: true,
    lgpd_aceite: true
  };
  
  try {
    // Usa a biblioteca Topbus
    const resultado = Topbus.registrarReclamacao(dados);
    
    if (resultado.ok) {
      Logger.log('✅ Reclamação registrada com sucesso!');
      Logger.log('📝 Protocolo: ' + resultado.protocolo);
    } else {
      Logger.log('❌ Erro: ' + resultado.error);
    }
    
  } catch (erro) {
    Logger.log('❌ Erro ao registrar: ' + erro);
  }
}

/**
 * Exemplo: Upload de arquivo
 */
function exemploUploadAnexo() {
  // Cria um arquivo de teste
  const blob = Utilities.newBlob('Teste', 'text/plain', 'teste.txt');
  
  try {
    const resultado = Topbus.uploadAnexo(blob, 'TOP-123456');
    
    if (resultado.ok) {
      Logger.log('✅ Arquivo salvo com sucesso!');
      Logger.log('🔗 URL: ' + resultado.url);
    } else {
      Logger.log('❌ Erro: ' + resultado.error);
    }
    
  } catch (erro) {
    Logger.log('❌ Erro no upload: ' + erro);
  }
}

/**
 * Exemplo: Buscar reclamação por protocolo
 */
function exemploBuscarReclamacao() {
  const protocolo = 'TOP-123456';
  
  try {
    const resultado = Topbus.buscarReclamacao(protocolo);
    
    if (resultado.ok) {
      Logger.log('✅ Reclamação encontrada:');
      Logger.log(JSON.stringify(resultado.dados, null, 2));
    } else {
      Logger.log('❌ Erro: ' + resultado.error);
    }
    
  } catch (erro) {
    Logger.log('❌ Erro na busca: ' + erro);
  }
}

/**
 * Exemplo: Atualizar status
 */
function exemploAtualizarStatus() {
  const dados = {
    protocolo: 'TOP-123456',
    status: 'Em Análise',
    prazo_sla: '48h',
    resolucao: 'Em investigação com a empresa.'
  };
  
  try {
    const resultado = Topbus.atualizarStatus(dados);
    
    if (resultado.ok) {
      Logger.log('✅ Status atualizado com sucesso!');
    } else {
      Logger.log('❌ Erro: ' + resultado.error);
    }
    
  } catch (erro) {
    Logger.log('❌ Erro na atualização: ' + erro);
  }
}