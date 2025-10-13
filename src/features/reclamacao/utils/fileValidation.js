const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB por arquivo
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const ALLOWED_MIME_TYPES = new Set([
  'image/',
  'audio/',
  'video/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument'
]);

export function validateFile(file) {
  if (!file) {
    throw new Error('Arquivo inválido');
  }

  const type = (file.type || '').toLowerCase();
  const isAllowedType = Array.from(ALLOWED_MIME_TYPES).some(allowed => type.startsWith(allowed));

  if (!isAllowedType) {
    throw new Error('Tipo de arquivo não permitido');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return true;
}

export function validateFiles(files) {
  if (!Array.isArray(files)) {
    throw new Error('Lista de arquivos inválida');
  }

  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error(`Total de arquivos excede o limite de ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`);
  }

  files.forEach(validateFile);
  return true;
}

export function sanitizeFileName(name) {
  return name
    .replace(/[^a-z0-9.-]/gi, '_') // Remove caracteres especiais
    .replace(/__+/g, '_') // Remove underscores duplicados
    .toLowerCase();
}

export function processFiles(files) {
  validateFiles(files);
  return Array.from(files).map(file => ({
    file,
    name: sanitizeFileName(file.name),
    type: file.type.toLowerCase(),
    size: file.size
  }));
}