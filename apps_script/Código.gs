/****************************************************
 *  FORM → GAS → DRIVE/PLANILHA (schema enxuto)
 *  - Subpastas diárias: AAAA/MM/DD
 *  - Limite: 15 MB por arquivo
 *  - Captura de IP (via parâmetro/Edge)
 *  - Tipos aceitos: image/*, audio/*, video/*
 ****************************************************/

/** ====== CONFIG ====== **/
const SHEET_ID        = '14sYnGGtCufCsZPxJVXGznurB3zL4cbyFWLE6wcPTA54'; // ← ID da sua planilha
const SHEET_NAME      = 'Publico';                                       // ← nome da aba
const PROTO_PREFIX    = 'TOP-';                                          // prefixo do protocolo
const DRIVE_FOLDER_ID = '1zXBybZ8dpLE1HmRpw0C_x3FjdVjjNUC4';             // ← pasta raiz no Drive
const MB15            = 15 * 1024 * 1024;                                // 15 MB

/** ====== SCHEMA FINAL ====== **/
const COLS = [
  'protocolo',
  'assunto',
  'data_hora_ocorrencia',
  'linha',
  'numero_veiculo',
  'local_ocorrencia',
  'sentido_viagem',
  'tipo_onibus',
  'tipo_servico',
  'descricao',
  'anexos',        // URLs públicas separadas por espaço
  'status',
  'prazo_sla',
  'resolucao',
  'data_resolucao',
  'quer_retorno',  // boolean
  'nome_completo',
  'email',
  'telefone',
  'lgpd_aceite',   // boolean
  'ip_registro',
  'created_at'     // ISO string
];

/** ====== ENDPOINTS ====== **/
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'reclamacoes', sheet: SHEET_NAME }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const now    = new Date();
    const nowISO = now.toISOString();
    const proto  = PROTO_PREFIX + Date.now();

    // IP preferencial (injetado pela Edge/Front). Mantém fallbacks.
    const ip =
      (e?.parameter?.ip_registro) ||
      e?.parameter?.ip ||
      e?.parameter?.['X-Forwarded-For'] ||
      e?.parameter?.['x-forwarded-for'] ||
      e?.context?.clientIp ||
      'IP_NAO_DETECTADO';

    let payload = {};
    let anexosURLs = [];

    const isMultipart = e?.postData && String(e.postData.type || '').includes('multipart/form-data');

    if (isMultipart) {
      // ===== Campos texto (names do form) =====
      payload = {
        protocolo:           e.parameter.protocolo || proto,
        assunto:             e.parameter.assunto || '',
        data_hora_ocorrencia:e.parameter.data_hora_ocorrencia || '',
        linha:               e.parameter.linha || '',
        numero_veiculo:      e.parameter.numero_veiculo || '',
        local_ocorrencia:    e.parameter.local_ocorrencia || '',
        sentido_viagem:      e.parameter.sentido_viagem || '',
        tipo_onibus:         e.parameter.tipo_onibus || '',
        tipo_servico:        e.parameter.tipo_servico || '',
        descricao:           e.parameter.descricao || '',
        status:              e.parameter.status || 'Pendente',
        prazo_sla:           e.parameter.prazo_sla || '',
        resolucao:           e.parameter.resolucao || '',
        data_resolucao:      e.parameter.data_resolucao || '',
        quer_retorno:        e.parameter.quer_retorno === 'true' || e.parameter.quer_retorno === 'on',
        nome_completo:       e.parameter.nome_completo || '',
        email:               e.parameter.email || '',
        telefone:            e.parameter.telefone || '',
        lgpd_aceite:         e.parameter.lgpd_aceite === 'true' || e.parameter.lgpd_aceite === 'on',
        ip_registro:         ip
      };

      // ===== Pasta diária (AAAA/MM/DD) =====
      const dayFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);

      // ===== Upload dos arquivos =====
      if (e.files) {
        Object.keys(e.files).forEach((key) => {
          const blob = e.files[key]; // Blob de um <input name="anexos">
          const mt   = (blob.getContentType() || '').toLowerCase();

          // aceita apenas mídia
          if (!/^image\/|^audio\/|^video\//.test(mt)) return;

          // valida tamanho (em bytes)
          const size = (blob.getBytes() || []).length;
          if (size > MB15) throw new Error(`Arquivo acima de 15MB (${blob.getName() || key}).`);

          // nome final: PROTO__YYYYMMDD_HHMMSSmmm__original.ext
          const safeName = sanitizeName_(blob.getName());
          const stamp    = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmssSSS');
          const final    = `${proto}__${stamp}__${safeName || 'arquivo.bin'}`;

          const saved = dayFolder.createFile(blob).setName(final);
          saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

          const url = `https://drive.google.com/uc?export=view&id=${saved.getId()}`;
          anexosURLs.push(url);
        });
      }

      // Se veio "anexos" como texto/JSON com URLs, mescla
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

    } else {
      return _json_({ ok: false, code: 'EMPTY_BODY', error: 'Body ausente' });
    }

    // ===== Gravação na planilha (ordem exata de COLS) =====
    const sh = _sheet_();
    const row = [
      payload.protocolo || proto,
      payload.assunto || '',
      payload.data_hora_ocorrencia || '',
      payload.linha || '',
      payload.numero_veiculo || '',
      payload.local_ocorrencia || '',
      payload.sentido_viagem || '',
      payload.tipo_onibus || '',
      payload.tipo_servico || '',
      payload.descricao || '',
      anexosURLs.join(' '),
      payload.status || 'Pendente',
      payload.prazo_sla || '',
      payload.resolucao || '',
      payload.data_resolucao || '',
      !!payload.quer_retorno,
      payload.nome_completo || '',
      payload.email || '',
      payload.telefone || '',
      !!payload.lgpd_aceite,
      payload.ip_registro || payload.ip || ip,
      nowISO
    ];

    sh.appendRow(row);
    SpreadsheetApp.flush();

    return _json_({ ok: true, protocolo: payload.protocolo || proto, anexos: anexosURLs, row: sh.getLastRow() });

  } catch (err) {
    return _json_({ ok: false, code: 'UPLOAD_ERROR', error: String(err) });
  }
}

