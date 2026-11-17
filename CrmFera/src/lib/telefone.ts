// Normaliza telefone brasileiro para 55DDDNUMERO (so digitos) — chave canonica
// de identidade de contato. Portado do `normWhats` do crm-leads.
export function normalizarTelefone(bruto?: string | null): string | null {
  if (!bruto) return null;
  let d = String(bruto).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  // ja veio com DDI 55 e tamanho plausivel
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  // veio so com DDD + numero
  if (d.length === 10 || d.length === 11) return "55" + d;
  // numero solto sem DDD: nao da pra afirmar identidade
  if (d.length < 10) return null;
  return d;
}

export function primeiroNome(nome?: string | null): string {
  const n = (nome ?? "").trim();
  if (!n) return "";
  return n.split(/\s+/)[0];
}

/**
 * As duas grafias do mesmo celular brasileiro: com e sem o 9 depois do DDD.
 * O formulário guarda o número como a pessoa digita (5579900004084) e o
 * WhatsApp, para conta antiga, entrega sem o 9 (557900004084). Buscar só a
 * forma exata criou dois contatos para o mesmo lead em 27/10/2026 — um com
 * os dados do formulário, outro com a conversa.
 */
export function variantesTelefone(phone: string): string[] {
  const d = phone.replace(/\D/g, "");
  if (!d.startsWith("55")) return [d];
  const ddd = d.slice(2, 4);
  const resto = d.slice(4);
  if (resto.length === 9 && resto.startsWith("9")) return [d, `55${ddd}${resto.slice(1)}`];
  // 8 dígitos começando em 6-9 é celular sem o 9; fixo (2-5) não ganha variante
  if (resto.length === 8 && /^[6-9]/.test(resto)) return [d, `55${ddd}9${resto}`];
  return [d];
}

/**
 * Destino da resposta no canal oficial (Cloud API). A janela de 24h pertence ao
 * número EXATO que escreveu: lead cadastrado com o 9 (5511988887777) que clica
 * pelo WhatsApp de conta antiga chega como 551188887777, e a Kapso recusa (422)
 * o texto livre enviado à outra grafia. Responde-se para quem escreveu; sem
 * entrada válida, cai no telefone do cadastro.
 */
export function destinoCloudApi(
  deQuemEscreveu: string | null | undefined,
  telefoneCadastro: string,
): string {
  const exato = String(deQuemEscreveu ?? "").replace(/\D/g, "");
  if (exato.startsWith("55") && (exato.length === 12 || exato.length === 13)) return exato;
  return telefoneCadastro;
}
