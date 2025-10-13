/**
 * Script de Sincronização Apps Script - Frontend
 * Monitora mudanças no frontend e sincroniza com Apps Script
 */
import { google } from 'googleapis';
import fs from 'fs';
import process from 'process';
import chokidar from 'chokidar';
import dotenv from 'dotenv';

dotenv.config();

// Configurações
const CONFIG = {
  // ID do projeto Apps Script (da URL do editor)
  scriptId: process.env.APPS_SCRIPT_ID,
  
  // Arquivos para monitorar
  watchPaths: [
    './src/features/reclamacao/**/*.{js,jsx}',
    './src/services/*.js',
    './scripts/appscript/*.gs'
  ],
  
  // Mapeamento de campos frontend → Apps Script
  fieldMapping: {
    'src/features/reclamacao/components/StepDados.jsx': {
      watch: ['formFields', 'validationSchema'],
      update: ['COLS', 'validatePayload']
    },
    'src/features/reclamacao/constants.js': {
      watch: ['TIPOS_ONIBUS', 'LINHAS'],
      update: ['getCatalogo']
    }
  },

  // Credenciais do Google Cloud
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/script.projects']
  }
};

class AppsScriptSync {
  constructor() {
    this.script = null;
    this.watcher = null;
    this.auth = null;
    this.initialized = false;
    this.libraryId = process.env.LIBRARY_ID;
    this.webappId = process.env.WEBAPP_ID;
  }

  async init() {
    try {
      // Configura autenticação
      this.auth = new google.auth.GoogleAuth({
        credentials: CONFIG.credentials,
        scopes: CONFIG.credentials.scopes
      });

      // Inicializa API do Apps Script
      this.script = google.script({ version: 'v1', auth: this.auth });
      
      console.log('✅ Conectado ao Google Apps Script');
      this.initialized = true;

      // Inicia monitoramento
      this.startWatching();

    } catch (error) {
      console.error('❌ Erro ao inicializar:', error);
    }
  }

  startWatching() {
    if (!this.initialized) {
      console.error('❌ Sistema não inicializado');
      return;
    }

    // Configura watcher
    this.watcher = chokidar.watch(CONFIG.watchPaths, {
      ignored: /(^|[\/\\])\../, // Ignora arquivos ocultos
      persistent: true
    });

    // Eventos
    this.watcher
      .on('change', path => this.handleFileChange(path))
      .on('add', path => console.log('📁 Novo arquivo:', path))
      .on('unlink', path => console.log('🗑️ Arquivo removido:', path));

    console.log('👀 Monitorando mudanças...');
  }

  async handleFileChange(filePath) {
    try {
      console.log('🔄 Arquivo modificado:', filePath);

      // Verifica se arquivo está mapeado
      const mapping = CONFIG.fieldMapping[filePath];
      if (!mapping) {
        console.log('ℹ️ Arquivo não mapeado para sincronização');
        return;
      }

      // Lê conteúdo do arquivo
      const content = fs.readFileSync(filePath, 'utf8');

      // Analisa mudanças
      const changes = this.analyzeChanges(content, mapping.watch);
      if (changes.length === 0) {
        console.log('✨ Nenhuma mudança relevante detectada');
        return;
      }

      // Atualiza Apps Script
      await this.updateAppsScript(changes, mapping.update);
      console.log('✅ Apps Script atualizado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao processar mudança:', error);
    }
  }

  analyzeChanges(content, fields) {
    const changes = [];

    fields.forEach(field => {
      // Detecta mudanças nos campos especificados
      const regex = new RegExp(`${field}\\s*=\\s*({[\\s\\S]*?});`);
      const match = content.match(regex);
      
      if (match) {
        changes.push({
          field,
          value: this.parseValue(match[1])
        });
      }
    });

    return changes;
  }

  async updateAppsScript(changes, targets) {
    // Obtém código atual
    const { files } = await this.script.projects.getContent({
      scriptId: CONFIG.scriptId
    });

    // Atualiza cada arquivo necessário
    for (const file of files) {
      let content = file.source;

      targets.forEach(target => {
        const change = changes.find(c => c.field === target);
        if (change) {
          content = this.updateFileContent(content, target, change.value);
        }
      });

      // Envia atualizações
      await this.script.projects.updateContent({
        scriptId: CONFIG.scriptId,
        resource: {
          files: [{
            name: file.name,
            type: file.type,
            source: content
          }]
        }
      });
    }
  }

  updateFileContent(content, target, value) {
    // Atualiza constantes
    if (target === 'COLS') {
      return content.replace(
        /const COLS\s*=\s*\[([\s\S]*?)\];/,
        `const COLS = ${JSON.stringify(value, null, 2)};`
      );
    }

    // Atualiza funções
    if (target.startsWith('get')) {
      return content.replace(
        new RegExp(`function ${target}[\\s\\S]*?}\\s*}`),
        this.generateFunction(target, value)
      );
    }

    return content;
  }

  generateFunction(name, value) {
    return `function ${name}() {
      return ${JSON.stringify(value, null, 2)};
    }`;
  }

  parseValue(str) {
    try {
      // Remove comentários
      str = str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      return JSON.parse(str);
    } catch (e) {
      console.warn('⚠️ Erro ao parsear valor:', e);
      return str;
    }
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      console.log('👋 Monitoramento finalizado');
    }
  }
}

// Uso
const sync = new AppsScriptSync();
sync.init();

// Tratamento de saída
process.on('SIGINT', async () => {
  await sync.stop();
  process.exit();
});