// Sobe o Kit de Feed Inicial pro Google Drive, na estrutura que o cliente baixa. OPCIONAL.
//
// O FERABOT não traz credencial do Google Drive. Este script só sobe sozinho se você tiver
// configurado, no .env da raiz do FERABOT: GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET
// (e GOOGLE_DRIVE_REDIRECT, opcional) + um token OAuth com refresh_token em <FERABOT>/drive-token.json
// (ou no caminho de GOOGLE_DRIVE_TOKEN_FILE), e o pacote `googleapis` instalado (npm i googleapis).
//
// Sem isso, o caminho é MANUAL (é o padrão):
//   1. arraste a pasta <run>/kit-feed-inicial/ pro drive.google.com (sem as pastas _qa*);
//   2. compartilhe a pasta e o PDF da isca como "Qualquer pessoa com o link — Leitor";
//   3. grave os links pro gerar_docs.py usar:
//      node subir_drive.mjs <pasta-do-run> --manual "<link da pasta>" "<link do PDF da isca>"
//
// Uso: node subir_drive.mjs <pasta-do-run> "<Nome da pasta no Drive>"

import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// ── raiz do FERABOT: FERABOT_DIR → ancestral da pasta do run com ScriptsFera/lib.py → ~/ferabot
function raizFerabot(inicio) {
  const env = process.env.FERABOT_DIR;
  if (env && existsSync(env) && statSync(env).isDirectory()) return path.resolve(env);
  let p = path.resolve(inicio);
  while (true) {
    if (existsSync(path.join(p, "ScriptsFera", "lib.py"))) return p;
    const pai = path.dirname(p);
    if (pai === p) break;
    p = pai;
  }
  const padrao = path.join(os.homedir(), "ferabot");
  return existsSync(padrao) ? padrao : null;
}

function lerEnv(raiz) {
  const arq = raiz && path.join(raiz, ".env");
  if (!arq || !existsSync(arq)) return {};
  return Object.fromEntries(readFileSync(arq, "utf8").split(/\r?\n/)
    .filter(l => l.includes("=") && !l.trim().startsWith("#"))
    .map(l => [l.slice(0, l.indexOf("=")).trim(),
               l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]));
}

// Credencial OPCIONAL do Google Drive (o FERABOT não traz). Devolve null se faltar qualquer peça.
async function driveOuNull(run) {
  const raiz = raizFerabot(run);
  const env = { ...lerEnv(raiz), ...process.env };
  const tokenArq = env.GOOGLE_DRIVE_TOKEN_FILE || (raiz && path.join(raiz, "drive-token.json"));
  if (!env.GOOGLE_DRIVE_CLIENT_ID || !env.GOOGLE_DRIVE_CLIENT_SECRET || !tokenArq || !existsSync(tokenArq)) return null;
  let google;
  for (const base of [import.meta.url, raiz && path.join(raiz, "package.json"), path.join(os.homedir(), "package.json")]) {
    if (!base) continue;
    try { ({ google } = createRequire(base)("googleapis")); break; } catch { /* tenta o próximo */ }
  }
  if (!google) return null;
  const auth = new google.auth.OAuth2(env.GOOGLE_DRIVE_CLIENT_ID, env.GOOGLE_DRIVE_CLIENT_SECRET,
                                      env.GOOGLE_DRIVE_REDIRECT || "http://localhost");
  const tok = JSON.parse(await fs.readFile(tokenArq, "utf8"));
  auth.setCredentials(tok);
  auth.on("tokens", async t => {
    await fs.writeFile(tokenArq, JSON.stringify({ ...tok, ...t }, null, 2));   // renova sozinho
  });
  return google.drive({ version: "v3", auth });
}

const RUN = path.resolve(process.argv[2] || ".");
const KIT = path.join(RUN, "kit-feed-inicial");

