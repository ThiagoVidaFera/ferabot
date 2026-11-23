# Ferabot

Time de assistentes de marketing e vendas rodando na sua máquina, com uma meta declarada e um
painel que mostra todo dia o que já está pronto e o que só anda se você andar.

Um comando: **`/fera`**. Ele mentora, e chama o FeraBot certo quando você pede uma peça.

## Instalação

### Caminho rápido (recomendado)

Use o Claude pelo **VS Code** (code.visualstudio.com) com a extensão **Claude Code** (aba Extensões >
Claude Code > Instalar > entrar com a conta do Claude, plano Pro ou maior). Abra a pasta Documentos.

No Claude Code, digite:

```
/instale https://github.com/ThiagoVidaFera/ferabot
```

Ele resolve Python, Git, clona e roda o instalador sozinho.

### Caminho manual

Requisitos: Python 3.10+, Claude Code. (Node.js 18+ só pra disparo de WhatsApp.)

```bash
python instalar.py
```

São 4 etapas: ambiente → seu perfil → **sua meta** → instalação dos FeraBots. No fim, o Painel do
Operador abre no navegador.

## Os 6 FeraBots

| Comando | Entrega |
|---|---|
| `/copiloto-de-gestao` | meta, índice de execução, painel, relatório semanal |
| `/propostas` | PDF de proposta comercial |
| `/paginas-e-quiz` | landing, página de venda, quiz, deploy |
| `/conteudo-e-anuncios` | anúncios, carrossel, stories, posts, campanha Meta |
| `/roteiros-e-oratoria` | roteiro, vídeo narrado, YouTube, slides |
| `/crm-de-leads` | leads, disparo WhatsApp, comentário → DM |

<!-- CRM -->
## CRM FERA (o CRM completo, com WhatsApp)

Comando: **`/crm-fera`**. O mesmo CRM da operação do Thiago, com a identidade do seu negócio
(`CrmFera/negocio.json`, gerado do seu perfil): inbox do WhatsApp, contatos, funil de leads, reuniões,
robôs que recebem, qualificam, confirmam e lembram a reunião, follow-up, disparos, propostas, vendas e
anúncios. Os robôs nascem em modo Sugere: escrevem, você aprova.

Roda em Docker (CRM + WAHA + relógio dos robôs): no seu computador (grátis, para enquanto o PC
desliga) ou numa VPS (24 horas). `python ScriptsFera/crm.py negocio | env | subir | status | abrir`.

| Comando | Entrega |
|---|---|
| `/ensaio-ia` | ensaio de fotos suas com IA a partir de 3 a 6 fotos reais, para post, anúncio e página |
| `/agenda-google` | Google Agenda conectado: agendas do negócio, reunião com link do Meet, horário livre |


E `/criar-ferabot` — você descreve um agente novo e o sistema escreve a skill dele. É a parte que
te torna dono da fábrica, não só usuário dos robôs.

## Squads que já vêm instalados

