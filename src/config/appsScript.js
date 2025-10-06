const FALLBACK_APPS_URL =
  "https://script.google.com/macros/s/AKfycbzDwFWYwuoxWEBXrRy-8lbTRoHesaobgAK7W1nQHgkYG0-we4SRJ0ZbE4_lvtNQ4Mnnxw/exec";

const envUrl = import.meta.env.VITE_APPSCRIPT_URL;
const APPS_URL = envUrl || FALLBACK_APPS_URL;

if (!envUrl) {
  console.warn("VITE_APPSCRIPT_URL ausente no build. Usando fallback padrão do Apps Script publicado.");
}

export const appsScriptUrl = APPS_URL;