/** ====== HELPERS ====== **/
function _sheet_(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  _ensureHeader_(sh);
  return sh;
}

function _ensureHeader_(sh){
  const rng = sh.getRange(1, 1, 1, COLS.length);
  const vals = rng.getValues()[0];
  if (!vals[0]) rng.setValues([COLS]); // escreve cabeçalho se vazio
}

/** Subpasta AAAA/MM/DD dentro de parentFolderId */
function getDailyFolder_(parentFolderId, dateObj){
  const root  = DriveApp.getFolderById(parentFolderId);
  const year  = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy');
  const month = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'MM');
  const day   = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'dd');

  const yearFolder  = getOrCreateChildFolder_(root, year);
  const monthFolder = getOrCreateChildFolder_(yearFolder, month);
  const dayFolder   = getOrCreateChildFolder_(monthFolder, day);
  return dayFolder;
}

/** Busca/Cria subpasta por nome */
function getOrCreateChildFolder_(parentFolder, name){
  const it = parentFolder.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parentFolder.createFolder(name);
}

/** Sanitiza nome do arquivo */
function sanitizeName_(name){
  return String(name || 'arquivo')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Resposta JSON */
function _json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ====================================================
 * OPCIONAL: MIGRAÇÃO DE SCHEMA (rode uma vez se precisar)
 * Cria nova aba com cabeçalho = COLS, copia apenas campos válidos
 * e renomeia a antiga com sufixo _old_YYYYMMDD_HHMMSS
 * ==================================================== */
function migrarParaNovoSchema() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const tz = Session.getScriptTimeZone();
  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmmss');

  const oldSh = ss.getSheetByName(SHEET_NAME);
  if (!oldSh) throw new Error('Aba original não encontrada: ' + SHEET_NAME);

  const oldHeader = (oldSh.getRange(1,1,1,oldSh.getLastColumn()).getValues()[0]||[]).map(String);
  if (_headersEqual_(oldHeader, COLS)) return; // já está ok

  const tempName = SHEET_NAME + '_v2_tmp';
  let tmp = ss.getSheetByName(tempName);
  if (tmp) ss.deleteSheet(tmp);
  tmp = ss.insertSheet(tempName);
  tmp.getRange(1,1,1,COLS.length).setValues([COLS]);

  const lastRow = oldSh.getLastRow();
  const lastCol = oldSh.getLastColumn();
  if (lastRow >= 2) {
    const vals = oldSh.getRange(2,1,lastRow-1,lastCol).getValues();
    const map  = {};
    oldHeader.forEach((h,i)=> map[_norm_(h)] = i);

    const aliases = {
      'ip_registro': ['ip','ip_reg','ipregistro'],
      'anexos': ['anexo','links','urls'],
      'numero_veiculo': ['numero_do_veiculo','n_veiculo','num_veiculo'],
      'data_hora_ocorrencia': ['datahora','data_hora','data_ocorrencia'],
      'nome_completo': ['nome','nome_e_sobrenome'],
      'lgpd_aceite': ['lgpd','aceite_lgpd','consentimento'],
      'quer_retorno': ['retorno','deseja_retorno','quer_contato']
    };

    const out = [];
    for (const row of vals) {
      const get = (k) => {
        const n = _norm_(k);
        if (n in map) return row[map[n]];
        const al = aliases[n] || [];
        for (const alt of al) {
          const nn = _norm_(alt);
          if (nn in map) return row[map[nn]];
        }
        return '';
      };

      const outRow = COLS.map((col) => {
        let v = get(col);
        if (col === 'anexos') v = String(v||'').replace(/\s*[,;]\s*/g,' ').replace(/\s+/g,' ').trim();
        if (col === 'lgpd_aceite' || col === 'quer_retorno') v = _toBool_(v);
        if (col === 'created_at') v = v ? _toISO_(v) : new Date().toISOString();
        if (col === 'ip_registro') v = get('ip_registro') || get('ip') || '';
        if (col !== 'created_at') v = (v===null||v===undefined)?'':v;
        return v;
      });

      out.push(outRow);
    }
    if (out.length) tmp.getRange(2,1,out.length,COLS.length).setValues(out);
  }

  tmp.setFrozenRows(1);
  tmp.getFilter() || tmp.getRange(1,1,tmp.getMaxRows(),tmp.getMaxColumns()).createFilter();

  oldSh.setName(SHEET_NAME + '_old_' + stamp);
  tmp.setName(SHEET_NAME);
}

function _norm_(s){
  return String(s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/\s+/g,'_').replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'');
}
function _headersEqual_(a,b){
  if (!a || !b || a.length !== b.length) return false;
  for (let i=0;i<a.length;i++) if (_norm_(a[i]) !== _norm_(b[i])) return false;
  return true;
}
function _toBool_(v){
  const s = String(v).trim().toLowerCase();
  return ['true','on','1','sim','yes','y'].includes(s);
}
function _toISO_(v){
  try {
    if (v instanceof Date) return v.toISOString();
    const d = new Date(String(v).trim());
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch(_) { return new Date().toISOString(); }
}