// Modo manual: só grava os links que você colou depois de subir a pasta à mão.
if (process.argv[3] === "--manual") {
  const [pastaLink, pdfLink] = process.argv.slice(4);
  if (!pastaLink) {
    console.error('Uso: node subir_drive.mjs <pasta-do-run> --manual "<link da pasta>" "<link do PDF>"');
    process.exit(2);
  }
  const pdfs = {};
  if (pdfLink) {
    const isca = (await fs.readdir(path.join(KIT, "isca")).catch(() => [])).find(n => n.toLowerCase().endsWith(".pdf"));
    pdfs[isca || "isca.pdf"] = pdfLink;
  }
  await fs.writeFile(path.join(RUN, "drive-links.json"), JSON.stringify({ pasta: pastaLink, pdfs, manual: true }, null, 2));
  console.log("drive-links.json gravado (modo manual). Agora rode o gerar_docs.py de novo.");
  process.exit(0);
}

const NOME_PASTA = process.argv[3] || "Kit de Feed Inicial";
const drive = await driveOuNull(RUN);
if (!drive) {
  console.log([
    "Google Drive não configurado no FERABOT — sem problema, este passo é opcional.",
    "Faça à mão:",
    `  1. arraste a pasta ${KIT} pro drive.google.com (pode deixar de fora as pastas _qa*);`,
    '  2. compartilhe a pasta e o PDF da isca como "Qualquer pessoa com o link — Leitor";',
    `  3. node subir_drive.mjs "${RUN}" --manual "<link da pasta>" "<link do PDF>"`,
    "  4. rode o gerar_docs.py de novo (as respostas-modelo passam a ter o link real do PDF).",
  ].join(String.fromCharCode(10)));
  process.exit(0);
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".md": "text/markdown", ".pdf": "application/pdf" };

async function pasta(nome, pai) {
  const q = `name='${nome.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder'`
    + ` and '${pai || "root"}' in parents and trashed=false`;
  const achou = await drive.files.list({ q, fields: "files(id)", pageSize: 1 });
  if (achou.data.files.length) return achou.data.files[0].id;
  const nova = await drive.files.create({
    requestBody: { name: nome, mimeType: "application/vnd.google-apps.folder", parents: pai ? [pai] : undefined },
    fields: "id",
  });
  return nova.data.id;
}

async function sobe(arquivo, pai) {
  const nome = path.basename(arquivo);
  const q = `name='${nome}' and '${pai}' in parents and trashed=false`;
  const achou = await drive.files.list({ q, fields: "files(id)", pageSize: 1 });
  const media = { mimeType: MIME[path.extname(nome).toLowerCase()] || "application/octet-stream",
                  body: createReadStream(arquivo) };
  if (achou.data.files.length) {                      // idempotente: republica por cima
    await drive.files.update({ fileId: achou.data.files[0].id, media });
    return achou.data.files[0].id;
  }
  const novo = await drive.files.create({ requestBody: { name: nome, parents: [pai] }, media, fields: "id" });
  return novo.data.id;
}

const PDFS = {};                                   // nome do arquivo → link de leitura

async function espelha(local, paiDrive) {
  let n = 0;
  for (const item of (await fs.readdir(local, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    // _qa* são folhas de conferência internas (screenshots de QA); o cliente não precisa delas na pasta
    if (item.name.startsWith("_qa")) continue;
    const caminho = path.join(local, item.name);
    if (item.isDirectory()) {
      n += await espelha(caminho, await pasta(item.name, paiDrive));
    } else if (MIME[path.extname(item.name).toLowerCase()]) {
      const id = await sobe(caminho, paiDrive);
      if (item.name.toLowerCase().endsWith(".pdf")) PDFS[item.name] = `https://drive.google.com/file/d/${id}/view`;
      n++;
    }
  }
  return n;
}

const raiz = await pasta(NOME_PASTA, null);
const total = await espelha(KIT, raiz);
await drive.permissions.create({                       // link de leitura pra quem tiver o endereço
  fileId: raiz, requestBody: { role: "reader", type: "anyone" },
}).catch(() => {});
const pastaLink = `https://drive.google.com/drive/folders/${raiz}`;
// O gerar_docs.py lê isto pra trocar o [LINK DO PDF] das respostas-modelo pelo link real.
await fs.writeFile(path.join(RUN, "drive-links.json"),
  JSON.stringify({ pasta: pastaLink, pdfs: PDFS }, null, 2));
console.log(`${total} arquivos em "${NOME_PASTA}"`);
console.log(pastaLink);
for (const [nome, url] of Object.entries(PDFS)) console.log(`PDF ${nome}: ${url}`);
