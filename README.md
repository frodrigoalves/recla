# Guia de Implantação e Smoke Test

Este repositório (`/workspace/recla`) hospeda o front-end Vite/React e o Apps Script associado ao fluxo de reclamações. Abaixo está o roteiro completo — desde o clone/local setup até o smoke test em produção no Netlify — com todos os comandos necessários.

## Pré-requisitos

- Node.js 20.x e npm atualizado (`npm i -g npm@latest`).
- Acesso ao Netlify com o site já criado (neste guia usamos `https://recla.netlify.app`).
- Apps Script publicado como Web App acessível pelo endpoint `https://script.google.com/macros/s/AKfycbyn4sKMgeEdwMB5T1qPhQiOJiAtvv4E4oG0DHyJ52Idw5q7w8aXsWfik3JOVI1Y-rH-qA/exec`.
- `netlify-cli` instalado e autenticado (`npm i -g netlify-cli && netlify login`).

> Dica: se estiver atrás de proxy, configure `npm config set proxy ...` e `npm config set https-proxy ...` antes de instalar dependências.

## Fluxo completo (Bash/Zsh – Linux, macOS, WSL)

```bash
# ===========================
# 0) Entrar no repositório
# ===========================
cd /workspace/recla

# (opcional) conferir branch
git status

# ===========================================
# 1) Estrutura de Edge Functions (Netlify)
# ===========================================
mkdir -p netlify/edge-functions

# =====================================================
# 2) Criar Edge Function /api/reclamacao (sem hardcode)
#    - Lê GAS_URL do ambiente
#    - Valida 15 MB/arquivo
#    - Injeta ip_registro
# =====================================================
cat > netlify/edge-functions/reclamacao.js <<'JS'
const GAS_URL = Netlify.env.get('GAS_URL'); // defina no Netlify
const MB15 = 15 * 1024 * 1024;

export default async (request) => {
  if (!GAS_URL) {
    return Response.json(
      { ok: false, code: 'MISSING_GAS_URL', error: 'GAS_URL não definida' },
      { status: 500 }
    );
  }

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    request.headers.get('client-ip') ||
    'IP_NAO_DETECTADO';

  const ct = request.headers.get('content-type') || '';

  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    const files = fd.getAll('anexos');

    const grandes = [];
    for (const f of files)
      if (f?.size && f.size > MB15) grandes.push(f.name || 'arquivo');
    if (grandes.length) {
      return Response.json(
        { ok: false, code: 'FILE_TOO_LARGE', maxMB: 15, files: grandes },
        { status: 413 }
      );
    }

    fd.append('ip_registro', ip);

    const res = await fetch(GAS_URL, { method: 'POST', body: fd });
    return new Response(await res.text(), {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
  }

  const body = await request.json().catch(() => ({}));
  body.ip_registro = ip;

  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  });
};
JS

# ===========================================
# 3) netlify.toml — mapear rota /api/reclamacao
# ===========================================
if [ ! -f netlify.toml ]; then
  cat > netlify.toml <<'TOML'
[[edge_functions]]
path = "/api/reclamacao"
function = "reclamacao"
TOML
else
  grep -q 'path = "/api/reclamacao"' netlify.toml || cat >> netlify.toml <<'TOML'

[[edge_functions]]
path = "/api/reclamacao"
function = "reclamacao"
TOML
fi

# ===================================================================
# 4) Helper no frontend para envio via FormData (React/Vite)
#    - Valida 15 MB/arquivo no cliente antes de enviar
# ===================================================================
mkdir -p src/api
cat > src/api/reclamacao.js <<'JS'
const API_URL = '/api/reclamacao';
const MB15 = 15 * 1024 * 1024;

/**
 * Envia o formulário para a Edge Function.
 * - Valida 15 MB/arquivo no cliente
 * - Retorna o JSON do GAS (ok, protocolo, anexos...)
 */
export async function enviarReclamacao(formEl) {
  const fd = new FormData(formEl);

  const files = formEl.querySelector('input[name="anexos"]')?.files || [];
  const grandes = [];
  for (const f of files) if (f.size > MB15) grandes.push(f.name);
  if (grandes.length) {
    return { ok: false, code: 'FILE_TOO_LARGE', maxMB: 15, files: grandes };
  }

  const resp = await fetch(API_URL, { method: 'POST', body: fd });
  const ct = resp.headers.get('content-type') || '';
  const data = ct.includes('application/json')
    ? await resp.json()
    : { ok: false, error: 'Unexpected content-type' };
  return data;
}
JS

# ===================================================================================
# 5) Commit e push das mudanças
# ===================================================================================
git add netlify/edge-functions/reclamacao.js netlify.toml src/api/reclamacao.js 2>/dev/null || \
  git add netlify/edge-functions/reclamacao.js netlify.toml

git commit -m "feat(edge): /api/reclamacao (limite 15MB, IP injetado, GAS_URL via env) + helper de envio"
git push origin main

# ==============================================================================
# 6) Netlify — linkar, setar variável GAS_URL e disparar deploy
# ==============================================================================
netlify link || true
netlify env:set GAS_URL "https://script.google.com/macros/s/AKfycbyn4sKMgeEdwMB5T1qPhQiOJiAtvv4E4oG0DHyJ52Idw5q7w8aXsWfik3JOVI1Y-rH-qA/exec"
netlify deploy --prod --build

# ===========================
# 7) Smoke tests (produção)
# ===========================
SITE="https://recla.netlify.app"

# JSON (sem arquivo)
curl -i -X POST "$SITE/api/reclamacao" \
  -H "content-type: application/json" \
  -d '{"assunto":"Smoke JSON","descricao":"sem arquivo","lgpd_aceite":true,"quer_retorno":false}'

# multipart < 15MB
curl -i -X POST "$SITE/api/reclamacao" \
  -F "assunto=Smoke multipart" \
  -F "descricao=upload teste" \
  -F "lgpd_aceite=on" \
  -F "anexos=@/caminho/arquivo-menor-15mb.jpg"

# arquivo > 15MB → deve retornar 413 FILE_TOO_LARGE
curl -i -X POST "$SITE/api/reclamacao" \
  -F "assunto=Grande" \
  -F "lgpd_aceite=on" \
  -F "anexos=@/caminho/arquivo-maior-15mb.mp4"
```

