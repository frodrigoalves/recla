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
2. Defina a variável abaixo no seu `.env`:

		```env
		VITE_APPSCRIPT_URL=https://script.google.com/macros/s/AKfycbwdFNyYGTT5F2J4uyfsiOV9DfBhkPYjFqiYVIQh9TJ73rgzO9ES8QFdb5lx7GM9siqDRA/exec
		```

		Essa URL corresponde ao endpoint da versão 14.3 do Apps Script Topbus123 (Rodrigo Alves) e garante integração total entre o frontend e o backend. Certifique-se de que todos os campos do formulário estejam alinhados com o schema do backend para evitar erros de registro.

3. Não versione o arquivo `.env`; utilize apenas o `.env.example` como referência.

**Importante:** Sem essa variável o formulário não conseguirá entregar novas reclamações.

## Características do Formulário

- **Interface única**: Todos os campos em uma página, divididos em 3 seções numeradas
- **Validação em tempo real**: Campos obrigatórios são validados antes do envio
- **Upload de arquivos**: Suporte a imagens, áudio, vídeo, PDF e documentos Office (até 15MB cada)
- **Protocolo automático**: Geração automática de protocolo para acompanhamento
- **Responsivo**: Layout otimizado para desktop e mobile

### Testes do Apps Script v14.3

A versão 14.3 do Apps Script (Topbus123) inclui melhorias significativas:

#### Endpoints disponíveis

- **Health Check**: `curl -L "${VITE_APPSCRIPT_URL}?health=1"` → retorna status online
- **Catálogo**: `curl -L "${VITE_APPSCRIPT_URL}?catalogo=1"` → retorna tipos de ônibus e linhas
- **Info**: `curl -L "${VITE_APPSCRIPT_URL}"` → retorna informações da versão e endpoints

#### Recursos v14.3

- ✅ **Pasta backup**: sistema failover automático para armazenamento no Drive
- ✅ **Logs detalhados**: depuração aprimorada com timestamps
- ✅ **Validação de MIME**: aceita imagens, áudio, vídeo, PDF e documentos Office
- ✅ **Organização por data**: arquivos organizados automaticamente em pastas ano/mês/dia
- ✅ **Headers automáticos**: cabeçalhos da planilha são verificados e criados automaticamente

#### Testes recomendados

1. **Health check**: `curl -L "${VITE_APPSCRIPT_URL}?health=1"` → deve retornar `{"ok":true,"service":"topbus","status":"online"}`
2. **Formulário completo**: teste o envio com anexos via `npm run dev`
3. **Verificação na planilha**: confirme que os dados aparecem na aba **Publico**
4. **URLs no Drive**: verifique se as URLs dos arquivos estão na coluna **anexos**

> Observação: o protocolo só é exibido após a confirmação de sucesso enviada pelo Apps Script via `postMessage`.
