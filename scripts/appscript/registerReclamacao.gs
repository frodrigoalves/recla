/****************************************************
 * Reclamações Topbus — WebApp (Sheets + Drive)
 * Front: POST via <form multipart> (ou JSON text/plain)
 * Autor: Rodrigo Alves — Base consolidada v12 (2025-10-06)
 ****************************************************/

/** ===== CONFIG ===== **/
const SHEET_ID_RECLAMACOES = '1N-T6z_FH2EizaW3WOE6Pnr7tpASiIMTaHewc1N2ozTI';
const SHEET_NAME           = 'Publico';
const PROTO_PREFIX         = 'TOP-';

// Pasta raiz para anexos (Drive)
const DRIVE_FOLDER_ID      = '1zXBybZ8dpLE1HmRpw0C_x3FjdVjjNUC4';
const DRIVE_FOLDER_ID_BACKUP = '1mvmwJWuHERKHmkZ-eh8ez7Xm7_WPigRZ'; // Fallback

// Tamanho máximo por arquivo (15 MB)
const MAX_BYTES            = 15 * 1024 * 1024;

// LGPD: mantenha FALSE em produção
const MAKE_ATTACHMENTS_PUBLIC = false;

const CATALOG = {
  tiposOnibus: ['Padron', 'Convencional', 'Articulado'],

  assuntos: [
    'ACESSIBILIDADE',
    'AUSÊNCIA DE AGENTE DE BORDO',
    'COMPORTAMENTO INADEQUADO DO MOTORISTA',
    'CONDIÇÕES DO VEÍCULO',
    'EXCESSO DE PASSAGEIROS',
    'FALTA DE ÔNIBUS',
    'FALTA DE PARADA',
    'HORÁRIOS / ATRASOS',
    'ITINERÁRIO / ROTA',
    'LIMPEZA DO VEÍCULO',
    'OUTROS'
  ],

  linhas: [
    '85 - EST.S.GABRIEL/CENTRO - VIA FLORESTA',
    '812 - ESTAÇÃO SÃO GABRIEL',
    '815 - ESTAÇÃO SÃO GABRIEL/CONJ. PAULO VI',
    '822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA',
    '5201 - DONA CLARA/BURITIS',
    '5401 - SÃO LUIZ/DOM CABRAL',
    '9105 - NOVA VISTA/SION',
    '9204 - SANTA EFIGÊNIA/ESTORIL',
    '9208 - TAQUARIL/CONJ. SANTA MARIA',
    '9211 - CAETANO FURQUIM/HAVAI',
    '9214 - CAETANO FURQUIM/HAVAI - VIA ALTO HAVAI',
    '9250 - CAETANO FURQUIM/NOVA CINTRA'
  ],
  veiculosPorLinha: {
    '85 - EST.S.GABRIEL/CENTRO - VIA FLORESTA': ['8501', '8502', '8503'],
    '812 - ESTAÇÃO SÃO GABRIEL': ['8121', '8122', '8123'],
    '815 - ESTAÇÃO SÃO GABRIEL/CONJ. PAULO VI': ['8151', '8152', '8153'],
    '822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA': ['8221', '8222', '8223', '1111'],
    '5201 - DONA CLARA/BURITIS': ['2020'],
    '5401 - SÃO LUIZ/DOM CABRAL': ['77777', '12345', '3030'],
    '9105 - NOVA VISTA/SION': ['20202', '2', '124444', '3333', '123456'],
    '9204 - SANTA EFIGÊNIA/ESTORIL': ['2020'],
    '9208 - TAQUARIL/CONJ. SANTA MARIA': ['123', '1', '1234569888'],
    '9211 - CAETANO FURQUIM/HAVAI': ['12345', '1234', '909090'],
    '9214 - CAETANO FURQUIM/HAVAI - VIA ALTO HAVAI': ['123456', '588'],
    '9250 - CAETANO FURQUIM/NOVA CINTRA': ['8878', '0', '666']
  }
};

