import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarMidiaWaha, caminhoDoArquivo } from "../../src/lib/midia-waha";

test("áudio enviado pelo celular (payload com media.url)", () => {
  const r = detectarMidiaWaha({
    fromMe: true,
    body: null,
    hasMedia: true,
    media: { url: "http://localhost:3000/api/files/casamento-1740/AC1.oga", mimetype: "audio/ogg; codecs=opus" },
  });
  assert.equal(r?.tipo, "audio");
  assert.equal(r?.url, "http://localhost:3000/api/files/casamento-1740/AC1.oga");
});

test("áudio recebido com media nula: tipo pela chave do motor", () => {
  const r = detectarMidiaWaha({ hasMedia: true, media: null, _data: { message: { audioMessage: { mimetype: "audio/ogg; codecs=opus", ptt: true } } } });
  assert.equal(r?.tipo, "audio");
  assert.equal(r?.url, undefined);
  assert.match(r?.mimetype ?? "", /audio\/ogg/);
});

test("foto, vídeo, documento e figurinha", () => {
  assert.equal(detectarMidiaWaha({ hasMedia: true, media: { mimetype: "image/jpeg" } })?.tipo, "image");
  assert.equal(detectarMidiaWaha({ hasMedia: true, media: { mimetype: "video/mp4" } })?.tipo, "video");
  assert.equal(detectarMidiaWaha({ hasMedia: true, media: { mimetype: "application/pdf" } })?.tipo, "document");
  assert.equal(detectarMidiaWaha({ hasMedia: true, media: { mimetype: "image/webp" }, _data: { message: { stickerMessage: {} } } })?.tipo, "sticker");
});

test("texto puro não é mídia; caminho do arquivo só aceita /api/files/", () => {
  assert.equal(detectarMidiaWaha({ body: "oi", hasMedia: false, _data: { message: { conversation: "oi" } } }), null);
  assert.equal(caminhoDoArquivo("http://localhost:3000/api/files/s/a.oga"), "/api/files/s/a.oga");
  assert.equal(caminhoDoArquivo("http://localhost:3000/api/sessions"), null);
  assert.equal(caminhoDoArquivo("lixo"), null);
});
