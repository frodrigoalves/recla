# Formulário de Reclamações TopBus

Aplicação React construída com Vite para registrar reclamações sobre o transporte coletivo. O formulário envia os dados diretamente para o Google Apps Script, que armazena as informações em planilha e os arquivos anexos no Google Drive. O projeto foi adaptado para ser publicado na Netlify sem a necessidade de versionar artefatos gerados automaticamente (como `.netlify/plugins`).

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
2. Atualize a variável `APPS_SCRIPT_URL` com o endpoint publicado do Apps Script (versão 8, implantada em 13/10/2025 04:23: `https://script.google.com/macros/s/AKfycbwbMRcY2YDufjLe1itVR6--aA1REGJTfFFI3z7WLqx8jdnA58ndc2mHkc2WRDdUf7CrQg/exec`). Essa URL é consumida pela função serverless `submit-complaint` e evita erros de CORS no navegador.
3. (Opcional) Defina `VITE_RECLAMACAO_ENDPOINT` caso queira que o frontend envie diretamente para outro endpoint (por padrão ele usa `/.netlify/functions/submit-complaint`).
4. Não versione o arquivo `.env`; utilize apenas o `.env.example` como referência.

Sem `APPS_SCRIPT_URL` o proxy serverless não conseguirá entregar novas reclamações ao backend.

## Características do Formulário

- **Interface única**: Todos os campos em uma página, divididos em 3 seções numeradas
- **Validação em tempo real**: Campos obrigatórios são validados antes do envio
- **Upload de arquivos**: Suporte a imagens, áudio, vídeo, PDF e documentos Office (até 15MB cada)
- **Protocolo automático**: Geração automática de protocolo para acompanhamento
- **Responsivo**: Layout otimizado para desktop e mobile

### Apps Script (Versão 8)

A versão 8 do Apps Script recebe os dados em JSON (estrutura `{ dados, anexos }`) e é responsável por:

- gerar o protocolo sequencial na aba `Reclamações` da planilha `1g-6_PXrPCVtwYEBx1pe7xc9CELib4btbepB2LDD0FlA`;
- salvar anexos no Drive na pasta `1U_1AHzX188eiE1jeF73OTlOmuH-kXFtB` e registrar os links na coluna **Anexos**;
- aceitar campos equivalentes (ex.: `linha`, `line`, `rota`) para facilitar compatibilidade entre versões do frontend;
- retornar um JSON com `{ success, protocolo, message }`, utilizado pelo formulário para exibir o comprovante.

#### Testes recomendados

1. **Proxy serverless**: `curl -X POST -H "Content-Type: application/json" -d '{"dados":{"assunto":"TESTE","linha":"9208","descricao":"Ping"},"anexos":[]}' http://localhost:8888/.netlify/functions/submit-complaint`
2. **Verificação na planilha**: confirme que os dados aparecem na aba **Reclamações** com o protocolo e status `Pendente`.
3. **URLs no Drive**: verifique se as URLs dos arquivos estão na coluna **Anexos** quando anexos são enviados.

> Observação: ao utilizar `VITE_RECLAMACAO_ENDPOINT` para enviar direto ao Apps Script, o serviço precisa estar com CORS liberado; do contrário, mantenha o proxy serverless ativado.
