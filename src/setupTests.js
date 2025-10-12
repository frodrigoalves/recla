import '@testing-library/jest-dom';
import { beforeEach, jest, global } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn();

// Reset dos mocks entre os testes
beforeEach(() => {
  fetch.mockClear();
});

// Configuração padrão do fetch mock
global.fetch.mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);