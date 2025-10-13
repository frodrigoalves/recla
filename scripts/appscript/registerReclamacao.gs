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
        try {
          // Verifica se o ID da pasta é válido
          const testAccess = DriveApp.getFolderById(DRIVE_FOLDER_ID);
          if (!testAccess) {
            throw new Error('ID da pasta do Drive inválido ou sem permissão de acesso');
          }

          const dayFolder = getDailyFolder_(DRIVE_FOLDER_ID, now);
          if (!dayFolder) {
            throw new Error('Não foi possível criar/acessar a pasta do dia');
          }

          for (const key of Object.keys(e.files)) {
            try {
              const blob = e.files[key];
              if (!blob) {
                console.error(`Arquivo inválido para a chave ${key}`);
                continue;
              }

              const mt = (blob.getContentType() || '').toLowerCase();
              console.log(`Processando arquivo: ${blob.getName() || key} (${mt})`);

              if (!/^(image|audio|video)\//.test(mt)) {
                console.log(`Tipo não permitido: ${mt}`);
                continue;
              }

              const size = (blob.getBytes() || []).length;
              if (size > MB15) {
                throw new Error(`Arquivo acima de 15MB (${blob.getName() || key}).`);
              }

              const safeName = sanitizeName_(blob.getName());
              const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmssSSS');
              const final = `${proto}__${stamp}__${safeName || 'arquivo.bin'}`;

              console.log(`Salvando arquivo: ${final}`);
              const saved = dayFolder.createFile(blob).setName(final);
              
              if (!saved) {
                throw new Error(`Falha ao criar arquivo: ${final}`);
              }

              saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              anexosURLs.push(`https://drive.google.com/uc?export=view&id=${saved.getId()}`);
              console.log(`Arquivo salvo com sucesso: ${final}`);
            } catch (fileError) {
              console.error(`Erro ao processar arquivo ${key}:`, fileError);
              throw fileError;
            }
          }
        } catch (driveError) {
          console.error('Erro no processamento do Drive:', driveError);
          throw new Error(`Erro no armazenamento: ${driveError.message}`);
        }
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
  try {
    console.log(`Acessando pasta raiz: ${rootFolderId}`);
    const root = DriveApp.getFolderById(rootFolderId);
    if (!root) {
      throw new Error('Pasta raiz não encontrada');
    }

    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const day = ('0' + dateObj.getDate()).slice(-2);

    console.log(`Criando/acessando estrutura de pastas: ${year}/${month}/${day}`);
    
    let yearFolder = getOrCreate_(root, year.toString());
    if (!yearFolder) throw new Error('Falha ao criar/acessar pasta do ano');

    let monthFolder = getOrCreate_(yearFolder, month);
    if (!monthFolder) throw new Error('Falha ao criar/acessar pasta do mês');

    let dayFolder = getOrCreate_(monthFolder, day);
    if (!dayFolder) throw new Error('Falha ao criar/acessar pasta do dia');

    console.log('Estrutura de pastas criada/acessada com sucesso');
    return dayFolder;
  } catch (error) {
    console.error('Erro ao criar estrutura de pastas:', error);
    throw error;
  }
}

function getOrCreate_(parent, name) {
  try {
    console.log(`Procurando/criando pasta: ${name}`);
    const it = parent.getFoldersByName(name);
    
    if (it.hasNext()) {
      console.log(`Pasta existente encontrada: ${name}`);
      return it.next();
    }
    
    console.log(`Criando nova pasta: ${name}`);
    const newFolder = parent.createFolder(name);
    
    if (!newFolder) {
      throw new Error(`Falha ao criar pasta: ${name}`);
    }
    
    console.log(`Nova pasta criada: ${name}`);
    return newFolder;
  } catch (error) {
    console.error(`Erro ao acessar/criar pasta ${name}:`, error);
    throw error;
  }
}

function sanitizeName_(name) {
  return (name || '').replace(/[^\w.-]+/g, '_');
}
