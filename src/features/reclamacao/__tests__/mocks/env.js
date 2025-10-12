import { vi } from 'vitest';

// Mock para import.meta.env no ambiente de teste
const mockEnv = {
  VITE_APPSCRIPT_URL: "https://script.google.com/macros/test-url",
  VITE_ATTACHMENTS_ENDPOINT: "/.netlify/functions/upload-attachments"
};

vi.mock("../../vite-env.d.ts", () => ({
  import: {
    meta: {
      env: mockEnv
    }
  }
}));