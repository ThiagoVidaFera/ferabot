/* rastreio.js — rastreamento Meta padrão das suas páginas (FeraBot).
 *
 * Carregar DEPOIS do snippet do pixel, com o pixel no atributo:
 *   <script src="/rastreio.js" data-pixel="SEU_PIXEL_ID" defer></script>
 *
 * O que faz sozinho, ao carregar:
 *   - guarda a origem (utm_*, fbclid, ad_id) por 90 dias: primeiro toque e último toque.
 *     Lead que volta dias depois pelo Google ou direto continua atribuído ao anúncio.
 *   - grava o cookie _fbc a partir do fbclid (o pixel às vezes não grava a tempo do envio).
 *   - repassa as UTMs para links de checkout (Hotmart, Cakto, Guru, Kiwify, PerfectPay).
 *
 * O que a página chama:
 *   FeraRastreio.dados("Lead")          -> objeto pra mandar junto no POST do formulário (campo `rastreio`)
 *   FeraRastreio.track("Lead", {...})   -> fbq track com o MESMO eventID que foi no POST (deduplica com a CAPI)
 *   FeraRastreio.identificar({email, telefone, nome}) -> correspondência avançada no pixel
 */
(function () {
  "use strict";
  var DIAS = 90;
  var CHAVE = "fera_rt";
  var PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "ad_id", "placement", "fbclid"];
  var CHECKOUTS = /(^|\.)(hotmart\.com|pay\.hotmart\.com|cakto\.com\.br|digitalmanager\.guru|kiwify\.com\.br|perfectpay\.com\.br)$/i;

  var script = document.currentScript;
  var PIXEL = (script && script.getAttribute("data-pixel")) || "";

  function cookie(nome) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + nome + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  function gravarCookie(nome, valor) {
    var host = location.hostname.split(".");
    var dominio = host.length > 2 ? "." + host.slice(-2).join(".") : location.hostname;
    if (/\.com\.br$/.test(location.hostname) && host.length > 3) dominio = "." + host.slice(-3).join(".");
    document.cookie = nome + "=" + encodeURIComponent(valor) + "; max-age=" + DIAS * 86400 + "; path=/; domain=" + dominio + "; SameSite=Lax";
  }
  function ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch (e) { return {}; }
  }
  function salvar(v) {
    try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) { /* modo privado: segue sem guardar */ }
  }

  // 1. origem desta visita
  var url = new URLSearchParams(location.search);
  var agora = {};
  PARAMS.forEach(function (k) { if (url.get(k)) agora[k] = url.get(k); });
  var guardado = ler();
  var expirou = guardado.em && Date.now() - guardado.em > DIAS * 86400000;
  if (expirou) guardado = {};
  if (Object.keys(agora).length) {
    agora.em = Date.now();
    agora.url = location.href.split("#")[0];
    guardado = { primeiro: guardado.primeiro || agora, ultimo: agora, em: Date.now() };
    salvar(guardado);
  }

  // 2. _fbc a partir do fbclid (formato fixo da Meta: fb.1.<ms>.<fbclid>)
  if (agora.fbclid && cookie("_fbc").split(".").pop() !== agora.fbclid) {
    gravarCookie("_fbc", "fb.1." + Date.now() + "." + agora.fbclid);
  }

  // 3. um eventID por evento por carregamento de página
  var ids = {};
  function eventId(nome) {
    if (!ids[nome]) ids[nome] = String(nome).toLowerCase() + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
    return ids[nome];
  }

  function origem() {
    return guardado.ultimo || {};
  }

  function dados(nomeEvento) {
    var o = origem();
    var d = {
      fbc: cookie("_fbc") || (o.fbclid ? "fb.1." + (o.em || Date.now()) + "." + o.fbclid : ""),
      fbp: cookie("_fbp"),
      event_id: eventId(nomeEvento || "Lead"),
      client_user_agent: navigator.userAgent,
      origem_url: location.href.split("#")[0],
    };
    PARAMS.forEach(function (k) { if (k !== "fbclid" && (url.get(k) || o[k])) d[k] = url.get(k) || o[k]; });
    if (guardado.primeiro && guardado.primeiro.utm_campaign) d.primeiro_toque = guardado.primeiro.utm_campaign;
    return d;
  }

  function track(nome, params) {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", nome, params || {}, { eventID: eventId(nome) });
  }

  // Correspondência avançada: o fbq faz o hash sozinho. Chamar depois que o lead digitou.
  function identificar(p) {
    if (typeof window.fbq !== "function" || !PIXEL || !p) return;
    var ud = {};
    if (p.email) ud.em = String(p.email).trim().toLowerCase();
    var fone = String(p.telefone || "").replace(/\D/g, "").replace(/^0+/, "");
    if (fone) ud.ph = fone.length === 10 || fone.length === 11 ? "55" + fone : fone;
    var nome = String(p.nome || "").trim().toLowerCase().split(/\s+/);
    if (nome[0]) ud.fn = nome[0];
    if (nome.length > 1) ud.ln = nome[nome.length - 1];
    if (p.external_id) ud.external_id = String(p.external_id);
    window.fbq("init", PIXEL, ud);
  }

  // 4. UTMs seguem para o checkout (a venda volta atribuída pela plataforma)
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    try {
      var destino = new URL(a.href);
      if (!CHECKOUTS.test(destino.hostname)) return;
      var o = dados("InitiateCheckout");
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
        if (o[k] && !destino.searchParams.get(k)) destino.searchParams.set(k, o[k]);
      });
      // Hotmart lê origem do `src`/`sck`; os outros ignoram sem quebrar.
      if (/hotmart/i.test(destino.hostname) && o.utm_campaign && !destino.searchParams.get("sck")) {
        destino.searchParams.set("sck", [o.utm_source, o.utm_campaign, o.utm_content].filter(Boolean).join("|").slice(0, 120));
      }
      a.href = destino.toString();
    } catch (err) { /* link estranho: deixa como está */ }
  }, true);

  window.FeraRastreio = { dados: dados, track: track, identificar: identificar, eventId: eventId, origem: origem };
})();
