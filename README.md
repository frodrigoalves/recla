# Painel Público de Reclamações

Aplicação React construída com Vite para exibir, em tempo real, as manifestações registradas em uma planilha do Google Sheets. O projeto foi adaptado para ser publicado na Netlify sem a necessidade de versionar artefatos gerados automaticamente (como `.netlify/plugins`).

## Pré-requisitos

- Node.js 20+
- npm 10+

## Scripts disponíveis

- `npm run dev`: executa o ambiente de desenvolvimento com Vite.
- `npm run build`: gera a versão de produção. Antes da build, o script `prebuild` remove qualquer pasta `.netlify` local para evitar que arquivos de plugins sejam reenviados ao repositório.
- `npm run lint`: roda o ESLint.
- `npm run preview`: visualiza a build de produção localmente.
- `npm run deploy`: realiza a build e executa `netlify deploy --prod` (requer o CLI da Netlify configurado).
- `npm run clean:netlify`: remove manualmente a pasta `.netlify` caso ela tenha sido criada por algum plugin local.

## Evitando o versionamento de `.netlify/plugins`

1. Não crie arquivos dentro de `.netlify` manualmente. Essa pasta é gerada pelos plugins da Netlify e **não** deve ser enviada ao Git.
2. Sempre que o diretório aparecer após rodar o projeto localmente, execute `npm run clean:netlify` antes de realizar commits.
3. O script `prebuild` já remove a pasta automaticamente, garantindo que o deploy na Netlify não fique travado por arquivos indesejados.

## Configuração do ambiente

1. Copie o arquivo `.env.example` para `.env`.
2. Preencha `VITE_SHEET_GVIZ` com a URL pública da planilha do Google Sheets que abastece o painel.
3. Defina `VITE_APPSCRIPT_URL` com o endpoint publicado do Apps Script (por exemplo, `https://script.google.com/macros/s/COLOQUE_AQUI/exec`). Essa variável é utilizada pelo formulário React para enviar os dados via `multipart/form-data` diretamente para o Apps Script.
4. Não versione o arquivo `.env`; utilize apenas o `.env.example` como referência.

Sem essas variáveis o painel público exibirá uma mensagem de erro e não carregará dados, e o formulário não conseguirá entregar novas reclamações.

### Variáveis de ambiente na Netlify

1. No painel da Netlify, acesse **Site settings → Environment variables** e defina `Key = VITE_APPSCRIPT_URL` com o valor do Apps Script publicado.
2. Após atualizar a variável, realize um novo deploy. Se o cache persistir a URL antiga, utilize **Clear cache and deploy site** para garantir que o build receba a env correta.
3. A Vite injeta `import.meta.env.VITE_APPSCRIPT_URL` em tempo de build. Portanto, qualquer alteração exige novo deploy para refletir no bundle final.

### Testes do Apps Script

1. Valide o endpoint com uma chamada `GET` rápida: `curl "${VITE_APPSCRIPT_URL}?health=1"`. O retorno deve ser um JSON com `ok: true`.
2. Inicie o ambiente (`npm run dev`) e preencha o formulário, anexando ao menos um arquivo (até 15MB). O envio é feito através de um `<iframe>` oculto para contornar CORS; após a resposta do Apps Script, o protocolo é exibido na tela.
3. Confirme que a reclamação criada aparece na aba **Publico** da planilha vinculada e que os anexos foram gravados na pasta do Google Drive configurada no Apps Script.

> Observação: o protocolo só é exibido após a confirmação de sucesso enviada pelo Apps Script via `postMessage`.

### Checklist de QA em produção

- Abra o console do navegador e execute `import.meta.env.VITE_APPSCRIPT_URL`; a URL do Apps Script precisa aparecer.
- Inspecione o elemento `<form>` do embed/publicação e confirme `action=https://script.google.com/.../exec` sem atributos `data-netlify` ou `netlify`.
- Envie uma reclamação de teste e, na aba **Network**, verifique o `POST` direto para `script.google.com/.../exec` retornando `200`.