| Comando | Entrega |
|---|---|
| `/squad-onboarding` | o sistema de captação inteiro pronto: prévia do perfil com o feed montado nas artes reais, 4 páginas (agendamento, grupo com isca, slides do vídeo, proposta), kit de ~55 artes + PDF da isca, 3 campanhas de R$ 20/dia e o fluxo de WhatsApp E0–E7. Serve pro seu negócio ou pra um cliente seu. |
| `/funil-reuniao-fantasma` | a primeira página que você cria: agendamento de reunião de 20 minutos. O lead trava o horário e só ganha a reunião se responder no WhatsApp e provar o perfil |
| `/agente-de-leads` | assistente no seu WhatsApp que recebe quem agendou, qualifica, manda seus materiais, lembra da reunião e prepara a proposta pra você aprovar. Roda no seu computador: desligado, parado |
| `/proposta-pagina` | proposta comercial em página (modelo dossiê vivo) montada com as falas do lead. Blocos opcionais "Em contrato" e "Dois mundos", mensagem do link e follow-up do dia 3 prontos |
| `/galeria-de-artes` | testa UMA ideia em todos os formatos: a capa em cada formato de carrossel, ou a oferta nos 17 formatos de anúncio, numa galeria lado a lado com ranking |
| `/carrossel-ilustrado` | carrossel de card de tweet com prova visual em cada slide (modelo Greco) |
| `/carrossel-historinha` | carrossel de historinha com personagem fictícia declarada (modelo Vaz) |
| `/carrossel-tela-viva` | carrossel com uma tela em vídeo em cada slide (modelo Lucas Lopes) |
| `/meta-ads-fera` | sobe e lê campanhas no seu Meta Ads. Toda campanha passa por um pré-voo de rastreamento (UTM, pixel, evento com ID, API de Conversões) e só sobe se fechar |
| `/eva-pov-produto` · `/eva-anuncio-dentro-do-anuncio` · `/eva-remarketing-escassez` · `/eva-ensaio-noir-empresario` · `/eva-hq-ia-noir` · `/eva-ia-plus` | formatos de anúncio em vídeo (celular filmando a tela real, anúncio dentro do anúncio, remarketing com escassez real, ensaio noir, HQ de IA). HQ e personagem de IA ilustram a tese; tela e número são sempre reais |
| `/prova-na-tela` · `/painel-do-comprador-na-cena` | anima um print ou gravação REAL do seu painel (círculo no número, zoom, checklist), sem redesenhar a tela. Todo número exige origem |
| `/estilo-36-avatar-explica` · `/estilo-37-cartoon-grotesco` · `/estilo-visual-ads` · `/estilo-por-referencia` | estilos visuais de vídeo e de anúncio |
| `/formatos-criativos-por-perfil` · `/gancho-dos-tres-segundos` · `/direcao-de-edicao-ia` · `/catalogo-de-efeitos` · `/video-redaction-seguranca` | escolha do formato do vídeo, abertura dos 3 primeiros segundos, direção de edição, catálogo de efeitos e borrão de dado sensível |
| `/anuncio-nativo` | story ad com cara de post nativo do Instagram (o que não parece anúncio) |
| `/squad-anuncios-estaticos` | lote de anúncios estáticos de feed, vários ângulos da mesma oferta |
| `/mix-estaticos` | variações de estáticos a partir de uma ideia só |
| `/anuncios-de-ouro` | kit de anúncio multiformato (feed, story, reel, carrossel) com as suas fotos |
| `/squad-carrossel-fera` | o carrossel clássico de 10 slides, com a copy aprovada antes da arte. Com a chave do Post for Me, já sai agendado |
| `/squad-stories-fera` | stories de bastidor com a sua foto real e copy em 5 camadas. Com a chave do Post for Me, já sai agendado |
| `/squad-caixinha-fera` | stories de caixinha de perguntas no visual da sua marca |
| `/squad-isca-fera` | isca digital (PDF) com página de captura, para trocar material por nome e WhatsApp |
| `/squad-slides-fera` | slides de apresentação: pitch ao vivo, aula, webinar, proposta. PNG por slide ou vídeo |
| `/jack-fera` | landing page e página de venda completa, com publicação no Netlify opcional |
| `/editar-reel` | edita o reel que você gravou: corta silêncio e erro, legenda grande no centro, capa e MP4 1080x1920. A legenda é a sua fala, nunca inventada |
| `/webinar-pdf` | webinar digital em PDF, 20 a 30 slides lidos no celular, que ensina e termina convidando para a reunião de 20 minutos |
| `/canal-youtube` | arruma o seu canal: @, nome, descrição, palavras-chave, banner com área segura, foto, playlists, trailer de 60s e os vídeos antigos com o link de agendamento |

Já instalou antes? Rode `atualizar.bat` (ou diga "atualiza o ferabot") e eles aparecem.

## Chaves de API (opcionais, todas SUAS)

Sem chave nenhuma o Ferabot já produz proposta, página, anúncio, carrossel, roteiro e vídeo
narrado (voz IA grátis). As chaves — das **suas** contas — automatizam o último passo:

| Chave | Automatiza |
|---|---|
| Gemini (grátis) | imagens com IA |
| Netlify (grátis) | publicar páginas |
| Meta Ads | subir campanhas (nascem pausadas) |
| YouTube OAuth | subir vídeos no seu canal |
| Instagram | comentário → DM (captação) |

**Comece por Gemini e Netlify e pare aí.** 8 minutos, as duas grátis.

Existe um segundo grupo de opcionais pra quando você bater num limite específico: agendar feed,
carrossel, story e reel (Post for Me, via `python ScriptsFera/publicar.py`), mídia ilimitada
(Gathos, ElevenLabs, fal.ai), WhatsApp em escala (WAHA),
e-mail (Resend), pesquisa e espionagem de anúncio (apidirect, ScrapeCreators, NicheFinder, Apify)
e métrica de página (Cloudflare). Detalhe de cada uma na Parte 2 do `API_SETUP.md`.

Configurar: `python SetupFera/setup_chaves.py` (pergunta em blocos, o opcional só se você quiser)
· guia: `API_SETUP.md`.

O `.env` e o `perfil.json` ficam só na sua máquina (`.gitignore`). Se algum subir pro git por
acidente, revogue e regenere as chaves.

## Estrutura

```
ferabot/
├── CLAUDE.md          ← doutrina do sistema (persona, regras)
├── perfil.json        ← seu perfil (setup, não commitar)
├── metas.json         ← sua meta e compromissos (setup)
├── entregas.json      ← o que os FeraBots entregaram
├── SetupFera/         ← instalação, perfil, metas, chaves
├── ScriptsFera/       ← motores (render, narração, CRM, WhatsApp, YouTube)
├── SkillsDoFera/      ← /fera + os 6 FeraBots + fábrica
├── DashboardFera/     ← Painel do Operador
└── output/            ← tudo que é gerado
```

## Primeiro dia

Leia o `PRIMEIRO_DIA.md`. Missão: sair do dia 1 com a meta no painel e a página de agendamento (`/funil-reuniao-fantasma`) no ar. Depois, teste 3 formatos de carrossel no seu perfil e compare.

Manual de prompts: https://promptbook.vidafera.com
