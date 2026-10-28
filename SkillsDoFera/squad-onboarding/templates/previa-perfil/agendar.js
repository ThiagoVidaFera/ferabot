(() => {
  'use strict';
  // Página de agendamento — destino real do link da bio.
  // Estrutura e visual no padrão FERA de página de agendamento:
  // hero de foto escurecida com chip → problema → o que se constrói → quem conduz → agenda → FAQ.
  const P = window.PROFILE || {};
  const A = (P.plano || {}).agendamento || {};
  const PG = A.pagina || {};
  const raiz = document.querySelector('#pgRoot');
  if (!raiz) return;

  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const linhas = v => esc(Array.isArray(v) ? v.join('\n') : v || '').replace(/\n/g, '<br>');

  document.title = `${P.name ? P.name + ' — ' : ''}Agendar`;
  const aviso = document.querySelector('#pgAviso');
  if (aviso) aviso.innerHTML = `<span>Proposta de página · ${esc(A.url || '')}</span><a class="pg-voltar" href="index.html">← Voltar ao perfil</a>`;

  // Grade ilustrativa: 3 dias úteis a partir de amanhã, ordem rotacionada por dia —
  // grade idêntica de um dia pro outro lê como horário falso.
  function grade() {
    const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    const BASE = ['09:00','11:00','14:30','16:30'];
    const saida = []; const d = new Date();
    while (saida.length < 3) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const giro = saida.length % BASE.length;
      saida.push({ dia: `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
                   horas: BASE.slice(giro).concat(BASE.slice(0,giro)).slice(0,3) });
    }
    return saida;
  }

  const foto = PG.foto || P.avatar || '';
  const fit = (P.offer && P.offer.fit) || [];

  raiz.innerHTML = `
    <header class="pg-hero">
      ${foto ? `<img src="${esc(foto)}" alt="" loading="eager">` : ''}
      <div class="pg-hero-dentro">
        ${PG.kicker ? `<span class="pg-chip">${esc(PG.kicker)}</span>` : ''}
        <h1>${linhas(PG.headline || 'Agende uma conversa')}</h1>
        ${PG.subheadline ? `<p>${linhas(PG.subheadline)}</p>` : ''}
        <a class="pg-cta" href="#grade">${esc(PG.botaoHero || 'Ver horários disponíveis')} <span aria-hidden="true">→</span></a>
        ${PG.reforcoCta ? `<p class="pg-micro">${linhas(PG.reforcoCta)}</p>` : ''}
      </div>
    </header>
    <main>
      ${(PG.bullets || []).length ? `<section class="pg-bloco">
        <h2>${esc(PG.tituloBullets || 'O que você leva dessa conversa')}</h2>
        <div class="pg-cards">${PG.bullets.map((b,i) => `<div class="pg-card"><b>${String(i+1).padStart(2,'0')}</b><p>${linhas(b)}</p></div>`).join('')}</div>
      </section>` : ''}

      ${PG.comoFunciona ? `<section class="pg-bloco pg-escuro">
        <h2>${esc(PG.comoFunciona.titulo || 'Como funciona a conversa')}</h2>
        <div class="pg-cards">${(PG.comoFunciona.etapas || []).map((e,i) => `
          <div class="pg-card"><b>${String(i+1).padStart(2,'0')}</b><strong>${esc(e.titulo||'')}</strong><p>${linhas(e.texto)}</p></div>`).join('')}</div>
      </section>` : ''}

      ${(A.passos || []).length ? `<section class="pg-bloco">
        <h2>O caminho até a conversa</h2>
        <ol class="pg-lista">${A.passos.map(s => `<li><strong>${esc(s.label||'')}</strong><span>${linhas(s.text)}</span></li>`).join('')}</ol>
      </section>` : ''}

      ${PG.autoridade ? `<section class="pg-bloco pg-claro">
        <h2>${esc(PG.autoridade.titulo || 'Quem conduz')}</h2>
        <p class="pg-intro">${linhas(PG.autoridade.texto)}</p>
        ${(PG.autoridade.marcos || []).length ? `<div class="pg-marcos">${PG.autoridade.marcos.map(m => `<div><b>${esc(m.numero)}</b><span>${esc(m.rotulo)}</span></div>`).join('')}</div>` : ''}
      </section>` : ''}

      <section class="pg-bloco" id="grade">
        <h2>${esc(PG.tituloAgenda || 'Escolha um horário')}</h2>
        ${PG.portao ? `<div class="pg-destaque"><strong>Antes de escolher:</strong> ${linhas(PG.portao)}</div>` : ''}
        <div class="pg-grade">${grade().map(d => `
          <div class="pg-dia"><b>${esc(d.dia)}</b><div>${d.horas.map(h => `<button type="button" class="pg-hora" data-hora="${esc(d.dia)} ${esc(h)}">${esc(h)}</button>`).join('')}</div></div>`).join('')}</div>
        <div class="pg-confirmar" id="pgConfirmar" hidden></div>
        ${PG.nota ? `<p class="pg-nota">${linhas(PG.nota)}</p>` : ''}
      </section>

      ${(PG.duvidas || []).length ? `<section class="pg-bloco pg-faq">
        <h2>Antes de marcar</h2>
        ${PG.duvidas.map(d => `<details><summary>${esc(d.pergunta)}</summary><p>${linhas(d.resposta)}</p></details>`).join('')}
      </section>` : ''}

      ${fit.length ? `<section class="pg-bloco pg-fit">
        <h2>Pra quem essa conversa faz sentido</h2>
        <ul>${fit.map(x => `<li>${linhas(x)}</li>`).join('')}</ul>
      </section>` : ''}

      <footer class="pg-rodape"><span>${esc(P.name || '')}</span><a href="index.html">← Voltar ao perfil</a></footer>
    </main>`;

  raiz.addEventListener('click', ev => {
    const botao = ev.target.closest('[data-hora]');
    if (!botao) return;
    raiz.querySelectorAll('.pg-hora').forEach(b => b.classList.toggle('ativo', b === botao));
    const caixa = raiz.querySelector('#pgConfirmar');
    caixa.hidden = false;
    caixa.innerHTML = `<p>Horário escolhido: <strong>${esc(botao.dataset.hora)}</strong></p>
      <button type="button" class="pg-cta pg-cta-escuro">${esc(PG.botao || 'Confirmar no WhatsApp')} <span aria-hidden="true">→</span></button>
      <small>Nesta prévia o botão não envia mensagem. Na página final ele abre o WhatsApp com o horário já escrito.</small>`;
    caixa.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
