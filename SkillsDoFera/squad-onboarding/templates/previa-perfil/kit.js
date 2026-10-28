(() => {
  'use strict';
  // Seção do Kit de Feed Inicial na prévia: explica, de forma didática, o que o cliente recebeu,
  // em que ordem posta, como a grade fica e quais campanhas ligar com quais artes.
  const P = window.PROFILE || {};
  const K = (P.plano || {}).kit;
  if (!K) return;

  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linhas = v => esc(Array.isArray(v) ? v.join('\n') : v || '').replace(/\n/g, '<br>');
  // Mesma convenção dos criativos: **texto** vira negrito. HTML cru no conteúdo sairia escapado.
  const forte = v => linhas(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  function render() {
    const grade = (K.grade || []).map((linha, i) => `
      <div class="kit-linha">
        <span class="kit-rot">${esc(linha.rotulo)}</span>
        <div class="kit-celulas">${linha.posts.map(p => `
          <div class="kit-cel"><b>${esc(p.n)}</b><strong>${esc(p.titulo)}</strong><span>${esc(p.papel)}</span></div>`).join('')}</div>
      </div>`).join('');

    const campanhas = (K.campanhas || []).map(c => `
      <div class="kit-camp">
        <div class="kit-camp-topo"><b>${esc(c.letra)}</b><div><strong>${esc(c.nome)}</strong><span>${esc(c.orcamento)}</span></div></div>
        <p>${forte(c.objetivo)}</p>
        <dl><dt>Destino</dt><dd>${esc(c.destino)}</dd>
            <dt>Criativos</dt><dd>${esc(c.artes)}</dd>
            <dt>Estrutura</dt><dd>1 campanha · 1 conjunto · 3 criativos</dd></dl>
      </div>`).join('');

    const passos = (K.passos || []).map(p => `<li><strong>${esc(p.titulo)}</strong><span>${forte(p.texto)}</span></li>`).join('');

    return `<section class="plan-section" id="planKit">
      <header class="plan-head"><span class="plan-num">06</span><div>
        <span class="simple-eyebrow">${esc(K.kicker || 'O kit pronto')}</span>
        <h2 class="plan-title">${linhas(K.titulo)}</h2>
        ${K.intro ? `<p class="plan-intro">${linhas(K.intro)}</p>` : ''}
      </div></header>

      ${K.destaque ? `<div class="kit-destaque">${forte(K.destaque)}</div>` : ''}

      <div class="kit-bloco">
        <b>1. Os 6 carrosséis que ficam fixados no topo</b>
        <div class="kit-grade">${grade}</div>
        ${K.notaGrade ? `<p class="plan-note">${linhas(K.notaGrade)}</p>` : ''}
      </div>

      <div class="kit-bloco">
        <b>2. As 9 artes que são post e anúncio ao mesmo tempo</b>
        ${K.introEstaticos ? `<p class="kit-p">${forte(K.introEstaticos)}</p>` : ''}
        <div class="kit-camps">${campanhas}</div>
        ${K.notaCampanhas ? `<p class="plan-note">${linhas(K.notaCampanhas)}</p>` : ''}
      </div>

      <div class="kit-bloco">
        <b>3. A ordem de postar</b>
        <ol class="kit-passos">${passos}</ol>
      </div>

      ${K.isca ? `<div class="kit-bloco">
        <b>4. A isca em PDF — o que a pessoa recebe</b>
        <p class="kit-p">${forte(K.isca.texto)}</p>
        <a class="plan-abrir" href="${esc(K.isca.arquivo)}" target="_blank" rel="noopener">Abrir o PDF da isca <span aria-hidden="true">↗</span></a>
      </div>` : ''}

      ${K.drive ? `<a class="plan-abrir" href="${esc(K.drive)}" target="_blank" rel="noopener">
        Baixar as artes no Google Drive <span aria-hidden="true">↗</span></a>` : ''}
    </section>`;
  }

  window.renderKit = render;
})();
