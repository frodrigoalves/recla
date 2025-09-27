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
const DRIVE_FOLDER_ID = '1mvmwJWuHERKHmkZ-eh8ez7Xm7_WPigRZ';             // ← pasta raiz no Drive
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
  return _json_({
    ok: true,
    service: 'reclamacoes',
    sheets: {
      reclamacoes: SHEET_ID,
      aba: SHEET_NAME
    }
  });
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
      if (DRIVE_FOLDER_ID && e.files) {
        const dayFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
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

    if (payload.quer_retorno) {
      const hasContato = payload.nome_completo && (payload.email || payload.telefone);
      if (!hasContato) {
        return _json_({ ok: false, code: 'INVALID_CONTACT', error: 'Contato/LGPD inválido' });
      }
    }

    if (!payload.lgpd_aceite) {
      return _json_({ ok: false, code: 'INVALID_CONTACT', error: 'Contato/LGPD inválido' });
    }

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
function _sheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function _json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getDailyFolder_(rootFolderId, dateObj) {
  const root = DriveApp.getFolderById(rootFolderId);
  const year = dateObj.getFullYear();
  const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  const day = ('0' + dateObj.getDate()).slice(-2);

  let yearFolder = getOrCreate_(root, year.toString());
  let monthFolder = getOrCreate_(yearFolder, month);
  return getOrCreate_(monthFolder, day);
}

function getOrCreate_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function sanitizeName_(name) {
  return (name || '').replace(/[^\w.-]+/g, '_');
}
