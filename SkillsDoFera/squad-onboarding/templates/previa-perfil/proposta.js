(() => {
  'use strict';
  // Página que apresenta a oferta. ESTRUTURA no padrão FERA de página de proposta:
  // hero com diagrama + assinatura → checklist de reconhecimento → o que está em jogo →
  // calculadora → as peças → prova → o insight → convite → os primeiros dias → o que NÃO é →
  // investimento → CTA → FAQ → barra fixa.
  // O VISUAL segue o padrão das páginas da prévia (paginas.css), não o creme/laranja.
  const P = window.PROFILE || {};
  const O = (P.plano || {}).proposta || {};
  const OF = P.offer || {};
  const raiz = document.querySelector('#pgRoot');
  if (!raiz) return;

  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linhas = v => esc(Array.isArray(v) ? v.join('\n') : v || '').replace(/\n/g, '<br>');
  // Realce de palavras-chave na headline, como os destaques coloridos da referência.
  const realce = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
  const real = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

  document.title = `${P.name ? P.name + ' — ' : ''}${OF.title || 'Proposta'}`;
  const aviso = document.querySelector('#pgAviso');
  if (aviso) aviso.innerHTML = `<span>Proposta de página · ${esc(O.url || '')}</span><a class="pg-voltar" href="index.html">← Voltar ao perfil</a>`;

  const C = O.calculadora || {};

  raiz.innerHTML = `
    <header class="pg-hero pr-hero">
      ${O.foto ? `<img src="${esc(O.foto)}" alt="" loading="eager">` : ''}
      <div class="pg-hero-dentro pr-hero-grade">
        <div>
          ${O.kicker ? `<span class="pg-chip">${esc(O.kicker)}</span>` : ''}
          <h1>${realce(O.headline || OF.title || '')}</h1>
          ${O.subheadline ? `<p>${linhas(O.subheadline)}</p>` : ''}
          <a class="pg-cta" href="#investimento">${esc(O.botaoHero || 'Ver como funciona')} <span aria-hidden="true">→</span></a>
          ${O.assinatura ? `<div class="pr-assina">${P.avatar ? `<img src="${esc(P.avatar)}" alt="">` : ''}<p><b>${esc(O.assinatura.quem || P.name || '')}</b> ${linhas(O.assinatura.texto)}</p></div>` : ''}
        </div>
        ${(O.diagrama || []).length ? `<div class="pr-diagrama">
          <div class="pr-fluxo">${O.diagrama.map((d, i) => `
            ${i ? '<span class="pr-seta" aria-hidden="true"></span>' : ''}
            <span class="pr-no${d.fim ? ' fim' : ''}">${esc(d.rotulo)}</span>`).join('')}</div>
          ${(O.diagramaLegendas || []).length ? `<div class="pr-legendas">${O.diagramaLegendas.map(l => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
        </div>` : ''}
      </div>
    </header>
    <main>
      ${(O.reconhecimento || []).length ? `<section class="pg-bloco">
        <h2>${esc(O.tituloReconhecimento || 'Quantas dessas aconteceram com você no último mês?')}</h2>
        <div class="pr-check">${O.reconhecimento.map((r, i) => `
          <button type="button" class="pr-item" data-marca="${i}"><i aria-hidden="true"></i><span>${linhas(r)}</span></button>`).join('')}</div>
        <p class="pg-nota" id="prConta"></p>
      </section>` : ''}

      ${(O.emJogo || []).length ? `<section class="pg-bloco pg-escuro">
        <h2>${esc(O.tituloEmJogo || 'O que está em jogo')}</h2>
        <div class="pg-cards">${O.emJogo.map(c => `
          <div class="pg-card pr-card"><b>${esc(c.rotulo)}</b><p>${linhas(c.texto)}</p></div>`).join('')}</div>

        ${C.pergunta ? `<div class="pr-calc">
          <label for="prTicket">${esc(C.pergunta)}</label>
          <div class="pr-calc-campo">R$ <input id="prTicket" type="number" inputmode="numeric" min="0" step="100" value="${esc(C.ticketPadrao || 3000)}"></div>
          <div class="pr-calc-saida" id="prSaida"></div>
        </div>` : ''}
      </section>` : ''}

      ${(O.pecas || []).length ? `<section class="pg-bloco">
        <h2>${esc(O.tituloPecas || 'As peças. Quando elas se encaixam, o dinheiro aparece.')}</h2>
        ${O.introPecas ? `<p class="pg-intro">${linhas(O.introPecas)}</p>` : ''}
        <div class="pg-cards">${O.pecas.map((p, i) => `
          <div class="pg-card"><b>${String(i + 1).padStart(2, '0')}</b><strong>${esc(p.titulo)}</strong><p>${linhas(p.texto)}</p></div>`).join('')}</div>
      </section>` : ''}

      ${O.prova ? `<section class="pg-bloco pg-claro">
        <h2>${esc(O.prova.titulo)}</h2>
        <p class="pg-intro">${linhas(O.prova.texto)}</p>
        ${(O.prova.marcos || []).length ? `<div class="pg-marcos">${O.prova.marcos.map(m => `<div><b>${esc(m.numero)}</b><span>${esc(m.rotulo)}</span></div>`).join('')}</div>` : ''}
      </section>` : ''}

      ${O.insight ? `<section class="pg-bloco pr-insight">
        <h2>${realce(O.insight.titulo)}</h2>
        ${O.insight.texto ? `<p class="pg-intro">${linhas(O.insight.texto)}</p>` : ''}
      </section>` : ''}

      ${(O.primeirosDias || []).length ? `<section class="pg-bloco pg-escuro">
        <h2>${esc(O.tituloPrimeirosDias || 'Como são os primeiros dias, sem promessa mágica.')}</h2>
        <ol class="pg-lista">${O.primeirosDias.map(d => `<li><strong>${esc(d.quando)}</strong><span>${linhas(d.texto)}</span></li>`).join('')}</ol>
      </section>` : ''}

      ${O.naoSou ? `<section class="pg-bloco">
        <h2>${esc(O.naoSou.titulo)}</h2>
        <p class="pg-intro">${linhas(O.naoSou.texto)}</p>
        ${(O.naoSou.itens || []).length ? `<ul class="pg-fit">${O.naoSou.itens.map(x => `<li>${linhas(x)}</li>`).join('')}</ul>` : ''}
      </section>` : ''}

      <section class="pg-bloco pg-claro" id="investimento">
        <h2>${esc(O.tituloInvestimento || OF.title || 'O investimento')}</h2>
        ${OF.intro ? `<p class="pg-intro">${linhas(OF.intro)}</p>` : ''}
        <div class="pr-preco">
          ${O.preco ? `<div class="pr-valor"><b>${esc(O.preco.valor)}</b>${O.preco.condicao ? `<span>${esc(O.preco.condicao)}</span>` : ''}</div>` : ''}
          ${(O.incluso || []).length ? `<ul class="pr-incluso">${O.incluso.map(x => `<li>${linhas(x)}</li>`).join('')}</ul>` : ''}
        </div>
        ${O.garantia ? `<div class="pg-destaque"><strong>Garantia:</strong> ${linhas(O.garantia)}</div>` : ''}
      </section>

      ${(OF.fit || []).length ? `<section class="pg-bloco pg-fit">
        <h2>${esc(O.tituloFit || 'Pra quem faz sentido')}</h2>
        <ul>${OF.fit.map(x => `<li>${linhas(x)}</li>`).join('')}</ul>
      </section>` : ''}

      ${(O.duvidas || []).length ? `<section class="pg-bloco pg-faq">
        <h2>Perguntas</h2>
        ${O.duvidas.map(d => `<details><summary>${esc(d.pergunta)}</summary><p>${linhas(d.resposta)}</p></details>`).join('')}
      </section>` : ''}

      <section class="pg-bloco pr-fecho">
        <h2>${esc(O.tituloFecho || 'Faz sentido pro seu momento?')}</h2>
        ${O.textoFecho ? `<p class="pg-intro">${linhas(O.textoFecho)}</p>` : ''}
        <a class="pg-cta pg-cta-escuro" href="agendar.html">${esc(O.botaoFecho || 'Agendar uma conversa')} <span aria-hidden="true">→</span></a>
      </section>

      <footer class="pg-rodape"><span>${esc(P.name || '')}</span><a href="index.html">← Voltar ao perfil</a></footer>
    </main>
    <div class="pr-barra">
      <div><b>${esc(OF.title || '')}</b><span>${esc(O.barraNota || '')}</span></div>
      <a class="pg-cta pg-cta-escuro" href="agendar.html">${esc(O.botaoBarra || 'Agendar')} <span aria-hidden="true">→</span></a>
    </div>`;

  // Checklist de reconhecimento: marcar devolve a contagem — é o espelho que gera a decisão.
  const marcados = new Set();
  raiz.addEventListener('click', ev => {
    const item = ev.target.closest('[data-marca]');
    if (!item) return;
    const i = item.dataset.marca;
    marcados.has(i) ? marcados.delete(i) : marcados.add(i);
    item.classList.toggle('on', marcados.has(i));
    const saida = raiz.querySelector('#prConta');
    const total = (O.reconhecimento || []).length;
    saida.textContent = marcados.size
      ? `${marcados.size} de ${total}. ${marcados.size >= 3 ? (O.notaMuitas || 'É disso que esta página trata.') : (O.notaPoucas || 'Mesmo uma já custa dinheiro todo mês.')}`
      : '';
  });

  // Calculadora: transforma o ticket dele no tamanho do problema.
  const campo = raiz.querySelector('#prTicket');
  if (campo) {
    const atualizar = () => {
      const t = Number(campo.value) || 0;
      const n = C.multiplicador || 10;
      raiz.querySelector('#prSaida').innerHTML = t > 0
        ? `${esc(C.prefixo || 'Com esse ticket,')} <b>${esc(n)} ${esc(C.unidade || 'oportunidades paradas')}</b> ${esc(C.ligacao || 'valem')} <b>${real(t * n)}</b>. ${esc(C.fecho || '')}`
        : '';
    };
    campo.addEventListener('input', atualizar);
    atualizar();
  }
})();
