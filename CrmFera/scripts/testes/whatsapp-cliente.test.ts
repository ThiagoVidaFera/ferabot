import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { criarBancoTemporario } from "./banco-temporario";
import { motivoServidorRecusado, normalizarServidor } from "../../src/lib/hospedado";

const banco = criarBancoTemporario();
const CHAVE = "chave-do-servidor-123";

type Recebido = { metodo: string; caminho: string; corpo: string };
const recebidos: Recebido[] = [];
let servidor: http.Server;
let endereco = "";

/** WAHA de mentira: confere a chave, cria a sessão e responde que espera o QR. */
before(async () => {
  servidor = http.createServer((req, res) => {
    let corpo = "";
    req.on("data", (p) => (corpo += p));
    req.on("end", () => {
      recebidos.push({ metodo: req.method ?? "", caminho: req.url ?? "", corpo });
      if (req.headers["x-api-key"] !== CHAVE) {
        res.writeHead(401).end("{}");
        return;
      }
      res.setHeader("Content-Type", "application/json");
      if (req.url?.startsWith("/api/sessions?all")) return res.end("[]");
      if (req.method === "GET" && req.url === "/api/sessions/principal") {
        const criada = recebidos.some((r) => r.metodo === "POST" && r.caminho === "/api/sessions");
        if (!criada) return res.writeHead(404).end("{}");
        return res.end(JSON.stringify({ name: "principal", status: "SCAN_QR_CODE", config: { webhooks: [] } }));
      }
      if (req.method === "POST" && req.url === "/api/sessions") return res.writeHead(201).end("{}");
      res.end("{}");
    });
  });
  await new Promise<void>((ok) => servidor.listen(0, "127.0.0.1", ok));
  endereco = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

after(async () => {
  servidor.close();
  const { db } = await import("../../src/lib/db");
  await db.$disconnect();
  banco.apagar();
});

test("servidor do cliente só vale com https e endereço público", () => {
  assert.equal(motivoServidorRecusado("https://whatsapp.ana.com.br"), null);
  assert.equal(motivoServidorRecusado("https://203.0.113.10"), null);
  assert.match(motivoServidorRecusado("http://whatsapp.ana.com.br") ?? "", /https/);
  assert.match(motivoServidorRecusado("https://user:senha@whatsapp.ana.com.br") ?? "", /usuário e senha/);
  assert.match(motivoServidorRecusado("https://pc-porteiro") ?? "", /interno/);
  assert.match(motivoServidorRecusado("https://crm.ana.local") ?? "", /interno/);
  assert.match(motivoServidorRecusado("https://localhost") ?? "", /interno/);
  assert.match(motivoServidorRecusado("https://10.0.5.8") ?? "", /rede interna/);
  assert.match(motivoServidorRecusado("https://192.168.0.2") ?? "", /rede interna/);
  assert.match(motivoServidorRecusado("https://172.20.0.1") ?? "", /rede interna/);
  assert.match(motivoServidorRecusado("https://[::1]") ?? "", /IPv6/);
  assert.match(motivoServidorRecusado("lixo") ?? "", /inválido/);
});

test("endereço é gravado sem barra no fim e sem parâmetros", () => {
  assert.equal(normalizarServidor("https://whatsapp.ana.com.br/"), "https://whatsapp.ana.com.br");
  assert.equal(normalizarServidor("https://whatsapp.ana.com.br/?x=1"), "https://whatsapp.ana.com.br");
});

test("painel hospedado recusa servidor sem https antes de chamar qualquer coisa", async () => {
  process.env.PAINEL_HOSPEDADO = "1";
  const { ligarServidorWhatsapp } = await import("../../src/lib/whatsapp-cliente");
  const antes = recebidos.length;

  const r = await ligarServidorWhatsapp({ url: endereco, apiKey: CHAVE });

  delete process.env.PAINEL_HOSPEDADO;
  assert.equal(r.ok, false);
  assert.match(r.msg, /https/);
  assert.equal(recebidos.length, antes);
});

test("chave errada é recusada e nada é gravado como número", async () => {
  const { ligarServidorWhatsapp } = await import("../../src/lib/whatsapp-cliente");
  const { db } = await import("../../src/lib/db");

  const r = await ligarServidorWhatsapp({ url: endereco, apiKey: "chave-errada" });

  assert.equal(r.ok, false);
  assert.match(r.msg, /recusou a chave/);
  assert.equal(await db.whatsappInstance.count(), 0);
});

test("chave com quebra de linha é recusada", async () => {
  const { ligarServidorWhatsapp } = await import("../../src/lib/whatsapp-cliente");

  const r = await ligarServidorWhatsapp({ url: endereco, apiKey: "abc\nX-Outro: 1" });

  assert.equal(r.ok, false);
});

test("servidor bom vira o número padrão, a sessão nasce com o webhook do painel e o QR fica esperando", async () => {
  process.env.WEBHOOK_URL_PUBLICA = "https://ana.painel.vidafera.com/api/webhooks/evolution";
  process.env.WEBHOOK_TOKEN = "tok-webhook";
  const { ligarServidorWhatsapp, ultimoTesteWhatsapp } = await import("../../src/lib/whatsapp-cliente");
  const { db } = await import("../../src/lib/db");

  const r = await ligarServidorWhatsapp({ url: `${endereco}/`, apiKey: CHAVE });

  const numero = await db.whatsappInstance.findFirst({ where: { isDefault: true } });
  const criacao = recebidos.find((x) => x.metodo === "POST" && x.caminho === "/api/sessions");
  assert.equal(r.ok, true, r.msg);
  assert.equal(r.status, "conectando");
  assert.match(r.msg, /QR code/);
  assert.equal(numero?.evolutionApiUrl, endereco);
  assert.equal(numero?.instanceName, "principal");
  assert.equal(numero?.status, "conectando");
  assert.ok(criacao, "a sessão foi criada no servidor do cliente");
  assert.match(criacao.corpo, /ana\.painel\.vidafera\.com\/api\/webhooks\/evolution\?token=tok-webhook/);
  assert.equal((await ultimoTesteWhatsapp())?.ok, true);
});

test("ligar de novo atualiza o mesmo número, não cria outro", async () => {
  const { ligarServidorWhatsapp } = await import("../../src/lib/whatsapp-cliente");
  const { db } = await import("../../src/lib/db");

  await ligarServidorWhatsapp({ url: endereco, apiKey: CHAVE, sessao: "principal" });

  assert.equal(await db.whatsappInstance.count(), 1);
});
