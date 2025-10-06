const APPS_URL = import.meta.env.VITE_APPSCRIPT_URL;

if (!APPS_URL) {
  console.warn("VITE_APPSCRIPT_URL ausente no build");
}

export const appsScriptUrl = APPS_URL;
