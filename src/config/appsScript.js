const FALLBACK_APPS_URL =
  "https://script.google.com/macros/s/AKfycbyO8eANUbOacdY5Hizl0Iv5teGJG1bb8L7BKbcyl6tcXk4KQYFwdjFVefKQAULq7pHGXw/exec";

const envUrl = import.meta.env.VITE_APPSCRIPT_URL;
const APPS_URL = envUrl || FALLBACK_APPS_URL;

if (!envUrl) {
  console.warn("VITE_APPSCRIPT_URL ausente no build. Usando fallback padrão do Apps Script publicado.");
}

export const appsScriptUrl = APPS_URL;
