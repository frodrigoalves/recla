# Reclamações TopBus

Aplicação em React + Vite para abertura de reclamações e consulta pública dos registros sincronizados com Google Apps Script e Google Sheets.

## Requisitos de ambiente

Crie um arquivo `.env` (ou configure as variáveis no provedor de deploy) com:

- `VITE_APPSCRIPT_URL`: endpoint do Web App publicado (URL que termina com `/exec`). Sem esse valor o formulário alerta o operador e bloqueia o envio.
- `VITE_SHEET_GVIZ`: URL pública da planilha (formato `gviz/tq`) usada no painel público.

## Scripts

| Comando          | Descrição                     |
| ---------------- | ----------------------------- |
| `npm install`    | Instala as dependências.      |
| `npm run dev`    | Sobe o ambiente de desenvolvimento na porta padrão do Vite. |
| `npm run build`  | Gera os artefatos de produção em `dist/`. |
| `npm run preview`| Pré-visualiza o build localmente. |
| `npm run lint`   | Executa o ESLint.             |

## Deploy na Netlify

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- Configure as variáveis `VITE_APPSCRIPT_URL` e `VITE_SHEET_GVIZ` em *Site settings → Build & deploy → Environment*.
- Caso o site esteja preso em um build antigo, use a opção **Clear cache and deploy site** para forçar uma nova publicação.

A configuração também está declarada em [`netlify.toml`](netlify.toml), garantindo o diretório correto mesmo em builds locais.

## Integrações

Os envios do formulário são encaminhados para o Apps Script (`doPost`) que salva as evidências no Google Drive (pastas diárias) e grava os dados em planilhas distintas para Reclamações e FTG. O painel público consome a planilha através do endpoint `gviz` informado em `VITE_SHEET_GVIZ`.

## Testes

Antes de abrir um PR, execute:

```bash
npm run lint
```

O projeto usa apenas ESLint neste momento.
