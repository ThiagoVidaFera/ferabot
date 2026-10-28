(() => {
  'use strict';
  // Página de captura do grupo de WhatsApp — destino dos anúncios da seção 02.
  // Clonada da /grupo/ que está no ar e recebendo anúncio: uma dobra, promessa da isca,
  // o que a pessoa recebe, o que NÃO é, e o formulário curto (nome + WhatsApp).
  const P = window.PROFILE || {};
  const C = (P.plano || {}).campanhaGrupo || {};
  const G = C.pagina || {};
  const ISCA = C.isca || {};
  const raiz = document.querySelector('#pgRoot');
  if (!raiz) return;

  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linhas = v => esc(Array.isArray(v) ? v.join('\n') : v || '').replace(/\n/g, '<br>');

  document.title = `${P.name ? P.name + ' — ' : ''}Grupo no WhatsApp`;
  const aviso = document.querySelector('#pgAviso');
  if (aviso) aviso.innerHTML = `<span>Proposta de página · ${esc(G.url || 'grupo')}</span><a class="pg-voltar" href="index.html">← Voltar ao perfil</a>`;

  const foto = G.foto || P.avatar || '';

  raiz.innerHTML = `
    <header class="pg-hero">
      ${foto ? `<img src="${esc(foto)}" alt="" loading="eager">` : ''}
      <div class="pg-hero-dentro">
        <span class="pg-chip">${esc(G.kicker || 'Grupo no WhatsApp · gratuito')}</span>
        <h1>${linhas(G.headline || ISCA.titulo || 'Entre no grupo')}</h1>
        ${G.subheadline ? `<p>${linhas(G.subheadline)}</p>` : ''}
        <a class="pg-cta" href="#entrar">${esc(G.botaoHero || 'Quero entrar no grupo')} <span aria-hidden="true">→</span></a>
        ${G.reforcoCta ? `<p class="pg-micro">${linhas(G.reforcoCta)}</p>` : ''}
      </div>
    </header>
    <main>
      ${(ISCA.capitulos || []).length ? `<section class="pg-bloco">
        <h2>${esc(G.tituloIsca || 'O que você recebe assim que entrar')}</h2>
        ${ISCA.descricao ? `<p class="pg-intro">${linhas(ISCA.descricao)}</p>` : ''}
        <ol class="pg-lista">${ISCA.capitulos.map(c => `<li><strong>${linhas(c)}</strong></li>`).join('')}</ol>
      </section>` : ''}

      ${(G.rotina || []).length ? `<section class="pg-bloco pg-escuro">
        <h2>${esc(G.tituloRotina || 'O que acontece no grupo depois')}</h2>
        <div class="pg-cards">${G.rotina.map((r,i) => `
          <div class="pg-card"><b>${String(i+1).padStart(2,'0')}</b><strong>${esc(r.titulo||'')}</strong><p>${linhas(r.texto)}</p></div>`).join('')}</div>
      </section>` : ''}

      ${(G.naoE || []).length ? `<section class="pg-bloco">
        <h2>${esc(G.tituloNaoE || 'Antes de entrar')}</h2>
        <ul class="pg-fit">${G.naoE.map(x => `<li>${linhas(x)}</li>`).join('')}</ul>
      </section>` : ''}

      <section class="pg-bloco pg-claro" id="entrar">
        <h2>${esc(G.tituloForm || 'Entrar no grupo')}</h2>
        ${G.textoForm ? `<p class="pg-intro">${linhas(G.textoForm)}</p>` : ''}
        <form class="pg-form" id="pgForm" novalidate>
          <label>Seu nome<input type="text" name="nome" autocomplete="name" placeholder="Como você quer ser chamado"></label>
          <label>Seu WhatsApp<input type="tel" name="zap" autocomplete="tel" placeholder="(00) 00000-0000"></label>
          <button type="submit" class="pg-cta pg-cta-escuro">${esc(G.botao || 'Entrar no grupo agora')} <span aria-hidden="true">→</span></button>
        </form>
        <div class="pg-confirmar" id="pgOk" hidden></div>
        ${G.nota ? `<p class="pg-nota">${linhas(G.nota)}</p>` : ''}
      </section>

      <footer class="pg-rodape"><span>${esc(P.name || '')}</span><a href="index.html">← Voltar ao perfil</a></footer>
    </main>`;

  raiz.addEventListener('submit', ev => {
    if (ev.target.id !== 'pgForm') return;
    ev.preventDefault();                       // nesta prévia o form não envia nada
    const nome = (ev.target.nome.value || '').trim();
    const ok = raiz.querySelector('#pgOk');
    ok.hidden = false;
    ok.innerHTML = `<p>${nome ? esc(nome) + ', é' : 'É'} aqui que o link do grupo aparece.</p>
      <small>Na página final, enviar o formulário registra o lead no CRM e abre o convite do grupo na hora.
      Nesta prévia nada é enviado.</small>`;
    ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
