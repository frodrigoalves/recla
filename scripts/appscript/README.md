# Configuração do Google Apps Script

Este diretório documenta como publicar o Apps Script responsável por registrar as reclamações na planilha do Google Sheets e salvar anexos no Google Drive.

## Pré-requisitos

1. Uma planilha com a aba `Publico` criada com o cabeçalho definido no script (`COLS`).
2. Uma pasta no Google Drive onde os anexos serão armazenados.
3. Acesso ao [Google Apps Script](https://script.google.com) com a mesma conta proprietária da planilha e da pasta.

## Passo a passo

1. Crie um novo projeto no Apps Script e substitua o conteúdo padrão pelo arquivo [`registerReclamacao.gs`](./registerReclamacao.gs).
2. Atualize as constantes `SHEET_ID_RECLAMACOES`, `SHEET_NAME`, `DRIVE_FOLDER_ID` e `PROTO_PREFIX` com os IDs reais do seu ambiente.
3. Em **Serviços avançados do Google**, habilite a API do Drive (`Drive v3`).
4. No menu **Implantar → Implementações**, escolha **Aplicativo da Web**, execute como o usuário proprietário e permita acesso para *Qualquer pessoa*.
5. Copie a URL de publicação e atribua à variável `VITE_APPSCRIPT_URL` no arquivo `.env` da aplicação.

Após salvar e implantar, o formulário enviará os dados via `multipart/form-data`. O script fará:

- geração automática de um protocolo (`TOP-<timestamp>`),
- validação dos campos de contato e LGPD,
- persistência dos anexos enviados no Drive (organizados em pastas por ano/mês/dia),
- registro da linha completa na planilha com os links dos anexos (Drive ou IDs externos).

Caso a função serverless da Netlify armazene anexos no Neon, os IDs retornados serão encaminhados no campo `anexos` como um array JSON, permitindo rastreio cruzado entre a planilha e o banco de dados.
