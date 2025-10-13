/****************************************************
 * Projeto: Topbus123 — Diagnóstico do Sistema
 * Autor: Rodrigo Alves
 * Stack: Google Apps Script + Sheets + Drive
 ****************************************************/

/** ===== CONFIGURAÇÃO ===== **/
const ENABLE_DEBUG = true;

/****************************************************
 * ===== TESTES DO SISTEMA =====
 ****************************************************/

function runAllTests() {
  log_('🚀 Iniciando bateria de testes...\n');
  
  // Testa acesso à planilha
  testPlanilha();
  
  // Testa acesso ao Drive
  testDrive();
  
  // Testa MIME types
  testMimeTypes();
  
  log_('\n✅ Testes concluídos!');
}

function testPlanilha() {
  log_('📊 Testando acesso à planilha...');
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Aba '${SHEET_NAME}' não encontrada!`);
    }
    
    // Testa permissões de escrita
    const testRow = sheet.getLastRow() + 1;
    sheet.getRange(testRow, 1).setValue('TESTE');
    sheet.getRange(testRow, 1).clear();
    
    log_('✅ Planilha OK!');
    log_(`📝 URL: ${ss.getUrl()}`);
    
  } catch (err) {
    log_(`❌ Erro na planilha: ${err}`);
    throw err;
  }
}

function testDrive() {
  log_('📁 Testando acesso ao Drive...');
  
  try {
    // Testa pasta principal
    const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    log_(`✅ Pasta principal OK: ${mainFolder.getName()}`);
    log_(`📂 URL: ${mainFolder.getUrl()}`);
    
    // Testa criação de arquivo
    const testFile = mainFolder.createFile('test.txt', 'Teste de escrita');
    log_('✅ Permissão de escrita OK');
    
    // Testa compartilhamento
    testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    log_('✅ Permissão de compartilhamento OK');
    
    // Limpa arquivo de teste
    testFile.setTrashed(true);
    
    // Testa estrutura de pastas
    const now = new Date();
    const dailyFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
    log_(`✅ Estrutura de pastas OK: ${getFolderPath_(dailyFolder)}`);
    
  } catch (err) {
    log_(`❌ Erro no Drive: ${err}`);
    throw err;
  }
}

function testMimeTypes() {
  log_('🔍 Testando MIME types...');
  
  const testCases = [
    // Casos que devem passar
    { type: 'image/jpeg', name: 'foto.jpg' },
    { type: 'image/png', name: 'screenshot.png' },
    { type: 'video/mp4', name: 'video.mp4' },
    { type: 'audio/mpeg', name: 'audio.mp3' },
    
    // Casos que devem falhar
    { type: 'text/html', name: 'pagina.html' },
    { type: 'application/javascript', name: 'script.js' },
    { type: 'application/x-msdownload', name: 'programa.exe' }
  ];
  
  testCases.forEach(test => {
    const allowed = /^(image|audio|video)\//.test(test.type);
    log_(`${allowed ? '✅' : '❌'} ${test.name}: ${allowed ? 'Permitido' : 'Bloqueado'}`);
  });
}

/****************************************************
 * ===== DIAGNÓSTICO DE PROBLEMAS =====
 ****************************************************/

function diagnosticarProblema() {
  log_('🔍 Iniciando diagnóstico...');
  
  try {
    // 1. Verifica configurações
    log_('\n📋 Verificando configurações...');
    log_(`Sheet ID: ${SHEET_ID_RECLAMACOES}`);
    log_(`Sheet Name: ${SHEET_NAME}`);
    log_(`Drive Folder: ${DRIVE_FOLDER_ID}`);
    
    // 2. Verifica permissões do script
    log_('\n🔐 Verificando permissões...');
    const scriptApp = ScriptApp.getAuthMode();
    log_(`Auth Mode: ${scriptApp}`);
    
    // 3. Testa limites de quota
    log_('\n📊 Verificando quotas...');
    const quotaRemaining = DriveApp.getRemainingDailyQuota();
    log_(`Drive Quota Restante: ${quotaRemaining}`);
    
    // 4. Verifica configurações de compartilhamento
    log_('\n🔗 Verificando compartilhamento...');
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const access = folder.getSharingAccess();
    const permission = folder.getSharingPermission();
    log_(`Acesso: ${access}`);
    log_(`Permissão: ${permission}`);
    
    log_('\n✅ Diagnóstico concluído sem erros!');
    return true;
    
  } catch (err) {
    log_(`\n❌ Erro no diagnóstico: ${err}`);
    return false;
  }
}

/****************************************************
 * ===== FUNÇÕES AUXILIARES =====
 ****************************************************/

function getFolderPath_(folder) {
  const path = [];
  let current = folder;
  
  while (current && current.getParents().hasNext()) {
    path.unshift(current.getName());
    current = current.getParents().next();
  }
  
  return path.join('/');
}

function log_(msg) {
  if (ENABLE_DEBUG) {
    console.log(msg);
    Logger.log(msg);
  }
}