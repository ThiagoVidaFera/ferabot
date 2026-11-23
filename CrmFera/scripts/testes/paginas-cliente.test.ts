import { test } from "node:test";
import assert from "node:assert/strict";
import { enderecoDoSite, ordenarPorAtualizacao, paraPagina } from "../../src/lib/paginas-cliente";

test("página usa o domínio próprio quando existe, senão o https da Netlify", () => {
  assert.equal(enderecoDoSite({ custom_domain: "captura.exemplo.com.br", ssl_url: "https://x.netlify.app" }), "https://captura.exemplo.com.br");
  assert.equal(enderecoDoSite({ ssl_url: "https://x.netlify.app" }), "https://x.netlify.app");
});

test("site sem id ou sem https fica de fora, e a lista vem da mais nova para a mais antiga", () => {
  assert.equal(paraPagina({ name: "sem id", ssl_url: "https://a.netlify.app" }), null);
  assert.equal(paraPagina({ id: "1", url: "http://inseguro.com" }), null);
  const a = paraPagina({ id: "a", name: "A", ssl_url: "https://a.netlify.app", updated_at: "2026-11-01T00:00:00Z" });
  const b = paraPagina({ id: "b", name: "B", ssl_url: "https://b.netlify.app", updated_at: "2026-11-20T00:00:00Z" });
  assert.ok(a && b);
  if (!a || !b) return;
  assert.deepEqual(ordenarPorAtualizacao([a, b]).map((p) => p.id), ["b", "a"]);
});
