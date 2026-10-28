(() => {
  'use strict';
  // Criativos de exemplo para cada página do funil, nos mesmos moldes que rodam nas contas
  // de anúncio do FERA — adaptados à foto e à oferta do cliente.
  //
  // Os três moldes vivos, decupados dos anúncios ativos em 26/10/2026:
  //   feed-resultado  → 4:5 escuro, número em destaque + foto do dono + bullets + botão (ad-teste-res-*)
  //   story-nativo    → 9:16 chapado, caixas de texto empilhadas no estilo do IG (ad-grupo-01)
  //   feed-editorial  → 4:5 claro, dor em serifada + mecanismo em lista (ad-jdc-01)
  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linhas = v => esc(Array.isArray(v) ? v.join('\n') : v || '').replace(/\n/g, '<br>');
  // **palavra** vira destaque colorido, como o número laranja dos criativos do FERA.
  const realce = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');

  const MOLDE = {
    'feed-resultado': c => `
      <div class="cr cr-feed cr-resultado">
        ${c.foto ? `<img class="cr-retrato" src="${esc(c.foto)}" alt="">` : ''}
        <div class="cr-dentro">
          ${c.eyebrow ? `<div class="cr-eyebrow">${realce(c.eyebrow)}</div>` : ''}
          <h4 class="cr-h">${realce(c.headline)}</h4>
          ${c.sub ? `<div class="cr-sub">${linhas(c.sub)}</div>` : ''}
          ${c.corpo ? `<p class="cr-p">${linhas(c.corpo)}</p>` : ''}
          ${(c.bullets || []).length ? `<ul class="cr-bul">${c.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          ${c.ctaLinha ? `<div class="cr-ctal">${esc(c.ctaLinha)}</div>` : ''}
          ${c.botao ? `<div class="cr-botao">${esc(c.botao)}<span aria-hidden="true">→</span></div>` : ''}
        </div>
      </div>`,

    'story-nativo': c => `
      <div class="cr cr-story cr-nativo" style="--fundo:${esc(c.fundo || '#17365D')}">
        ${c.publico ? `<span class="cx cx-amarelo">${esc(c.publico)}</span>` : ''}
        ${c.selo ? `<span class="cx cx-branco cx-grande">${esc(c.selo)}</span>` : ''}
        ${(c.caixas || []).map(t => `<span class="cx cx-preto">${realce(t)}</span>`).join('')}
        ${c.card ? `<div class="cr-card">
            ${c.foto ? `<img src="${esc(c.foto)}" alt="">` : ''}
            <p>${realce(c.card)}</p>
          </div>` : ''}
        ${(c.caixasFim || []).map(t => `<span class="cx cx-preto">${realce(t)}</span>`).join('')}
        ${c.dado ? `<div class="cr-dado">${realce(c.dado)}${c.fonte ? `<small>${esc(c.fonte)}</small>` : ''}</div>` : ''}
        ${c.botao ? `<span class="cx cx-branco cx-cta">${esc(c.botao)}</span>` : ''}
      </div>`,

    'feed-editorial': c => `
      <div class="cr cr-feed cr-editorial">
        <div class="cr-dentro">
          ${c.eyebrow ? `<div class="cr-eyebrow">${realce(c.eyebrow)}</div>` : ''}
          <h4 class="cr-h">${realce(c.headline)}</h4>
          ${c.corpo ? `<p class="cr-p">${linhas(c.corpo)}</p>` : ''}
          ${(c.bullets || []).length ? `<ul class="cr-bul">${c.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          ${c.assina ? `<div class="cr-assina">${c.foto ? `<img src="${esc(c.foto)}" alt="">` : ''}<span>${realce(c.assina)}</span></div>` : ''}
          ${c.botao ? `<div class="cr-botao">${esc(c.botao)}<span aria-hidden="true">→</span></div>` : ''}
        </div>
      </div>`,
  };

  /** Renderiza o bloco "3 criativos para esta página". */
  function render(lista, titulo, nota) {
    if (!(lista || []).length) return '';
    return `<div class="plan-criativos">
      <b>${esc(titulo || 'Três criativos pra levar tráfego até aqui')}</b>
      <div class="cr-trio">${lista.map(c => `
        <figure class="cr-item">
          ${(MOLDE[c.formato] || MOLDE['feed-editorial'])(c)}
          <figcaption>${esc(c.legenda || '')}</figcaption>
        </figure>`).join('')}</div>
      ${nota ? `<p class="plan-note">${linhas(nota)}</p>` : ''}
    </div>`;
  }

  window.renderCriativos = render;
})();
