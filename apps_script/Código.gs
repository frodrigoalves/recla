/****************************************************
 *  FORM → GAS → DRIVE/PLANILHA (schema enxuto)
 *  - Subpastas diárias: AAAA/MM/DD
 *  - Limite: 15 MB por arquivo
 *  - Captura de IP (via parâmetro/Edge)
 *  - Tipos aceitos: image/*, audio/*, video/*
 *  - Campo removido: tipo_servico
 ****************************************************/

/** ====== CONFIG ====== **/
const FTG_SHEET_ID        = '1XP1R-bZgiBJP_B1eEVEHOUfNqx3kw6T6tXu03GZuaA4'; // ← planilha FTG
const RECLAM_SHEET_ID     = '1N-T6z_FH2EizaW3WOE6Pnr7tpASiIMTaHewc1N2ozTI'; // ← planilha pública
const RECLAM_SHEET_NAME   = 'Publico';                                       // ← aba pública
const RECLAM_PROTO_PREFIX = 'TOP-';                                          // prefixo do protocolo
const RECLAM_DRIVE_FOLDER = '1zXBybZ8dpLE1HmRpw0C_x3FjdVjjNUC4';             // ← pasta raiz no Drive
const MB15                = 15 * 1024 * 1024;                                // 15 MB
const CONTACT_REQUIRED_MSG = 'Informe e-mail ou telefone para receber retorno.';

/** ====== SCHEMA FINAL (alinhado à planilha) ====== **/
const RECLAM_COLS = [
  'protocolo',
  'assunto',
  'data_hora_ocorrencia',
  'linha',
  'numero_veiculo',
  'local_ocorrencia',
  'tipo_onibus',
  'descricao',
  'anexos',        // URLs públicas separadas por espaço
  'status',        // default: "Pendente"
  'prazo_sla',
  'resolucao',
  'data_resolucao',
  'quer_retorno',  // boolean
  'nome_completo',
  'email',
  'telefone',
  'lgpd_aceite',   // boolean
  'ip'             // <- nome exato da coluna na planilha
];

/** ====== ENDPOINTS ====== **/
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      services: {
        reclamacoes: {
          sheetId: RECLAM_SHEET_ID,
          sheet: RECLAM_SHEET_NAME,
          drive: RECLAM_DRIVE_FOLDER
        },
        ftg: {
          sheetId: FTG_SHEET_ID
        }
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const now = new Date();
    const ip = getIp_(e);
    const isMultipart = e?.postData && String(e.postData.type || '').includes('multipart/form-data');

    if (isMultipart) {
      return handleReclamacaoMultipart_(e, now, ip);
    }

    if (!e?.postData?.contents) {
      return _json_({ ok: false, code: 'EMPTY_BODY', error: 'Body ausente' });
    }

    let payload;
    try {
      payload = parseJsonObject_(e.postData.contents);
    } catch (err) {
      return _json_({ ok: false, code: 'INVALID_JSON', error: String(err).replace(/^Error: /, '') });
    }
    const table = String(payload.table || e?.parameter?.table || '').trim();

    if (table) {
      return handleFTGJson_(table, payload.values);
    }

    return handleReclamacaoJson_(payload, now, ip);

  } catch (err) {
    return _json_({ ok: false, code: 'UPLOAD_ERROR', error: String(err) });
  }
}

