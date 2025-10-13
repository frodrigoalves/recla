/****************************************************
 * Projeto: Topbus123 — Testes do Sistema
 * Autor: Rodrigo Alves
 * Versão: 14.3
 ****************************************************/

function testarSistemaCompleto() {
  Logger.log('🚀 Iniciando testes completos do sistema...\n');
  
  try {
    // 1. Teste de Conexão com a Planilha
    Logger.log('📊 Teste 1: Conexão com a Planilha');
    const ss = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Aba não encontrada: ' + SHEET_NAME);
    Logger.log('✅ Planilha conectada com sucesso\n');

    // 2. Teste de Escrita na Planilha
    Logger.log('📝 Teste 2: Escrita na Planilha');
    const testRow = ['TESTE', 'TESTE', '', '', '', '', '', 'Teste automatizado', '', 
                    'Pendente', '', '', '', false, 'Teste Sistema', 
                    'teste@sistema.com', '', true, 'TESTE'];
    sheet.appendRow(testRow);
    Logger.log('✅ Escrita na planilha realizada com sucesso\n');
    
    // 3. Teste de Acesso ao Drive
    Logger.log('📁 Teste 3: Acesso ao Drive');
    const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    if (!mainFolder) throw new Error('Pasta do Drive não encontrada');
    Logger.log('✅ Pasta do Drive acessada com sucesso\n');

    // 4. Teste de Criação de Estrutura de Pastas
    Logger.log('📂 Teste 4: Estrutura de Pastas');
    const now = new Date();
    const testFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
    if (!testFolder) throw new Error('Falha ao criar estrutura de pastas');
    Logger.log('✅ Estrutura de pastas criada com sucesso\n');

    // 5. Teste de Upload de Arquivo
    Logger.log('📎 Teste 5: Upload de Arquivo');
    const testBlob = Utilities.newBlob('Conteúdo de teste', 'text/plain', 'test.txt');
    const savedFile = testFolder.createFile(testBlob);
    if (!savedFile) throw new Error('Falha ao salvar arquivo de teste');
    savedFile.setTrashed(true); // Remove o arquivo de teste
    Logger.log('✅ Upload de arquivo realizado com sucesso\n');

    // 6. Teste de API Web (doGet)
    Logger.log('🌐 Teste 6: API Web (GET)');
    const getResponse = doGet();
    const getContent = JSON.parse(getResponse.getContent());
    if (!getContent.ok) throw new Error('Falha na resposta do GET');
    Logger.log('✅ Endpoint GET funcionando corretamente\n');

    // 7. Teste de API Web (doPost)
    Logger.log('🌐 Teste 7: API Web (POST)');
    const testEvent = {
      parameter: {
        nome_completo: 'Sistema de Teste',
        email: 'teste@sistema.com',
        lgpd_aceite: 'true',
        descricao: 'Teste automatizado do sistema'
      },
      postData: {
        contents: JSON.stringify({
          nome_completo: 'Sistema de Teste',
          email: 'teste@sistema.com',
          lgpd_aceite: true,
          descricao: 'Teste automatizado do sistema'
        })
      }
    };
    const postResponse = doPost(testEvent);
    const postContent = JSON.parse(postResponse.getContent());
    if (!postContent.ok) throw new Error('Falha na resposta do POST: ' + postContent.error);
    Logger.log('✅ Endpoint POST funcionando corretamente\n');

    // 8. Teste de Validações
    Logger.log('🔍 Teste 8: Validações');
    const invalidEvent = {
      parameter: {},
      postData: {
        contents: JSON.stringify({
          nome_completo: '',
          email: '',
          lgpd_aceite: false
        })
      }
    };
    const invalidResponse = doPost(invalidEvent);
    const invalidContent = JSON.parse(invalidResponse.getContent());
    if (invalidContent.ok) throw new Error('Validação falhou ao aceitar dados inválidos');
    Logger.log('✅ Sistema de validação funcionando corretamente\n');

    Logger.log('✅ TODOS OS TESTES COMPLETADOS COM SUCESSO! 🎉\n');
    return true;

  } catch (error) {
    Logger.log(`❌ ERRO NOS TESTES: ${error}\n`);
    throw error;
  }
}

