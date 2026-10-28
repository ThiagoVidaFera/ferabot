(() => {
  'use strict';
  // Slides animados do vídeo — cada beat é uma CENA: frase curta + linha de contexto +
  // um visual que carrega o argumento (infográfico ou foto). Sem marcação de tempo na tela:
  // tempo é dado de produção, não conteúdo pro espectador.
  const P = window.PROFILE || {};
  const V = (P.plano || {}).videoYoutube || {};
  const beats = V.beats || [];
  const palco = document.querySelector('#slPalco');
  if (!palco) return;

  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linhas = v => esc(Array.isArray(v) ? v.join('\n') : v || '').replace(/\n/g, '<br>');

  document.title = `${P.name ? P.name + ' — ' : ''}Slides do vídeo`;
  const aviso = document.querySelector('#pgAviso');
  if (aviso) aviso.innerHTML = `<span>Slides do vídeo de 18 minutos · proposta</span><a class="pg-voltar" href="index.html">← Voltar ao perfil</a>`;

  if (!beats.length) { palco.innerHTML = '<p class="pg-nota">Roteiro ainda não definido.</p>'; return; }

  /* ---------- Infográficos: cada tipo recebe `dados` do content.js ---------- */
  const VISUAL = {
    // Número grande com unidade e legenda. dados: {valor, unidade, legenda, de}
    numero: d => `<div class="viz viz-numero">
        <div class="viz-num"><b>${esc(d.valor)}</b>${d.unidade ? `<span>${esc(d.unidade)}</span>` : ''}</div>
        ${d.de ? `<div class="viz-de">${esc(d.de)}</div>` : ''}
        ${d.legenda ? `<p class="viz-cap">${linhas(d.legenda)}</p>` : ''}
      </div>`,

    // Barras proporcionais. dados: {itens:[{rotulo, valor, destaque}], max}
    barras: d => {
      const max = d.max || Math.max(...d.itens.map(i => i.valor));
      return `<div class="viz viz-barras">${d.itens.map(i => `
        <div class="viz-barra${i.destaque ? ' on' : ''}">
          <span class="viz-rot">${esc(i.rotulo)}</span>
          <div class="viz-trilho"><i style="--w:${Math.round(i.valor / max * 100)}%"></i></div>
          <span class="viz-val">${esc(i.exibe || i.valor)}</span>
        </div>`).join('')}</div>`;
    },

    // Fluxo de caixas com seta, no padrão FERA de diagrama de fluxo.
    // dados: {passos:[{rotulo, nota, fim}]}
    fluxo: d => `<div class="viz viz-fluxo">${d.passos.map((p, i) => `
        ${i ? '<span class="viz-seta" aria-hidden="true"></span>' : ''}
        <div class="viz-caixa${p.fim ? ' fim' : ''}">
          <b>${esc(p.rotulo)}</b>${p.nota ? `<span>${esc(p.nota)}</span>` : ''}
        </div>`).join('')}</div>`,

    // Pilhas/colunas de categorias. dados: {colunas:[{titulo, itens:[]}]}
    pilhas: d => `<div class="viz viz-pilhas">${d.colunas.map((c, i) => `
        <div class="viz-pilha"><b>${String(i + 1).padStart(2, '0')}</b>
          <strong>${esc(c.titulo)}</strong>
          <ul>${(c.itens || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>`).join('')}</div>`,

    // Antes × depois. dados: {antes:{titulo,itens}, depois:{titulo,itens}}
    comparacao: d => `<div class="viz viz-comp">
        <div class="viz-lado ruim"><b>${esc(d.antes.titulo)}</b><ul>${d.antes.itens.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="viz-lado bom"><b>${esc(d.depois.titulo)}</b><ul>${d.depois.itens.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>`,

    // Checklist. dados: {itens:[], marca}
    lista: d => `<div class="viz viz-lista"><ul>${d.itens.map(x => `<li><i>${esc(d.marca || '✓')}</i><span>${esc(x)}</span></li>`).join('')}</ul></div>`,

    // Bloco de mensagem, pra mostrar copy de WhatsApp na tela. dados: {de, texto}
    mensagem: d => `<div class="viz viz-msg"><div class="viz-bolha${d.de === 'lead' ? ' lead' : ''}">${linhas(d.texto)}</div></div>`,

    // Foto do cliente. dados: {src, alt}
    foto: d => `<div class="viz viz-foto"><img src="${esc(d.src)}" alt="${esc(d.alt || '')}" loading="lazy"></div>`,
  };

  function visualDe(b) {
    const v = b.visualTipo && VISUAL[b.visualTipo];
    return v ? v(b.dados || {}) : '';
  }

  let atual = 0, tocando = false, timer = null;
  const DURACAO = 7000;

  palco.innerHTML = `
    <div class="sl-tela" id="slTela">
      ${beats.map((b, i) => `
        <section class="sl-slide${i === 0 ? ' ativo' : ''}" data-i="${i}" ${i ? 'aria-hidden="true"' : ''}>
          <div class="sl-texto">
            ${b.rotulo ? `<span class="sl-rot">${esc(b.rotulo)}</span>` : ''}
            <h2 class="sl-frase">${linhas(b.naTela || '')}</h2>
            ${b.contexto ? `<p class="sl-ctx">${linhas(b.contexto)}</p>` : ''}
          </div>
          <div class="sl-viz">${visualDe(b)}</div>
        </section>`).join('')}
      <div class="sl-progresso" id="slProg">${beats.map((_, i) => `<button data-ir="${i}" aria-label="Tela ${i + 1}"><i></i></button>`).join('')}</div>
    </div>
    <div class="sl-controles">
      <button class="sl-btn" data-acao="anterior" aria-label="Anterior">←</button>
      <button class="sl-btn sl-play" data-acao="tocar" id="slPlay">▶ Reproduzir</button>
      <button class="sl-btn" data-acao="proximo" aria-label="Próximo">→</button>
      <span class="sl-contador" id="slConta"></span>
    </div>
    <div class="sl-fala">
      <b>🎬 o que você fala — não vai pra tela</b>
      <p id="slFala"></p>
      <small id="slVisual"></small>
    </div>`;

  const telas = [...palco.querySelectorAll('.sl-slide')];
  const pontos = [...palco.querySelectorAll('[data-ir]')];

  function pintar() {
    telas.forEach((el, i) => {
      el.classList.toggle('ativo', i === atual);
      if (i === atual) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
    });
    pontos.forEach((b, i) => b.classList.toggle('feito', i <= atual));
    palco.querySelector('#slFala').innerHTML = linhas(beats[atual].fala || '');
    const vis = beats[atual].visual;
    palco.querySelector('#slVisual').innerHTML = vis ? 'Imagem a gravar: ' + linhas(vis) : '';
    palco.querySelector('#slConta').textContent = `${atual + 1} / ${beats.length}`;
  }
  function ir(i) { atual = Math.max(0, Math.min(beats.length - 1, i)); pintar(); }
  function parar() { tocando = false; clearInterval(timer); palco.querySelector('#slPlay').textContent = '▶ Reproduzir'; }
  function tocar() {
    tocando = true;
    palco.querySelector('#slPlay').textContent = '❚❚ Pausar';
    timer = setInterval(() => { if (atual >= beats.length - 1) { parar(); return; } ir(atual + 1); }, DURACAO);
  }

  palco.addEventListener('click', ev => {
    const ponto = ev.target.closest('[data-ir]');
    if (ponto) { parar(); ir(Number(ponto.dataset.ir)); return; }
    const acao = ev.target.closest('[data-acao]')?.dataset.acao;
    if (acao === 'anterior') { parar(); ir(atual - 1); }
    if (acao === 'proximo') { parar(); ir(atual + 1); }
    if (acao === 'tocar') { tocando ? parar() : tocar(); }
  });
  document.addEventListener('keydown', ev => {
    if (/INPUT|TEXTAREA/.test(ev.target.tagName)) return;
    if (ev.key === 'ArrowLeft') { parar(); ir(atual - 1); }
    if (ev.key === 'ArrowRight') { parar(); ir(atual + 1); }
    if (ev.key === ' ') { ev.preventDefault(); tocando ? parar() : tocar(); }
  });

  /**
   * Cresce a tipografia de cada tela até o conteúdo ocupar a altura útil do slide.
   * Sem isso a cena fica com metade do quadro vazia — e calibrar tamanho por slide na mão
   * não sobrevive a uma troca de copy.
   */
  function ajustarTelas() {
    telas.forEach(el => {
      const texto = el.querySelector('.sl-texto');
      // Mede o CONTEÚDO do visual, não a coluna: ela é esticada e mediria sempre 100%.
      // A foto é elástica por natureza e não entra na conta — ela se adapta ao que sobrar.
      const viz = el.querySelector('.sl-viz > .viz:not(.viz-foto)');
      if (!el.clientHeight || !texto) return;
      const st = getComputedStyle(el);
      const util = el.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom);
      if (util <= 0) return;
      const altura = () => Math.max(texto.offsetHeight, viz ? viz.offsetHeight : 0);
      let baixo = 0.8, alto = 2.1, melhor = 1;
      for (let i = 0; i < 11; i++) {
        const meio = (baixo + alto) / 2;
        el.style.setProperty('--k', meio);
        if (altura() <= util * 0.93) { melhor = meio; baixo = meio; } else alto = meio;
      }
      el.style.setProperty('--k', melhor);
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarTelas);
  else ajustarTelas();
  let redim;
  addEventListener('resize', () => { clearTimeout(redim); redim = setTimeout(ajustarTelas, 180); });

  pintar();

  const ctx = document.querySelector('#slContexto');
  if (ctx) ctx.innerHTML = `
    ${V.intro ? `<p class="pg-intro">${linhas(V.intro)}</p>` : ''}
    ${V.cta ? `<div class="pg-destaque"><strong>O convite no fim do vídeo:</strong> ${linhas(V.cta)}</div>` : ''}
    <p class="pg-nota">Setas do teclado navegam; a barra de espaço reproduz.
    O painel escuro é o seu prompter — ele não aparece no vídeo.</p>`;
})();
