# Explicação do Fluxo CORS no Projeto

Este documento resume em português os pontos principais sobre o que foi implementado no proxy serverless (`netlify/functions/submit-complaint.js`) e como ele resolve os erros de *Cross-Origin Resource Sharing* (CORS) ao integrar o frontend da TopBus com o Google Apps Script.

## 1. O que é CORS?

- **Same-Origin Policy**: navegadores só permitem que uma página leia respostas vindas da mesma origem (mesmo protocolo, domínio e porta).
- **CORS**: mecanismo que permite que um servidor autorize, explicitamente, o compartilhamento de recursos entre origens diferentes.

Sem essa autorização, o navegador bloqueia a resposta e exibe erros parecidos com `No 'Access-Control-Allow-Origin' header is present on the requested resource`.

## 2. Por que precisamos do proxy?

O Apps Script não adiciona, por padrão, os cabeçalhos necessários para o domínio publicado na Netlify. Ao criar um proxy serverless, conseguimos:

1. Receber a requisição do frontend.
2. Reencaminhar os dados para o Apps Script via backend (sem restrições de navegador).
3. Devolver a resposta já com os cabeçalhos CORS adequados para o domínio do site.

## 3. Fluxo detalhado

1. **Requisição do navegador**
   - O frontend hospedado na Netlify envia uma requisição `POST` para `/.netlify/functions/submit-complaint`.
   - O navegador inclui automaticamente o cabeçalho `Origin` com a origem do site (por exemplo, `https://www.topbus.site`).

2. **Validação de pré-vôo (preflight)**
   - Por se tratar de uma requisição `POST` com `Content-Type: application/json`, o navegador dispara antes uma requisição `OPTIONS` para verificar se o servidor autoriza o método, cabeçalhos e origem.
   - A função serverless responde com `status 204` e os cabeçalhos `Access-Control-Allow-*`, sinalizando que a requisição principal pode continuar.

3. **Encaminhamento ao Apps Script**
   - Após o preflight, a função serverless encaminha o corpo da requisição original para o Apps Script (variável `APPS_SCRIPT_URL`).
   - A resposta do Apps Script é repassada de volta ao navegador.

4. **Resposta com cabeçalhos CORS**
   - Antes de devolver a resposta ao navegador, o proxy adiciona os cabeçalhos:
     - `Access-Control-Allow-Origin`
     - `Access-Control-Allow-Methods`
     - `Access-Control-Allow-Headers`
     - `Access-Control-Max-Age`
   - Isso garante que o navegador libere a leitura da resposta pelo código JavaScript do frontend.

## 4. Configuração da variável `CORS_ALLOW_ORIGIN`

O comportamento do cabeçalho `Access-Control-Allow-Origin` é controlado por uma variável de ambiente.

- **Valor padrão (`*`)**: libera o acesso para qualquer origem.
- **Valor fixo (`https://www.topbus.site`)**: restringe o consumo ao domínio informado.
- **Valor `auto`**: o proxy reflete automaticamente o valor recebido no cabeçalho `Origin` da requisição. Útil quando existem múltiplos domínios autorizados.

Para definir a variável na Netlify:

1. Abra *Site settings* → *Build & deploy* → *Environment*.
2. Crie ou edite `CORS_ALLOW_ORIGIN` com o valor desejado.
3. Faça novo deploy para aplicar a alteração.

## 5. Requisições com credenciais

Se precisar enviar cookies ou autenticação junto com a requisição:

1. No frontend, use `fetch(url, { credentials: 'include' })`.
2. No proxy, configure `CORS_ALLOW_ORIGIN` com o domínio específico (nunca `*`).
3. Adicione manualmente `Access-Control-Allow-Credentials: true` na resposta (veja a seção a seguir).

## 6. Como adaptar o proxy para credenciais

Edite `netlify/functions/submit-complaint.js` e adicione o cabeçalho extra dentro da função `buildCorsHeaders`:

```js
return {
  "Access-Control-Allow-Origin": allowOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": requestHeaders || "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};
```

> Atenção: só faça isso se `CORS_ALLOW_ORIGIN` estiver configurado para um domínio específico ou `auto`, pois o cabeçalho `Access-Control-Allow-Credentials` não pode ser usado em conjunto com `*`.

## 7. Resumo prático

- O proxy serverless serve como um intermediário entre o frontend e o Apps Script.
- Ele garante que todas as respostas tenham os cabeçalhos CORS corretos, evitando erros de bloqueio no navegador.
- A variável `CORS_ALLOW_ORIGIN` dá flexibilidade para liberar um domínio único, vários domínios (via `auto`) ou todos (`*`).
- Para requisições com credenciais, ajuste os cabeçalhos conforme descrito para manter o fluxo seguro.

Com isso, o frontend da TopBus consegue enviar reclamações, anexos e receber protocolos da API do Apps Script sem encontrar problemas de CORS.
