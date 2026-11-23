/**
 * Proteções de acesso do painel hospedado (senha de entrada igual para todos os clientes):
 * limite de tentativas de login e troca obrigatória da senha no primeiro acesso.
 * Regras puras aqui; o banco é lido por quem chama.
 */

export const LIMITE_FALHAS = 5;
export const JANELA_FALHAS_MS = 15 * 60 * 1000;
export const COOKIE_TROCAR_SENHA = "trocar_senha";
export const TAMANHO_MINIMO_SENHA = 8;

/** Desde quando contar falhas de login de um e-mail. */
export function inicioDaJanela(agora = new Date()): Date {
  return new Date(agora.getTime() - JANELA_FALHAS_MS);
}

export function bloqueadoPorFalhas(falhasNaJanela: number): boolean {
  return falhasNaJanela >= LIMITE_FALHAS;
}

export function normalizarEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Por que a senha nova não serve, ou null se serve. */
export function motivoSenhaRecusada(nova: string, confirmacao: string, senhaInicial: string): string | null {
  if (nova !== confirmacao) return "As duas senhas não são iguais.";
  if (nova.length < TAMANHO_MINIMO_SENHA) return `A senha precisa de ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  if (nova.trim().toLowerCase() === senhaInicial.toLowerCase()) return "Escolha uma senha diferente da senha de entrada.";
  return null;
}

/** Caminhos que continuam abertos enquanto a troca da senha está pendente. */
export function liberadoDuranteTroca(caminho: string): boolean {
  return (
    caminho === "/primeiro-acesso" ||
    caminho.startsWith("/api/") ||
    caminho === "/login" ||
    caminho.startsWith("/_next/")
  );
}

export function cookieTrocarSenha(seguro: boolean, ligado: boolean): string {
  const partes = [`${COOKIE_TROCAR_SENHA}=${ligado ? "1" : ""}`, `Max-Age=${ligado ? 30 * 24 * 60 * 60 : 0}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (seguro) partes.push("Secure");
  return partes.join("; ");
}
