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
3. Defina `VITE_APPSCRIPT_URL` com o endpoint publicado do Apps Script (por padrão usamos `https://script.google.com/macros/s/AKfycbyO8eANUbOacdY5Hizl0Iv5teGJG1bb8L7BKbcyl6tcXk4KQYFwdjFVefKQAULq7pHGXw/exec`). Essa variável é utilizada pelo formulário React para enviar os dados via `multipart/form-data` diretamente para o Apps Script.
4. Não versione o arquivo `.env`; utilize apenas o `.env.example` como referência.

Sem essas variáveis o painel público exibirá uma mensagem de erro e não carregará dados, e o formulário não conseguirá entregar novas reclamações.

### Testes do Apps Script

1. Valide o endpoint com uma chamada `GET` rápida: `curl "${VITE_APPSCRIPT_URL}?health=1"`. O retorno deve ser um JSON com `ok: true`.
2. Inicie o ambiente (`npm run dev`) e preencha o formulário, anexando ao menos um arquivo (até 15MB). O envio é feito através de um `<iframe>` oculto para contornar CORS; após a resposta do Apps Script, o protocolo é exibido na tela.
3. Confirme que a reclamação criada aparece na aba **Publico** da planilha vinculada e que os anexos foram gravados na pasta do Google Drive configurada no Apps Script.

> Observação: o protocolo só é exibido após a confirmação de sucesso enviada pelo Apps Script via `postMessage`.
