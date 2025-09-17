/** ===== CONFIG ===== **/
const SHEET_ID     = '1N-T6z_FH2EizaW3WOE6Pnr7tpASiIMTaHewc1N2ozTI';
const SHEET_NAME   = 'Publico';
const PROTO_PREFIX = 'TOP-';
const COLS = [
  'protocolo','assunto','data_hora_ocorrencia','linha','numero_veiculo',
  'local_ocorrencia','sentido_viagem','tipo_onibus','tipo_servico','descricao',
  'anexos','status','prazo_sla','resolucao','data_resolucao','quer_retorno',
  'nome_completo','email','telefone','lgpd_aceite','ip'
];
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _json({ ok:false, error:'empty body' });
    }
    const d = JSON.parse(e.postData.contents);
    const proto = PROTO_PREFIX + Date.now();
    const ip = e?.context?.clientIp || e?.parameter?.ip || 'N/A';
    const sh = _sheet();
    const anexosStr = Array.isArray(d.anexos) ? d.anexos.join(' ') : (d.anexos || '');
    const row = [
      proto,d.assunto||'',d.data_hora_ocorrencia||'',d.linha||'',d.numero_veiculo||'',
      d.local_ocorrencia||'',d.sentido_viagem||'',d.tipo_onibus||'',d.tipo_servico||'',
      d.descricao||'',anexosStr,'Pendente',d.prazo_sla||'',d.resolucao||'',
      d.data_resolucao||'',!!d.quer_retorno,d.nome_completo||'',d.email||'',
      d.telefone||'',!!d.lgpd_aceite,ip
    ];
    sh.appendRow(row);
    return _json({ ok:true, protocolo: proto });
  } catch (err) {
    return _json({ ok:false, error:String(err) });
  }
}
function doGet() { return ContentService.createTextOutput('ok'); }
function _sheet(){ const ss=SpreadsheetApp.openById(SHEET_ID); const sh=ss.getSheetByName(SHEET_NAME)||ss.insertSheet(SHEET_NAME); _ensureHeader(sh); return sh;}
function _ensureHeader(sh){ const rng=sh.getRange(1,1,1,COLS.length); const vals=rng.getValues()[0]; if(!vals[0]) rng.setValues([COLS]);}
function _json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