/** ===== SCHEMA FINAL ===== **/
const COLS = [
  'protocolo',             // A
  'assunto',               // B
  'data_hora_ocorrencia',  // C
  'linha',                 // D
  'numero_veiculo',        // E
  'local_ocorrencia',      // F
  'tipo_onibus',           // G
  'descricao',             // H
  'anexos',                // I
  'status',                // J
  'prazo_sla',             // K
  'resolucao',             // L
  'data_resolucao',        // M
  'quer_retorno',          // N
  'nome_completo',         // O
  'email',                 // P
  'telefone',              // Q
  'lgpd_aceite',           // R
  'ip'                     // S
];

//** ===== HEALTH & CATALOGO ===== **/
function doGet(e) {
  if (e && e.parameter) {
    // ✅ Health check (mantém igual)
    if (String(e.parameter.health) === '1') {
      return _json_({ ok: true, service: 'topbus', time: new Date().toISOString() });
    }

    // ✅ Catálogo completo (corrigido)
    if (String(e.parameter.catalogo) === '1') {
      return _json_({
        ok: true,
        tipos: CATALOG.tiposOnibus,
        linhas: CATALOG.linhas,
        veiculos: CATALOG.veiculosPorLinha,
        assuntos: CATALOG.assuntos // <-- adicionado para corrigir o erro do front
      });
    }
  }

  // ✅ Resposta padrão (mantém igual)
  return _json_({
    ok: true,
    service: 'topbus',
    sheet: SHEET_NAME,
    drive: DRIVE_FOLDER_ID
  });
}

