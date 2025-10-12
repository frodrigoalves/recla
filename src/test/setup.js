import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

// Mock do fetch global
const global = window;
global.fetch = vi.fn();

// Mock das variáveis de ambiente do Vite
beforeAll(() => {
  vi.mock('vite', () => ({
    env: {
      VITE_APPSCRIPT_URL: 'https://script.google.com/macros/test-url',
      VITE_ATTACHMENTS_ENDPOINT: '/.netlify/functions/upload-attachments'
    }
  }));

  // Configuração padrão do fetch mock
  fetch.mockImplementation(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  );
});