## Fluxo completo (PowerShell – Windows)

```powershell
# ===========================
# 0) Entrar no repositório
# ===========================
cd /workspace/recla
git status

# ===========================================
# 1) Estrutura de Edge Functions (Netlify)
# ===========================================
New-Item -ItemType Directory -Force -Path .\netlify\edge-functions | Out-Null

# =====================================================
# 2) Criar Edge Function /api/reclamacao (sem hardcode)
# =====================================================
@'
const GAS_URL = Netlify.env.get('GAS_URL'); // defina no Netlify
const MB15 = 15 * 1024 * 1024;

export default async (request) => {
  if (!GAS_URL) {
    return Response.json(
      { ok: false, code: 'MISSING_GAS_URL', error: 'GAS_URL não definida' },
      { status: 500 }
    );
  }

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    request.headers.get('client-ip') ||
    'IP_NAO_DETECTADO';

  const ct = request.headers.get('content-type') || '';

  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    const files = fd.getAll('anexos');

    const grandes = [];
    for (const f of files)
      if (f?.size && f.size > MB15) grandes.push(f.name || 'arquivo');
    if (grandes.length) {
      return Response.json(
        { ok: false, code: 'FILE_TOO_LARGE', maxMB: 15, files: grandes },
        { status: 413 }
      );
    }

    fd.append('ip_registro', ip);

    const res = await fetch(GAS_URL, { method: 'POST', body: fd });
    return new Response(await res.text(), {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
  }

  const body = await request.json().catch(() => ({}));
  body.ip_registro = ip;

  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  });
};
'@ | Set-Content .\netlify\edge-functions\reclamacao.js -Encoding UTF8

# ===========================================
# 3) netlify.toml — mapear rota
# ===========================================
if (-not (Test-Path .\netlify.toml)) {
@'
[[edge_functions]]
path = "/api/reclamacao"
function = "reclamacao"
'@ | Set-Content .\netlify.toml -Encoding UTF8
} elseif (-not (Get-Content .\netlify.toml | Select-String 'path = "/api/reclamacao"')) {
@'

[[edge_functions]]
path = "/api/reclamacao"
function = "reclamacao"
'@ | Add-Content .\netlify.toml
}

# ===================================================================
# 4) Helper no frontend (React/Vite)
# ===================================================================
New-Item -ItemType Directory -Force -Path .\src\api | Out-Null
@'
const API_URL = '/api/reclamacao';
const MB15 = 15 * 1024 * 1024;

export async function enviarReclamacao(formEl) {
  const fd = new FormData(formEl);
  const files = formEl.querySelector('input[name="anexos"]')?.files || [];
  const grandes = [];
  for (const f of files) if (f.size > MB15) grandes.push(f.name);
  if (grandes.length) {
    return { ok: false, code: 'FILE_TOO_LARGE', maxMB: 15, files: grandes };
  }
  const resp = await fetch(API_URL, { method: 'POST', body: fd });
  const ct = resp.headers.get('content-type') || '';
  const data = ct.includes('application/json')
    ? await resp.json()
    : { ok: false, error: 'Unexpected content-type' };
  return data;
}
'@ | Set-Content .\src\api\reclamacao.js -Encoding UTF8

# ===========================================
# 5) Commit e push
# ===========================================
git add .\netlify\edge-functions\reclamacao.js .\netlify.toml .\src\api\reclamacao.js 2>$null
git commit -m "feat(edge): /api/reclamacao (limite 15MB, IP injetado, GAS_URL via env) + helper de envio"
git push origin main

# ==============================================================================
# 6) Netlify — linkar, setar GAS_URL e deploy
# ==============================================================================
netlify link
netlify env:set GAS_URL "https://script.google.com/macros/s/AKfycbyn4sKMgeEdwMB5T1qPhQiOJiAtvv4E4oG0DHyJ52Idw5q7w8aXsWfik3JOVI1Y-rH-qA/exec"
netlify deploy --prod --build

# ===========================
# 7) Smoke tests
# ===========================
$SITE = "https://recla.netlify.app"

curl.exe -i -X POST "$SITE/api/reclamacao" `
  -H "content-type: application/json" `
  -d '{"assunto":"Smoke JSON","descricao":"sem arquivo","lgpd_aceite":true,"quer_retorno":false}'

curl.exe -i -X POST "$SITE/api/reclamacao" `
  -F "assunto=Smoke multipart" `
  -F "descricao=upload teste" `
  -F "lgpd_aceite=on" `
  -F "anexos=@C:\caminho\arquivo-menor-15mb.jpg"

curl.exe -i -X POST "$SITE/api/reclamacao" `
  -F "assunto=Grande" `
  -F "lgpd_aceite=on" `
  -F "anexos=@C:\caminho\arquivo-maior-15mb.mp4"
```

## Notas finais de governança

- Apps Script: mantenha a constante `SHEET_ID` alinhada ao documento ativo; o script já suporta colunas completas, subpastas diárias no Drive, limite de 15 MB e captura de IP.
- Planilha: após qualquer alteração de estrutura, execute `migrarParaNovoSchema()` no Apps Script para forçar o cabeçalho esperado.
- Front-end: garanta que o input de anexos siga o padrão `accept="image/*,audio/*,video/*"` com `multiple` habilitado.
- Drive: a pasta raiz deve permanecer com permissão "Qualquer pessoa com o link: Leitor"; as subpastas `AAAA/MM/DD` são criadas automaticamente pelo backend.
