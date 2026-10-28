// Audita a pasta do kit no Drive. Chamado pelo qa_run.py; imprime UM JSON.
//   pdfs_publicos: cada PDF tem permissão anyone→reader? (o HTML do Drive não diz: mostra "Sign in" sempre)
//   lixo: arquivos _qa* que não deveriam estar na pasta do cliente
// OPCIONAL: sem credencial do Google Drive no FERABOT (ver subir_drive.mjs), imprime
// {"indisponivel": true, ...} e o qa_run.py vira AVISO pedindo a conferência manual.
//
// Uso: node auditar_drive.mjs <pasta-do-run>      (lê <run>/drive-links.json)

import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { existsSync, readFileSync, statSync } from "node:fs";
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
const links = JSON.parse(await fs.readFile(path.join(RUN, "drive-links.json"), "utf8"));
const drive = await driveOuNull(RUN);
if (!drive) {
  console.log(JSON.stringify({ indisponivel: true,
    motivo: "sem credencial do Google Drive — confira à mão: pasta e PDF em 'Qualquer pessoa com o link', nenhuma pasta _qa*" }));
  process.exit(0);
}

const id = url => (url.match(/\/(?:d|folders)\/([\w-]+)/) || [])[1];
const publico = async fileId => {
  const r = await drive.permissions.list({ fileId, fields: "permissions(type,role)" });
  return r.data.permissions.some(p => p.type === "anyone" && ["reader", "commenter", "writer"].includes(p.role));
};

const pdfs_publicos = {};
for (const [nome, url] of Object.entries(links.pdfs || {})) pdfs_publicos[nome] = await publico(id(url));

const lixo = [];
let total = 0;
async function varre(pai, rota) {
  let token;
  do {
    const r = await drive.files.list({ q: `'${pai}' in parents and trashed=false`,
      fields: "nextPageToken, files(id,name,mimeType)", pageSize: 200, pageToken: token });
    for (const f of r.data.files) {
      if (f.name.startsWith("_qa")) lixo.push(`${rota}/${f.name}`);
      if (f.mimeType === "application/vnd.google-apps.folder") await varre(f.id, `${rota}/${f.name}`);
      else total++;
    }
    token = r.data.nextPageToken;
  } while (token);
}
const raiz = id(links.pasta);
await varre(raiz, "");
console.log(JSON.stringify({ pasta_publica: await publico(raiz), pdfs_publicos, lixo, arquivos: total }));
