/****************************************************
 *  FORM → GAS → DRIVE/PLANILHA (schema enxuto)
 *  - Subpastas diárias: AAAA/MM/DD
 *  - Limite: 15 MB por arquivo
 *  - Captura de IP (via parâmetro/Edge)
 *  - Tipos aceitos: image/*, audio/*, video/*
 *  - Campo removido: tipo_servico
 ****************************************************/

/** ====== CONFIG ====== **/
const SHEET_ID        = '1N-T6z_FH2EizaW3WOE6Pnr7tpASiIMTaHewc1N2ozTI'; // ← ID da sua planilha
const SHEET_NAME      = 'Publico';                                       // ← nome da aba
const PROTO_PREFIX    = 'TOP-';                                          // prefixo do protocolo
const DRIVE_FOLDER_ID = '1zXBybZ8dpLE1HmRpw0C_x3FjdVjjNUC4';             // ← pasta raiz no Drive
const MB15            = 15 * 1024 * 1024;                                // 15 MB

/** ====== SCHEMA FINAL (alinhado à planilha) ====== **/
const COLS = [
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
    .createTextOutput(JSON.stringify({ ok: true, service: 'reclamacoes', sheet: SHEET_NAME }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const now   = new Date();
    const proto = PROTO_PREFIX + Date.now();

    // IP preferencial (injetado pela Edge), com fallbacks
    const ip =
      (e?.parameter?.ip_registro) ||
      e?.parameter?.ip ||
      e?.parameter?.['X-Forwarded-For'] ||
      e?.parameter?.['x-forwarded-for'] ||
      'IP_NAO_DETECTADO';

    let payload = {};
    let anexosURLs = [];

    const isMultipart = e?.postData && String(e.postData.type || '').includes('multipart/form-data');

    if (isMultipart) {
      // ===== Campos texto =====
      payload = {
        assunto:              e.parameter.assunto || '',
        data_hora_ocorrencia: e.parameter.data_hora_ocorrencia || '',
        linha:                e.parameter.linha || '',
        numero_veiculo:       e.parameter.numero_veiculo || '',
        local_ocorrencia:     e.parameter.local_ocorrencia || '',
        tipo_onibus:          e.parameter.tipo_onibus || '',
        descricao:            e.parameter.descricao || '',

        // administrativos (existem na planilha)
        status:         e.parameter.status || 'Pendente',
        prazo_sla:      e.parameter.prazo_sla || '',
        resolucao:      e.parameter.resolucao || '',
        data_resolucao: e.parameter.data_resolucao || '',

        // contato/consentimento
        quer_retorno:   e.parameter.quer_retorno === 'true' || e.parameter.quer_retorno === 'on',
        nome_completo:  e.parameter.nome_completo || '',
        email:          e.parameter.email || '',
        telefone:       e.parameter.telefone || '',
        lgpd_aceite:    e.parameter.lgpd_aceite === 'true' || e.parameter.lgpd_aceite === 'on',

        // coluna final da planilha
        ip:             ip
      };

      // ===== Upload para Drive (mídia até 15MB) =====
      if (DRIVE_FOLDER_ID) {
        const dayFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
        if (e.files) {
          Object.keys(e.files).forEach((key) => {
            const blob = e.files[key];
            const mt   = (blob.getContentType() || '').toLowerCase();

            if (!/^image\/|^audio\/|^video\//.test(mt)) return; // apenas mídia
            const size = (blob.getBytes() || []).length;
            if (size > MB15) throw new Error(`Arquivo acima de 15MB (${blob.getName() || key}).`);

            const safeName = sanitizeName_(blob.getName());
            const stamp    = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmssSSS');
            const final    = `${proto}__${stamp}__${safeName || 'arquivo.bin'}`;

            const saved = dayFolder.createFile(blob).setName(final);
            saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

            anexosURLs.push(`https://drive.google.com/uc?export=view&id=${saved.getId()}`);
          });
        }
      }

      // Links de evidência opcionais (texto/JSON)
      if (e.parameter.anexos) {
        try {
          const extra = JSON.parse(e.parameter.anexos);
          if (Array.isArray(extra)) anexosURLs = anexosURLs.concat(extra);
        } catch (_) {
          anexosURLs.push(String(e.parameter.anexos));
        }
      }

    } else if (e?.postData?.contents) {
      // ===== Fluxo JSON (sem arquivos) =====
      payload = JSON.parse(e.postData.contents) || {};
      if (Array.isArray(payload.anexos)) anexosURLs = payload.anexos;
      else if (payload.anexos) anexosURLs = [payload.anexos];

      // defaults coerentes com a planilha
      payload.status         = payload.status || 'Pendente';
      payload.prazo_sla      = payload.prazo_sla || '';
      payload.resolucao      = payload.resolucao || '';
      payload.data_resolucao = payload.data_resolucao || '';
      payload.quer_retorno   = payload.quer_retorno === true;
      payload.lgpd_aceite    = payload.lgpd_aceite === true;
      payload.ip             = payload.ip || payload.ip_registro || ip;

    } else {
      return _json_({ ok: false, code: 'EMPTY_BODY', error: 'Body ausente' });
    }

    // ===== Grava na ordem EXATA do COLS =====
    const sh = _sheet_();
    const row = [
      proto,                                  // protocolo
      payload.assunto || '',
      payload.data_hora_ocorrencia || '',
      payload.linha || '',
      payload.numero_veiculo || '',
      payload.local_ocorrencia || '',
      payload.tipo_onibus || '',
      payload.descricao || '',
      (anexosURLs || []).join(' '),           // anexos

      // administrativos
      payload.status || 'Pendente',
      payload.prazo_sla || '',
      payload.resolucao || '',
      payload.data_resolucao || '',

      // contato/consentimento
      !!payload.quer_retorno,
      payload.nome_completo || '',
      payload.email || '',
      payload.telefone || '',
      !!payload.lgpd_aceite,

      // IP → coluna 'ip'
      payload.ip || ip || 'IP_NAO_DETECTADO'
    ];

    sh.appendRow(row);
    SpreadsheetApp.flush();
    return _json_({ ok: true, protocolo: proto, anexos: anexosURLs, row: sh.getLastRow() });

  } catch (err) {
    return _json_({ ok: false, code: 'UPLOAD_ERROR', error: String(err) });
  }
}

/** ====== HELPERS ====== **/
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

function _sheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  const range = sh.getRange(1, 1, 1, COLS.length);
  const current = range.getValues()[0];
  const matches = COLS.every((col, idx) => String(current[idx] || '') === col);
  if (!matches) {
    range.setValues([COLS]);
  }

  const lastColumn = sh.getLastColumn();
  if (lastColumn > COLS.length) {
    sh.getRange(1, COLS.length + 1, 1, lastColumn - COLS.length).clearContent();
  }

  return sh;
}
