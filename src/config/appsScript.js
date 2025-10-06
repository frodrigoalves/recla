const FALLBACK_APPS_URL =
  "https://script.google.com/macros/s/AKfycbwdFNyYGTT5F2J4uyfsiOV9DfBhkPYjFqiYVIQh9TJ73rgzO9ES8QFdb5lx7GM9siqDRA/exec";

const envUrl = import.meta.env.VITE_APPSCRIPT_URL;
const APPS_URL = envUrl || FALLBACK_APPS_URL;

if (!envUrl) {
  console.warn("VITE_APPSCRIPT_URL ausente no build. Usando fallback padrão do Apps Script publicado.");
}

export const appsScriptUrl = APPS_URL;