/** ===== POST ===== **/
function doPost(e) {
  try {
    const now   = new Date();
    const proto = PROTO_PREFIX + Date.now();
    const ip = (e?.parameter?.ip_registro) || (e?.parameter?.ip) || 'IP_NAO_DETECTADO';
    let payload = {};
    let anexosURLs = [];

    const isMultipart = e && e.postData && String(e.postData.type || '').includes('multipart/form-data');

    // ========== MULTIPART ==========
    if (isMultipart) {
      payload = {
        assunto:              e.parameter.assunto || '',
        data_hora_ocorrencia: e.parameter.data_hora_ocorrencia || '',
        linha:                e.parameter.linha || '',
        numero_veiculo:       e.parameter.numero_veiculo || '',
        local_ocorrencia:     e.parameter.local_ocorrencia || '',
        tipo_onibus:          e.parameter.tipo_onibus || '',
        descricao:            e.parameter.descricao || '',
        status:               e.parameter.status || 'Pendente',
        prazo_sla:            e.parameter.prazo_sla || '',
        resolucao:            e.parameter.resolucao || '',
        data_resolucao:       e.parameter.data_resolucao || '',
        quer_retorno:         (e.parameter.quer_retorno === 'true' || e.parameter.quer_retorno === 'on'),
        nome_completo:        e.parameter.nome_completo || '',
        email:                e.parameter.email || '',
        telefone:             e.parameter.telefone || '',
        lgpd_aceite:          (e.parameter.lgpd_aceite === 'true' || e.parameter.lgpd_aceite === 'on'),
        ip:                   ip
      };

      // Uploads
      if (DRIVE_FOLDER_ID && e.files) {
        const folder = getSafeFolder_(DRIVE_FOLDER_ID, now);
        Object.keys(e.files).forEach((key) => {
          const blob = e.files[key];
          const mt = (blob.getContentType() || '').toLowerCase();
          if (!isAllowedMime_(mt)) return;

          const size = blob.getBytes().length;
          if (size > MAX_BYTES) throw new Error(`Arquivo acima de 15MB (${blob.getName()})`);

          const safeName = sanitizeName_(blob.getName());
          const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmssSSS');
          const final = `${proto}__${stamp}__${safeName || 'arquivo.bin'}`;
          const saved = folder.createFile(blob).setName(final);

          if (MAKE_ATTACHMENTS_PUBLIC) {
            saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          }

          anexosURLs.push(fileLink_(saved));
        });
      }

      if (typeof e.parameter.anexos === 'object') {
        e.parameter.anexos = JSON.stringify(e.parameter.anexos);
      }

      if (e.parameter.anexos) {
        try {
          const extra = JSON.parse(e.parameter.anexos);
          if (Array.isArray(extra)) anexosURLs = anexosURLs.concat(extra);
        } catch (err) {
          anexosURLs.push(String(e.parameter.anexos));
        }
      }
    }

    // ========== JSON ==========
    else if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents) || {};
      if (Array.isArray(payload.anexos)) anexosURLs = payload.anexos;
      else if (payload.anexos) anexosURLs = [payload.anexos];

      payload.assunto              = payload.assunto || '';
      payload.data_hora_ocorrencia = payload.data_hora_ocorrencia || '';
      payload.linha                = payload.linha || '';
      payload.numero_veiculo       = payload.numero_veiculo || '';
      payload.local_ocorrencia     = payload.local_ocorrencia || '';
      payload.tipo_onibus          = payload.tipo_onibus || '';
      payload.descricao            = payload.descricao || '';
      payload.status               = payload.status || 'Pendente';
      payload.prazo_sla            = payload.prazo_sla || '';
      payload.resolucao            = payload.resolucao || '';
      payload.data_resolucao       = payload.data_resolucao || '';
      payload.quer_retorno         = payload.quer_retorno === true;
      payload.nome_completo        = payload.nome_completo || '';
      payload.email                = payload.email || '';
      payload.telefone             = payload.telefone || '';
      payload.lgpd_aceite          = payload.lgpd_aceite === true;
      payload.ip                   = payload.ip || payload.ip_registro || ip;
    }

    else {
      return respondResult_({ ok: false, error: 'Body ausente.' }, e);
    }

    // Valida contato
    if (!payload.lgpd_aceite) {
      return respondResult_({ ok: false, error: 'LGPD obrigatório' }, e);
    }

    payload.assunto = toSafeString_(payload.assunto);
    payload.data_hora_ocorrencia = toSafeString_(payload.data_hora_ocorrencia);
    payload.linha = toSafeString_(payload.linha);
    payload.numero_veiculo = toSafeString_(payload.numero_veiculo);
    payload.local_ocorrencia = toSafeString_(payload.local_ocorrencia);
    payload.tipo_onibus = toSafeString_(payload.tipo_onibus);
    payload.descricao = toSafeString_(payload.descricao);

    validatePayload_(payload);

    // Persistência
    const sh = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES).getSheetByName(SHEET_NAME);
    ensureSchemaAndFormat_(sh);
    const assunto = toSafeString_(payload.assunto);
    const dataOcorrencia = toSafeString_(payload.data_hora_ocorrencia);
    const linha = toSafeString_(payload.linha);
    const numeroVeiculo = toSafeString_(payload.numero_veiculo);
    const localOcorrencia = toSafeString_(payload.local_ocorrencia);
    const tipoOnibus = toSafeString_(payload.tipo_onibus);
    const descricao = toSafeString_(payload.descricao);
    const prazoSla = toSafeString_(payload.prazo_sla);
    const resolucao = toSafeString_(payload.resolucao);
    const dataResolucao = toSafeString_(payload.data_resolucao);
    const nomeRegistrado = toSafeString_(payload.nome_completo) || 'Não informado';
    const emailRegistrado = toSafeString_(payload.email);
    const telefoneRegistrado = toSafeString_(payload.telefone);
    const ipRegistrado = toSafeString_(payload.ip) || ip;

    const row = [
      proto,
      assunto,
      dataOcorrencia,
      linha,
      numeroVeiculo,
      localOcorrencia,
      tipoOnibus,
      descricao,
      (anexosURLs || []).map(String).join(' '),
      payload.status || 'Pendente',
      prazoSla,
      resolucao,
      dataResolucao,
      !!payload.quer_retorno,
      nomeRegistrado,
      emailRegistrado,
      telefoneRegistrado,
      !!payload.lgpd_aceite,
      ipRegistrado
    ];

    sh.appendRow(row);
    SpreadsheetApp.flush();

    return respondResult_({ ok: true, protocolo: proto, anexos: anexosURLs }, e);
  }
  catch (err) {
    return respondResult_({ ok: false, code: 'UPLOAD_ERROR', error: String(err) }, e);
  }
}

