# Biblioteca Topbus123 - Gestão de Reclamações v14.3

Este diretório contém o código da biblioteca do Google Apps Script responsável por registrar reclamações na planilha e gerenciar anexos no Drive.

## Informações do Deploy

- **ID da Biblioteca**: `11sizcsJ5PW-zMb7rpthjCrzRM1O4df8b7GXmIOsLCm69ECta0j-4rXJG`
- **Versão**: 14 (06/10/2025)
- **URL do Web App**: `https://script.google.com/macros/s/AKfycbwdFNyYGTT5F2J4uyfsiOV9DfBhkPYjFqiYVIQh9TJ73rgzO9ES8QFdb5lx7GM9siqDRA/exec`

## Pré-requisitos

1. Uma planilha com a aba `Publico` criada com o cabeçalho definido em `COLS`
2. Uma pasta no Google Drive para armazenar anexos
3. Acesso ao [Google Apps Script](https://script.google.com) com conta proprietária

## Como Usar a Biblioteca

### 1. Adicionar ao seu Projeto

1. No editor do Apps Script, clique em "Biblioteca +" na barra lateral
2. Cole o ID: `11sizcsJ5PW-zMb7rpthjCrzRM1O4df8b7GXmIOsLCm69ECta0j-4rXJG`
3. Selecione a versão 14
4. Clique em "Adicionar"

### 2. Configurar Ambiente

```javascript
// Configure suas credenciais
const CONFIG = {
  SHEET_ID: 'seu_id_da_planilha',
  SHEET_NAME: 'nome_da_aba',
  DRIVE_FOLDER: 'id_da_pasta_drive'
};

// Exemplo de uso
function registrarReclamacao() {
  const dados = {
    assunto: 'Atraso',
    descricao: 'Ônibus atrasou 30 minutos',
    nome_completo: 'João Silva',
    email: 'joao@email.com',
    lgpd_aceite: true
  };
  
  const resultado = Topbus.registrar(dados);
  Logger.log(resultado);
}
```

## Funcionalidades

O script gerencia automaticamente:

1. **Protocolo**: Gera `TOP-<timestamp>` único
2. **Validação**: Verifica contato e LGPD
3. **Anexos**:
   - Salva no Drive (pastas ano/mês/dia)
   - Suporta imagens, áudio e vídeo
   - Limite de 15MB por arquivo
4. **Planilha**: Registra com links dos anexos
5. **Integração**: Suporta IDs externos (Neon/Netlify)

## API Web

- **GET /exec?health=1**: Status do serviço
- **GET /exec?catalogo=1**: Lista linhas/tipos
- **POST /exec**: Registra reclamação
