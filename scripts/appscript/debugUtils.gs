function debugUpload(e) {
  try {
    log_('=== Início Debug Upload ===');
    
    // Verifica se há arquivos
    if (!e.files) {
      log_('❌ Nenhum arquivo encontrado no request');
      return false;
    }
    
    // Lista todos os arquivos recebidos
    Object.keys(e.files).forEach(key => {
      const blob = e.files[key];
      log_(`
        📄 Arquivo: ${key}
        Nome: ${blob.getName()}
        Tipo: ${blob.getContentType()}
        Tamanho: ${(blob.getBytes().length / 1024).toFixed(2)}KB
      `);
    });
    
    // Testa acesso às pastas
    const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    log_(`✓ Pasta principal OK: ${mainFolder.getName()}`);
    
    const backupFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID_BACKUP);
    log_(`✓ Pasta backup OK: ${backupFolder.getName()}`);
    
    // Testa criação de estrutura de pastas
    const now = new Date();
    log_('Testando criação de estrutura de pastas...');
    
    const dailyFolder = getSafeFolder_(DRIVE_FOLDER_ID, now);
    log_(`✓ Pasta do dia criada: ${dailyFolder.getName()}`);
    
    // Verifica quotas do Drive
    const quota = DriveApp.getStorageLimit();
    const used = DriveApp.getStorageUsed();
    log_(`
      💾 Quota do Drive:
      Limite: ${(quota / 1024 / 1024 / 1024).toFixed(2)}GB
      Usado: ${(used / 1024 / 1024 / 1024).toFixed(2)}GB
      Disponível: ${((quota - used) / 1024 / 1024 / 1024).toFixed(2)}GB
    `);
    
    return true;
  } catch (err) {
    log_('❌ Erro no debug: ' + err);
    log_('Stack: ' + err.stack);
    return false;
  } finally {
    log_('=== Fim Debug Upload ===');
  }
}

function validateMimeTypes(files) {
  Object.keys(files).forEach(key => {
    const blob = files[key];
    const mt = blob.getContentType();
    log_(`
      🔍 Validando MIME type:
      Arquivo: ${key}
      Tipo: ${mt}
      Permitido: ${isAllowedMime_(mt)}
    `);
  });
}

function testBackupSystem() {
  try {
    log_('=== Teste Sistema Backup ===');
    const now = new Date();
    
    // Tenta pasta principal primeiro
    try {
      const mainFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
      log_('✓ Pasta principal OK');
    } catch (err) {
      log_('⚠️ Falha na pasta principal: ' + err);
      
      // Tenta pasta backup
      try {
        const backupFolder = getDailyFolder_(DRIVE_FOLDER_ID_BACKUP, now);
        log_('✓ Pasta backup OK');
      } catch (backupErr) {
        log_('❌ Falha também na pasta backup: ' + backupErr);
      }
    }
    
  } catch (err) {
    log_('❌ Erro geral no teste: ' + err);
  }
}

function checkPermissions() {
  const permissions = {
    drive: {
      create: false,
      delete: false,
      modify: false
    },
    sheets: {
      read: false,
      write: false
    }
  };
  
  try {
    // Testa Drive
    const testFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const testFile = testFolder.createFile('test.txt', 'test');
    permissions.drive.create = true;
    
    testFile.setName('test_renamed.txt');
    permissions.drive.modify = true;
    
    testFile.setTrashed(true);
    permissions.drive.delete = true;
    
    // Testa Sheets
    const ss = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const testRead = sheet.getRange('A1').getValue();
    permissions.sheets.read = true;
    
    sheet.getRange('A1').setValue(testRead);
    permissions.sheets.write = true;
    
  } catch (err) {
    log_('❌ Erro ao verificar permissões: ' + err);
  }
  
  log_('📝 Permissões: ' + JSON.stringify(permissions, null, 2));
  return permissions;
}