function testDriveFolders() {
  try {
    log_('=== Início do Teste de Pastas do Drive ===');
    
    // Teste 1: Pasta Principal
    log_('👉 Testando pasta principal...');
    try {
      const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      log_(`✅ Pasta principal OK: ${mainFolder.getName()}`);
      log_(`📂 URL: ${mainFolder.getUrl()}`);
      
      // Testa permissão de escrita
      const testFile = mainFolder.createFile('test.txt', 'test');
      log_('✅ Permissão de escrita OK na pasta principal');
      testFile.setTrashed(true); // Remove o arquivo de teste
    } catch (mainErr) {
      log_(`❌ Erro na pasta principal: ${mainErr}`);
      throw mainErr;
    }
    
    // Teste 2: Pasta Backup
    log_('👉 Testando pasta backup...');
    try {
      const backupFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID_BACKUP);
      log_(`✅ Pasta backup OK: ${backupFolder.getName()}`);
      log_(`📂 URL: ${backupFolder.getUrl()}`);
      
      // Testa permissão de escrita
      const testFileBackup = backupFolder.createFile('test_backup.txt', 'test');
      log_('✅ Permissão de escrita OK na pasta backup');
      testFileBackup.setTrashed(true); // Remove o arquivo de teste
    } catch (backupErr) {
      log_(`❌ Erro na pasta backup: ${backupErr}`);
      throw backupErr;
    }
    
    // Teste 3: Estrutura de Pastas
    log_('👉 Testando criação de estrutura de pastas...');
    const now = new Date();
    try {
      const dailyFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
      log_(`✅ Estrutura de pastas criada com sucesso: ${dailyFolder.getName()}`);
      log_(`📂 Caminho completo: ${getDailyFolderPath_(dailyFolder)}`);
    } catch (structErr) {
      log_(`❌ Erro ao criar estrutura de pastas: ${structErr}`);
      throw structErr;
    }
    
    // Teste 4: Upload de arquivo de teste
    log_('👉 Testando upload de arquivo...');
    try {
      const testBlob = Utilities.newBlob('Test content', 'text/plain', 'test.txt');
      const dailyFolder = getSafeFolder_(DRIVE_FOLDER_ID, now);
      const savedFile = dailyFolder.createFile(testBlob);
      
      if (MAKE_ATTACHMENTS_PUBLIC) {
        savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        log_('✅ Arquivo compartilhado publicamente');
      }
      
      log_(`✅ Arquivo de teste criado: ${savedFile.getName()}`);
      log_(`📄 URL: ${savedFile.getUrl()}`);
      
      // Limpa o arquivo de teste
      savedFile.setTrashed(true);
    } catch (uploadErr) {
      log_(`❌ Erro no teste de upload: ${uploadErr}`);
      throw uploadErr;
    }
    
    log_('✅ Todos os testes completados com sucesso!');
    return { ok: true, message: 'Testes do Drive concluídos com sucesso' };
    
  } catch (err) {
    log_(`❌ Falha nos testes: ${err}`);
    return { ok: false, error: String(err) };
  } finally {
    log_('=== Fim do Teste de Pastas do Drive ===');
  }
}

// Função auxiliar para obter o caminho completo de uma pasta
function getDailyFolderPath_(folder) {
  const path = [];
  let current = folder;
  
  while (current && current.getParents().hasNext()) {
    path.unshift(current.getName());
    current = current.getParents().next();
  }
  
  return path.join('/');
}

// Função para testar MIME types
function testMimeTypes() {
  const testCases = [
    { type: 'image/jpeg', name: 'foto.jpg' },
    { type: 'image/png', name: 'imagem.png' },
    { type: 'application/pdf', name: 'documento.pdf' },
    { type: 'video/mp4', name: 'video.mp4' },
    { type: 'audio/mpeg', name: 'audio.mp3' },
    { type: 'application/msword', name: 'doc.doc' },
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'docx.docx' },
    // Casos que devem falhar
    { type: 'application/x-msdownload', name: 'programa.exe' },
    { type: 'text/html', name: 'pagina.html' }
  ];
  
  log_('=== Teste de MIME Types ===');
  testCases.forEach(test => {
    const allowed = isAllowedMime_(test.type);
    log_(`${allowed ? '✅' : '❌'} ${test.name} (${test.type}): ${allowed ? 'Permitido' : 'Bloqueado'}`);
  });
}

// Função para testar o sistema de backup
function testBackupSystem() {
  log_('=== Teste do Sistema de Backup ===');
  
  try {
    // Força um erro na pasta principal
    const originalId = DRIVE_FOLDER_ID;
    DRIVE_FOLDER_ID = 'invalid_id';
    
    const now = new Date();
    const folder = getSafeFolder_(DRIVE_FOLDER_ID, now);
    
    if (folder) {
      log_(`✅ Sistema de backup funcionou: ${folder.getName()}`);
      return { ok: true, folder: folder.getName() };
    }
  } catch (err) {
    log_(`❌ Falha no sistema de backup: ${err}`);
    return { ok: false, error: String(err) };
  } finally {
    DRIVE_FOLDER_ID = originalId;
  }
}