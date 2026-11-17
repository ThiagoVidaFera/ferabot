import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  extrairClique,
  montarEventoWeb,
  eventoDoEstagio,
  telefoneE164,
  temSinalWeb,
  temCliqueWhatsapp,
  origemComPixelProprio,
} from "../../src/lib/rastreio-meta";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

test("extrai fbc/fbp/event_id/ad_id do payload e ignora vazio", () => {
  const c = extrairClique(
    { fbc: "fb.1.1730000000000.ABC", fbp: "fb.1.1.2", event_id: "lead-1", ad_id: "123", utm_id: "9", placement: "" },
    { ip: "200.1.1.1", ua: "Mozilla" },
  );
  assert.equal(c.fbc, "fb.1.1730000000000.ABC");
  assert.equal(c.fbp, "fb.1.1.2");
  assert.equal(c.event_id, "lead-1");
  assert.equal(c.ad_id, "123");
  assert.equal(c.utm_id, "9");
  assert.equal("placement" in c, false);
  assert.equal(c.client_ip, "200.1.1.1");
  assert.equal(c.client_ua, "Mozilla");
});

test("monta fbc a partir do fbclid quando a pagina nao mandou o cookie", () => {
  const c = extrairClique({ fbclid: "XYZ", fbclid_em: 1730000000000 }, {});
  assert.equal(c.fbc, "fb.1.1730000000000.XYZ");
});

test("ip/ua vindos do corpo vencem o cabecalho (proxy de netlify mascara o ip do lead)", () => {
  const c = extrairClique({ client_ip: "1.2.3.4", client_user_agent: "UA-lead" }, { ip: "9.9.9.9", ua: "node" });
  assert.equal(c.client_ip, "1.2.3.4");
  assert.equal(c.client_ua, "UA-lead");
});

test("payload sem nada de clique devolve objeto vazio", () => {
  assert.deepEqual(extrairClique({}, {}), {});
});

test("telefone vira E.164 sem + (11 digitos ganham 55)", () => {
  assert.equal(telefoneE164("(11) 99999-8888"), "5511999998888");
  assert.equal(telefoneE164("5511999998888"), "5511999998888");
  assert.equal(telefoneE164(""), "");
});

test("evento web leva user_data em hash, fbc/fbp crus, ip/ua e custom_data com valor", () => {
  const ev = montarEventoWeb({
    evento: "Schedule",
    contato: {
      id: "c1",
      name: "Maria Souza",
      email: " Maria@Ex.com ",
      phone: "11999998888",
      customFields: { fbc: "fb.1.1.A", fbp: "fb.1.1.B", origem_url: "https://x.com/p" },
    },
    cliente: { ip: "1.2.3.4", ua: "UA" },
    agoraSeg: 1730000000,
    valorCentavos: 50000,
    eventId: "c1:Schedule",
  });
  assert.equal(ev.event_name, "Schedule");
  assert.equal(ev.action_source, "system_generated");
  assert.equal(ev.event_id, "c1:Schedule");
  assert.deepEqual(ev.user_data.em, [sha("maria@ex.com")]);
  assert.deepEqual(ev.user_data.ph, [sha("5511999998888")]);
  assert.deepEqual(ev.user_data.fn, [sha("maria")]);
  assert.deepEqual(ev.user_data.ln, [sha("souza")]);
  assert.deepEqual(ev.user_data.external_id, [sha("c1")]);
  assert.equal(ev.user_data.fbc, "fb.1.1.A");
  assert.equal(ev.user_data.fbp, "fb.1.1.B");
  assert.equal(ev.user_data.client_ip_address, "1.2.3.4");
  assert.equal(ev.user_data.client_user_agent, "UA");
  assert.deepEqual(ev.custom_data, { currency: "BRL", value: 500 });
});

test("Lead no momento do formulario e website com event_source_url e o event_id da pagina", () => {
  const ev = montarEventoWeb({
    evento: "Lead",
    contato: { id: "c2", name: "Ze", email: null, phone: "11988887777", customFields: { origem_url: "https://x.com/a" } },
    agoraSeg: 1,
    eventId: "lead-abc",
    actionSource: "website",
  });
  assert.equal(ev.action_source, "website");
  assert.equal(ev.event_source_url, "https://x.com/a");
  assert.equal(ev.event_id, "lead-abc");
  assert.equal(ev.user_data.em, undefined);
  assert.equal(ev.custom_data, undefined);
});

test("fbp sozinho nao marca lead como vindo de anuncio; fbc, utm meta ou ad_id marcam", () => {
  assert.equal(temSinalWeb({ fbp: "fb.1.1.B" }), false);
  assert.equal(temSinalWeb({ fbc: "fb.1.1.A" }), true);
  assert.equal(temSinalWeb({ utm_source: "meta" }), true);
  assert.equal(temSinalWeb({ ad_id: "1" }), true);
  assert.equal(temSinalWeb(null), false);
});

test("lead com ctwa_clid fica com o caminho do WhatsApp (nao conta em dobro)", () => {
  assert.equal(temCliqueWhatsapp({ ctwa_clid: "abc", fbc: "x" }), true);
  assert.equal(temCliqueWhatsapp({ fbc: "x" }), false);
});

test("telefone com zero na frente ou estrangeiro nao ganha 55 errado", () => {
  assert.equal(telefoneE164("011999998888"), "5511999998888");
  // 11 digitos sem DDI e ambiguo (BR celular x EUA); a base e brasileira, entao 55 vence.
  assert.equal(telefoneE164("+44 20 7946 0958"), "442079460958");
});

test("evento nao le ip/ua gravados no contato (LGPD): so os passados na hora", () => {
  const ev = montarEventoWeb({
    evento: "Schedule",
    contato: { id: "c3", name: null, email: null, phone: null, customFields: { client_ip: "1.1.1.1", client_ua: "velho" } },
    agoraSeg: 1,
    eventId: "x",
  });
  assert.equal(ev.user_data.client_ip_address, undefined);
  assert.equal(ev.user_data.client_user_agent, undefined);
});

test("estagio do CRM vira evento da Meta", () => {
  assert.equal(eventoDoEstagio("call_marcada"), "Schedule");
  assert.equal(eventoDoEstagio("proposta"), "QualifiedLead");
  assert.equal(eventoDoEstagio("conversando"), null);
});

test("origem de cliente com pixel proprio fica fora da CAPI do pixel FERA", () => {
  const lista = "funil:pagina-cliente-a, funil:pdf-cliente-a";
  assert.equal(origemComPixelProprio("funil:pagina-cliente-a", lista), true);
  assert.equal(origemComPixelProprio("funil:pdf-cliente-a", lista), true);
  assert.equal(origemComPixelProprio("funil:altoticket-youtube", lista), false);
  assert.equal(origemComPixelProprio(null, lista), false);
  assert.equal(origemComPixelProprio("funil:pagina-cliente-a", ""), false);
});
