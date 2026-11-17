import { config } from "@/lib/config";

/**
 * Provider de IA plugavel. Default Gemini 2.5 Flash (tier gratis aguenta
 * geracao em lote sobre milhares de leads); Claude onde a regua exige.
 * DESVIO AUTORIZADO do megaprompt, que fixa claude-sonnet-5 — ver CLAUDE.md.
 */

export type Provider = "gemini" | "anthropic";

export type ResultadoIA = {
  ok: boolean;
  texto?: string;
  erro?: string;
  modelo?: string;
};

const TIMEOUT_MS = 45_000;

export async function gerar(
  prompt: string,
  entrada: string,
  opcoes: { modelo?: string | null } = {},
): Promise<ResultadoIA> {
  // Modelo do proprio agente (`Agent.model`) vence a config global quando e
  // Claude ou Gemini Pro: os agentes das consultorias (28/10/2026) saem do Flash porque o
  // Gemini Flash ignorava pergunta de preco e repetia pergunta ja respondida.
  // (Em 28/10 elas rodam em gemini-2.5-pro: a producao nao tem chave da Anthropic.)
  if (opcoes.modelo?.startsWith("claude-")) return gerarAnthropic(prompt, entrada, opcoes.modelo);
  if (opcoes.modelo?.startsWith("gemini-2.5-pro")) return gerarGemini(prompt, entrada, opcoes.modelo);

  const provider = ((await config("ia_provider", undefined, "gemini")) || "gemini") as Provider;
  const modelo = await config(
    "ia_model",
    undefined,
    provider === "anthropic" ? "claude-sonnet-5" : "gemini-2.5-flash",
  );

  if (provider === "anthropic") return gerarAnthropic(prompt, entrada, modelo);
  return gerarGemini(prompt, entrada, modelo);
}

async function gerarGemini(
  prompt: string,
  entrada: string,
  modelo: string,
): Promise<ResultadoIA> {
  const chave = await config("gemini_api_key", "GEMINI_API_KEY");
  if (!chave) return { ok: false, erro: "chave do Gemini nao configurada" };

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt }] },
          contents: [{ role: "user", parts: [{ text: entrada }] }],
          // thinkingBudget 0: sem isso o flash gasta tokens pensando e fica lento
          // O Pro nao aceita budget 0 (pensar e obrigatorio nele); 512 basta pra
          // seguir o roteiro sem deixar a resposta lenta.
          generationConfig: {
            temperature: 0.8,
            thinkingConfig: { thinkingBudget: modelo.includes("pro") ? 512 : 0 },
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    if (!r.ok) {
      return { ok: false, erro: `Gemini HTTP ${r.status}: ${(await r.text()).slice(0, 300)}` };
    }
    const j = (await r.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const texto = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!texto.trim()) return { ok: false, erro: "Gemini respondeu vazio" };
    return { ok: true, texto: texto.trim(), modelo };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

async function gerarAnthropic(
  prompt: string,
  entrada: string,
  modelo: string,
): Promise<ResultadoIA> {
  const chave = await config("anthropic_api_key", "ANTHROPIC_API_KEY");
  if (!chave) return { ok: false, erro: "chave da Anthropic nao configurada" };

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
        // recusa do classificador de seguranca cai pro modelo reserva na
        // mesma chamada, em vez de virar contorno pro lead
        "anthropic-beta": "server-side-fallback-2026-07-01",
      },
      body: JSON.stringify({
        model: modelo,
        // Os modelos atuais pensam antes de responder e o pensamento conta no
        // teto: com 1024 a resposta saia cortada. Conversa de WhatsApp = esforco baixo.
        max_tokens: 8000,
        output_config: { effort: "low" },
        fallbacks: "default",
        system: prompt,
        messages: [{ role: "user", content: entrada }],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!r.ok) {
      return { ok: false, erro: `Anthropic HTTP ${r.status}: ${(await r.text()).slice(0, 300)}` };
    }
    const j = (await r.json()) as {
      stop_reason?: string;
      content?: Array<{ type?: string; text?: string }>;
    };
    if (j.stop_reason === "refusal") return { ok: false, erro: "Anthropic recusou a resposta" };
    if (j.stop_reason === "max_tokens") return { ok: false, erro: "Anthropic cortou a resposta (max_tokens)" };
    // So blocos de texto: os de pensamento vem no mesmo array.
    const texto = j.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("") ?? "";
    if (!texto.trim()) return { ok: false, erro: "Anthropic respondeu vazio" };
    return { ok: true, texto: texto.trim(), modelo };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}