/** ====== HELPERS (GENÉRICOS) ====== **/
function _json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeName_(name) {
  const cleaned = String(name || '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
  return cleaned.substring(0, 200);
}

function getDailyFolder_(rootId, date) {
  const tz = Session.getScriptTimeZone();
  const year  = Utilities.formatDate(date, tz, 'yyyy');
  const month = Utilities.formatDate(date, tz, 'MM');
  const day   = Utilities.formatDate(date, tz, 'dd');

  let folder = DriveApp.getFolderById(rootId);
  folder = getOrCreateFolder_(folder, year);
  folder = getOrCreateFolder_(folder, month);
  folder = getOrCreateFolder_(folder, day);
  return folder;
}

function getOrCreateFolder_(parent, name) {
  const iterator = parent.getFoldersByName(name);
  if (iterator.hasNext()) {
    return iterator.next();
  }
  return parent.createFolder(name);
}

function toBool_(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function getIp_(e) {
  return (
    (e?.parameter?.ip_registro) ||
    e?.parameter?.ip ||
    e?.parameter?.['X-Forwarded-For'] ||
    e?.parameter?.['x-forwarded-for'] ||
    'IP_NAO_DETECTADO'
  );
}

function parseJsonObject_(contents) {
  let data;
  try {
    data = JSON.parse(contents);
  } catch (err) {
    throw new Error('INVALID_JSON: ' + err);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('INVALID_JSON: objeto esperado');
  }

  return data;
}

/** ====== RECLAMAÇÕES ====== **/
function handleReclamacaoMultipart_(e, now, ip) {
  const payload = buildReclamacaoPayload_(e.parameter || {}, ip);
  const contactError = ensureContactInfo_(payload);
  if (contactError) {
    return _json_({ ok: false, code: 'CONTACT_REQUIRED', error: contactError });
  }

  const proto = RECLAM_PROTO_PREFIX + Date.now();
  const anexosUploads = uploadReclamacaoFiles_(e.files, proto, now);
  const extraLinks = normalizeAnexosInput_(e?.parameter?.anexos);
  const anexos = anexosUploads.concat(extraLinks);

  return appendReclamacao_(payload, anexos, proto, now);
}

function handleReclamacaoJson_(payload, now, ip) {
  const normalized = buildReclamacaoPayload_(payload, ip);
  const contactError = ensureContactInfo_(normalized);
  if (contactError) {
    return _json_({ ok: false, code: 'CONTACT_REQUIRED', error: contactError });
  }

  const proto = RECLAM_PROTO_PREFIX + Date.now();
  const anexos = normalizeAnexosInput_(payload?.anexos);
  return appendReclamacao_(normalized, anexos, proto, now);
}

function buildReclamacaoPayload_(source, fallbackIp) {
  const payload = {
    assunto:              String(source.assunto || ''),
    data_hora_ocorrencia: String(source.data_hora_ocorrencia || ''),
    linha:                String(source.linha || ''),
    numero_veiculo:       String(source.numero_veiculo || ''),
    local_ocorrencia:     String(source.local_ocorrencia || ''),
    tipo_onibus:          String(source.tipo_onibus || ''),
    descricao:            String(source.descricao || ''),

    status:         String(source.status || 'Pendente'),
    prazo_sla:      String(source.prazo_sla || ''),
    resolucao:      String(source.resolucao || ''),
    data_resolucao: String(source.data_resolucao || ''),

    quer_retorno: toBool_(source.quer_retorno),
    nome_completo: String(source.nome_completo || ''),
    email:         String(source.email || '').trim(),
    telefone:      String(source.telefone || '').trim(),
    lgpd_aceite:   toBool_(source.lgpd_aceite),

    ip: String(source.ip || source.ip_registro || fallbackIp || 'IP_NAO_DETECTADO')
  };

  return payload;
}

function ensureContactInfo_(payload) {
  if (!payload.quer_retorno) {
    return '';
  }

  const hasEmail = !!payload.email;
  const hasPhone = !!payload.telefone;
  return hasEmail || hasPhone ? '' : CONTACT_REQUIRED_MSG;
}

function appendReclamacao_(payload, anexosURLs, proto, now) {
  const sheet = getReclamSheet_();
  const row = [
    proto,
    payload.assunto,
    payload.data_hora_ocorrencia,
    payload.linha,
    payload.numero_veiculo,
    payload.local_ocorrencia,
    payload.tipo_onibus,
    payload.descricao,
    (anexosURLs || []).join(' '),

    payload.status || 'Pendente',
    payload.prazo_sla || '',
    payload.resolucao || '',
    payload.data_resolucao || '',

    !!payload.quer_retorno,
    payload.nome_completo || '',
    payload.email || '',
    payload.telefone || '',
    !!payload.lgpd_aceite,
    payload.ip || 'IP_NAO_DETECTADO'
  ];

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  return _json_({ ok: true, protocolo: proto, anexos: anexosURLs, row: sheet.getLastRow() });
}

function uploadReclamacaoFiles_(files, proto, now) {
  if (!RECLAM_DRIVE_FOLDER || !files) {
    return [];
  }

  const urls = [];
  const dayFolder = getDailyFolder_(RECLAM_DRIVE_FOLDER, now);
  const keys = Object.keys(files || {});

  keys.forEach((key) => {
    const blob = files[key];
    if (!blob) return;

    const mt = String(blob.getContentType() || '').toLowerCase();
    if (!/^(image|audio|video)\//.test(mt)) return;

    const size = (blob.getBytes() || []).length;
    if (size > MB15) {
      throw new Error(`Arquivo acima de 15MB (${blob.getName() || key}).`);
    }

    const safeName = sanitizeName_(blob.getName());
    const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmssSSS');
    const final = `${proto}__${stamp}__${safeName || 'arquivo.bin'}`;

    const saved = dayFolder.createFile(blob).setName(final);
    saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    urls.push(`https://drive.google.com/uc?export=view&id=${saved.getId()}`);
  });

  return urls;
}

function normalizeAnexosInput_(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeAnexosInput_(parsed);
      }
    } catch (err) {
      // segue fluxo original quando não é JSON
    }

    return [trimmed];
  }

  return [];
}

