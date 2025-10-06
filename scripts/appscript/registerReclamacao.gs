/****************************************************
 * FORM → GAS → DRIVE/PLANILHA (schema enxuto)
 ****************************************************/

// IDs reais
const SHEET_ID_RECLAMACOES = '1N-T6z_FH2EizaW3WOE6Pnr7tpASiIMTaHewc1N2ozTI';
const SHEET_NAME           = 'Publico';
const PROTO_PREFIX         = 'TOP-';

// Pasta de anexos (Drive)
const DRIVE_FOLDER_ID      = '1mvmwJWuHERKHmkZ-eh8ez7Xm7_WPigRZ';  

const MB15                 = 15 * 1024 * 1024;

/** ====== SCHEMA FINAL ====== **/
const COLS = [
  'protocolo',
  'assunto',
  'data_hora_ocorrencia',
  'linha',
  'numero_veiculo',
  'local_ocorrencia',
  'tipo_onibus',
  'descricao',
  'anexos',
  'status',
  'prazo_sla',
  'resolucao',
  'data_resolucao',
  'quer_retorno',
  'nome_completo',
  'email',
  'telefone',
  'lgpd_aceite',
  'ip'
];

/** ====== ENDPOINTS ====== **/
function doGet() {
  return _json_({
    ok: true,
    service: 'reclamacoes',
    sheets: {
      reclamacoes: SHEET_ID_RECLAMACOES,
      aba: SHEET_NAME
    }
  });
}

function doPost(e) {
  try {
    const now   = new Date();
    const proto = PROTO_PREFIX + Date.now();

    const ip =
      (e?.parameter?.ip_registro) ||
      (e?.parameter?.ip) ||
      (e?.parameter?.['X-Forwarded-For']) ||
      (e?.parameter?.['x-forwarded-for']) ||
      'IP_NAO_DETECTADO';

    let payload = {};
    let anexosURLs = [];

    const isMultipart =
      e && e.postData && String(e.postData.type || '').includes('multipart/form-data');

    if (isMultipart) {
      payload = {
        assunto:              e.parameter.assunto || '',
        data_hora_ocorrencia: e.parameter.data_hora_ocorrencia || '',
        linha:                e.parameter.linha || '',
        numero_veiculo:       e.parameter.numero_veiculo || '',
        local_ocorrencia:     e.parameter.local_ocorrencia || '',
        tipo_onibus:          e.parameter.tipo_onibus || '',
        descricao:            e.parameter.descricao || '',

        status:         e.parameter.status || 'Pendente',
        prazo_sla:      e.parameter.prazo_sla || '',
        resolucao:      e.parameter.resolucao || '',
        data_resolucao: e.parameter.data_resolucao || '',

        quer_retorno:   (e.parameter.quer_retorno === 'true' || e.parameter.quer_retorno === 'on'),
        nome_completo:  e.parameter.nome_completo || '',
        email:          e.parameter.email || '',
        telefone:       e.parameter.telefone || '',
        lgpd_aceite:    (e.parameter.lgpd_aceite === 'true' || e.parameter.lgpd_aceite === 'on'),

        ip: ip
      };

      if (DRIVE_FOLDER_ID && e.files) {
        const dayFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
        Object.keys(e.files).forEach((key) => {
          const blob = e.files[key];
          const mt   = (blob.getContentType() || '').toLowerCase();

          if (!/^(image|audio|video)\//.test(mt)) return;
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

      if (e.parameter.anexos) {
        try {
          const extra = JSON.parse(e.parameter.anexos);
          if (Array.isArray(extra)) anexosURLs = anexosURLs.concat(extra);
        } catch (_) {
          anexosURLs.push(String(e.parameter.anexos));
        }
      }

    } else if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents) || {};
      if (Array.isArray(payload.anexos)) anexosURLs = payload.anexos;
      else if (payload.anexos) anexosURLs = [payload.anexos];

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

    if (!payload.nome_completo || (!payload.email && !payload.telefone) || !payload.lgpd_aceite) {
      return _json_({ ok: false, code: 'INVALID_CONTACT', error: 'Contato/LGPD inválido' });
    }

    const sh = SpreadsheetApp.openById(SHEET_ID_RECLAMACOES).getSheetByName(SHEET_NAME);
    const row = [
      proto,
      payload.assunto || '',
      payload.data_hora_ocorrencia || '',
      payload.linha || '',
      payload.numero_veiculo || '',
      payload.local_ocorrencia || '',
      payload.tipo_onibus || '',
      payload.descricao || '',
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