/** ===== VALIDACAO ===== **/
function validatePayload_(p) {
  if (p.assunto && CATALOG.assuntos.length && !CATALOG.assuntos.includes(p.assunto)) {
    throw new Error('Assunto inválido.');
  }
  if (p.linha && CATALOG.linhas.length && !CATALOG.linhas.includes(p.linha)) {
    throw new Error('Linha inválida.');
  }
  if (p.tipo_onibus && !CATALOG.tiposOnibus.includes(p.tipo_onibus)) {
    throw new Error('Tipo de ônibus inválido.');
  }
  if (p.numero_veiculo && p.linha) {
    const lista = CATALOG.veiculosPorLinha[p.linha] || [];
    if (lista.length && !lista.includes(p.numero_veiculo)) {
      throw new Error('Número de veículo não pertence à linha informada.');
    }
  }
}

/** ===== SHEET UTILS ===== **/
function ensureSchemaAndFormat_(sh) {
  const header = (sh.getRange(1, 1, 1, COLS.length).getValues()[0] || []).map((v) => String(v || '').trim());
  if (header.join() !== COLS.join()) sh.getRange(1, 1, 1, COLS.length).setValues([COLS]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
  const status = ['Pendente', 'Em análise', 'Resolvido', 'Indeferido'];
  const dvStatus = SpreadsheetApp.newDataValidation().requireValueInList(status, true).build();
  sh.getRange(2, 10, sh.getMaxRows() - 1, 1).setDataValidation(dvStatus);
  if (!sh.getFilter()) sh.getRange(1, 1, Math.max(2, sh.getLastRow()), COLS.length).createFilter();
}

/** ===== HELPERS ===== **/
function _json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondResult_(obj, e) {
  if (e?.parameter?.iframe === 'true') {
    const html = `
    <!doctype html><html><body>
      <script>window.parent.postMessage(${JSON.stringify(obj)}, '*');</script>
    </body></html>`;
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return _json_(obj);
}

function isAllowedMime_(mt) {
  return /^(image|audio|video)\//.test(mt) || /\b(pdf|msword|officedocument)\b/.test(mt);
}
function sanitizeName_(name) { return (name || '').replace(/[^\w.-]+/g, '_'); }
function fileLink_(file) { return 'https://drive.google.com/open?id=' + file.getId(); }

function toSafeString_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function getSafeFolder_(rootId, dateObj) {
  try { return getDailyFolder_(rootId, dateObj); }
  catch (err) {
    Logger.log('⚠️ Falha no Drive principal, tentando fallback...');
    return getDailyFolder_(DRIVE_FOLDER_ID_BACKUP, dateObj);
  }
}
function getDailyFolder_(rootId, dateObj) {
  const root = DriveApp.getFolderById(rootId);
  const y = String(dateObj.getFullYear());
  const m = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  const d = ('0' + dateObj.getDate()).slice(-2);
  const yF = getOrCreate_(root, y);
  const mF = getOrCreate_(yF, m);
  return getOrCreate_(mF, d);
}
function getOrCreate_(p, n) {
  const it = p.getFoldersByName(n);
  return it.hasNext() ? it.next() : p.createFolder(n);
}

/** ===== VERIFICAÇÕES ===== **/
function checkDriveFolderAccess() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    return { ok: true, folder: folder.getName(), url: folder.getUrl() };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function garantirCabeçalhosDeFolha() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES);
    const sh = ss.getSheetByName(SHEET_NAME);
    const headers = COLS;
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    return { ok: true, msg: 'Cabeçalhos garantidos.' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
