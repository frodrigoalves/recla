export function createPageUrl(page) {
  if (page === "NovaReclamacao") return "/nova";
  if (page === "Dashboard") return "/painel";
  return "/";
}