function testarTiposArquivo() {
  Logger.log('🔍 Testando tipos de arquivo permitidos...\n');
  
  const testCases = [
    { mime: 'image/jpeg', nome: 'foto.jpg', esperado: true },
    { mime: 'image/png', nome: 'screenshot.png', esperado: true },
    { mime: 'image/gif', nome: 'animacao.gif', esperado: true },
    { mime: 'video/mp4', nome: 'video.mp4', esperado: true },
    { mime: 'audio/mpeg', nome: 'audio.mp3', esperado: true },
    { mime: 'application/pdf', nome: 'documento.pdf', esperado: false },
    { mime: 'text/html', nome: 'pagina.html', esperado: false },
    { mime: 'application/javascript', nome: 'codigo.js', esperado: false },
    { mime: 'application/x-msdownload', nome: 'programa.exe', esperado: false }
  ];

  let sucessos = 0;
  let falhas = 0;

  testCases.forEach(test => {
    const resultado = /^(image|audio|video)\//.test(test.mime);
    const passou = resultado === test.esperado;
    
    if (passou) {
      sucessos++;
      Logger.log(`✅ ${test.nome}: ${resultado ? 'Permitido' : 'Bloqueado'} (correto)`);
    } else {
      falhas++;
      Logger.log(`❌ ${test.nome}: ${resultado ? 'Permitido' : 'Bloqueado'} (incorreto)`);
    }
  });

  Logger.log(`\nResultados:`);
  Logger.log(`✅ ${sucessos} testes passaram`);
  Logger.log(`❌ ${falhas} testes falharam`);
  
  return falhas === 0;
}

function testarPermissoes() {
  Logger.log('🔐 Verificando permissões do sistema...\n');
  
  try {
    // 1. Permissões do Apps Script
    Logger.log('1️⃣ Verificando permissões do Apps Script');
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('test', 'test');
    scriptProperties.deleteProperty('test');
    Logger.log('✅ Permissões do Apps Script OK\n');

    // 2. Permissões da Planilha
    Logger.log('2️⃣ Verificando permissões da Planilha');
    const ss = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES);
    const protection = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    Logger.log(`📋 Proteções ativas: ${protection.length}`);
    Logger.log('✅ Permissões da Planilha OK\n');

    // 3. Permissões do Drive
    Logger.log('3️⃣ Verificando permissões do Drive');
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const access = folder.getSharingAccess();
    const permission = folder.getSharingPermission();
    Logger.log(`📁 Acesso: ${access}`);
    Logger.log(`🔑 Permissão: ${permission}`);
    Logger.log('✅ Permissões do Drive OK\n');

    // 4. Quotas e Limites
    Logger.log('4️⃣ Verificando quotas');
    const emailQuota = MailApp.getRemainingDailyQuota();
    const driveQuota = DriveApp.getRemainingDailyQuota();
    Logger.log(`📧 Quota de emails: ${emailQuota}`);
    Logger.log(`💾 Quota do Drive: ${driveQuota}`);
    Logger.log('✅ Verificação de quotas OK\n');

    Logger.log('✅ TODAS AS PERMISSÕES VERIFICADAS COM SUCESSO! 🎉');
    return true;

  } catch (error) {
    Logger.log(`❌ ERRO NA VERIFICAÇÃO DE PERMISSÕES: ${error}`);
    throw error;
  }
}

function limparTestesDoPlanilha() {
  Logger.log('🧹 Iniciando limpeza de dados de teste...\n');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Encontra linhas de teste
    let rowsToDelete = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];
      if (row[0] === 'TESTE' || row[14] === 'Sistema de Teste' || row[14] === 'Teste Sistema') {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Remove linhas de teste
    rowsToDelete.forEach(row => {
      sheet.deleteRow(row);
    });
    
    Logger.log(`🧹 ${rowsToDelete.length} linhas de teste removidas`);
    return true;
  } catch (error) {
    Logger.log(`❌ Erro ao limpar dados de teste: ${error}`);
    throw error;
  }
}