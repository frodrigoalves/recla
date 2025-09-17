export const User = {
  async me() {
    // Mock temporário: sempre retorna admin
    // Depois pode trocar para autenticação real (Supabase, Firebase, etc)
    return { role: "admin" };
  },
};