function getReclamSheet_() {
  const ss = SpreadsheetApp.openById(RECLAM_SHEET_ID);
  const sh = ss.getSheetByName(RECLAM_SHEET_NAME) || ss.insertSheet(RECLAM_SHEET_NAME);
  ensureFixedHeader_(sh, RECLAM_COLS);
  return sh;
}

function ensureFixedHeader_(sh, cols) {
  const range = sh.getRange(1, 1, 1, cols.length);
  const current = range.getValues()[0];
  const matches = cols.every((col, idx) => String(current[idx] || '') === col);
  if (!matches) {
    range.setValues([cols]);
  }

  const lastColumn = sh.getLastColumn();
  if (lastColumn > cols.length) {
    sh.getRange(1, cols.length + 1, 1, lastColumn - cols.length).clearContent();
  }
}

/** ====== FTG ====== **/
function handleFTGJson_(table, values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return _json_({ ok: false, code: 'INVALID_VALUES', error: 'Objeto "values" é obrigatório.' });
  }

  const sheet = getFTGSheet_(table);
  const header = mergeFTGHeader_(sheet, Object.keys(values));
  ensureDynamicHeader_(sheet, header);

  const row = header.map((key) => formatCellValue_(values[key]));
  sheet.appendRow(row);
  SpreadsheetApp.flush();

  const rowNumber = sheet.getLastRow();
  return _json_({ ok: true, table: table, id: String(rowNumber), row: rowNumber });
}

function getFTGSheet_(tabName) {
  const sheetName = tabName || 'Geral';
  const ss = SpreadsheetApp.openById(FTG_SHEET_ID);
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function mergeFTGHeader_(sheet, keys) {
  const existing = getCurrentHeader_(sheet);
  const header = existing.slice();
  (keys || []).forEach((key) => {
    const normalized = String(key || '').trim();
    if (!normalized) return;
    if (header.indexOf(normalized) === -1) {
      header.push(normalized);
    }
  });
  return header;
}

function ensureDynamicHeader_(sheet, header) {
  if (!header.length) {
    return;
  }

  const current = getCurrentHeader_(sheet);
  let needsUpdate = header.length !== current.length;
  if (!needsUpdate) {
    needsUpdate = header.some((value, idx) => value !== current[idx]);
  }

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

function getCurrentHeader_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) {
    return [];
  }
  const values = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return values.map((value) => String(value || '').trim()).filter(Boolean);
}

function formatCellValue_(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

