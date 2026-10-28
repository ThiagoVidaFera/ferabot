(() => {
  'use strict';
  // Seções do plano abaixo do perfil: agendamento (destino do link da bio),
  // campanha do grupo + isca PDF, roteiro do vídeo de 18 minutos e conversas de WhatsApp.
  const P = window.PROFILE || {};
  const PLANO = P.plano || {};
  const root = document.querySelector('#planSections');
  if (!root || document.body.classList.contains('render-mode')) return;

  const escape = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lines = value => escape(Array.isArray(value) ? value.join('\n') : value || '').replace(/\n/g, '<br>');

  const criativos = (lista, titulo, nota) =>
    (window.renderCriativos ? window.renderCriativos(lista, titulo, nota) : '');

  function head(num, kicker, title, intro) {
    return `<header class="plan-head"><span class="plan-num">${escape(num)}</span><div><span class="simple-eyebrow">${escape(kicker)}</span><h2 class="plan-title">${lines(title)}</h2>${intro ? `<p class="plan-intro">${lines(intro)}</p>` : ''}</div></header>`;
  }

  function agendamentoMarkup(a) {
    if (!a) return '';
    const pg = a.pagina || {};
    return `<section class="plan-section" id="planAgendamento">${head('01', a.kicker || 'Link da bio', a.title || 'O link da bio leva pra uma página de agendamento', a.intro)}
      <div class="plan-grid">
        <div class="plan-mock" role="img" aria-label="Prévia da página de agendamento">
          <div class="mock-browser"><span></span><span></span><span></span><em>${escape(a.url || 'agendar.seudominio.com')}</em></div>
          <div class="mock-page">
            ${pg.headline ? `<h3>${lines(pg.headline)}</h3>` : ''}
            ${pg.subheadline ? `<p class="mock-sub">${lines(pg.subheadline)}</p>` : ''}
            ${(pg.bullets || []).length ? `<ul class="mock-bullets">${pg.bullets.map(b => `<li>${lines(b)}</li>`).join('')}</ul>` : ''}
            ${pg.portao ? `<div class="mock-gate">${lines(pg.portao)}</div>` : ''}
            <div class="mock-slots" aria-hidden="true"><b>Escolha um horário</b><div><span>Ter · 10h</span><span>Qua · 14h</span><span>Qui · 16h</span><span>Sex · 09h</span></div></div>
            <button class="solid-button" type="button" disabled>${escape(pg.botao || 'Confirmar no WhatsApp')}</button>
            ${pg.nota ? `<small class="mock-note">${lines(pg.nota)}</small>` : ''}
          </div>
        </div>
        <div class="plan-copy">
          ${(a.passos || []).length ? `<ol class="plan-steps">${a.passos.map(s => `<li><strong>${escape(s.label || '')}</strong><span>${lines(s.text)}</span></li>`).join('')}</ol>` : ''}
          ${a.nota ? `<p class="plan-note">${lines(a.nota)}</p>` : ''}
          <a class="plan-abrir" href="agendar.html" target="_blank" rel="noopener">Abrir a página de agendamento <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      ${criativos(a.criativos, 'Três criativos que levam pra essa página', a.notaCriativos)}</section>`;
  }

  function campanhaMarkup(c) {
    if (!c) return '';
    const an = c.anuncio || {};
    const isca = c.isca || {};
    return `<section class="plan-section" id="planCampanha">${head('02', c.kicker || 'Campanha do grupo', c.title || 'Uma campanha simples que leva pro grupo e entrega a isca em PDF', c.intro)}
      ${(c.caminho || []).length ? `<div class="plan-funnel">${c.caminho.map((st, i) => `<div class="funnel-step"><b>${String(i + 1).padStart(2, '0')}</b><strong>${escape(st.label || '')}</strong><span>${lines(st.text)}</span></div>`).join('<div class="funnel-arrow" aria-hidden="true">→</div>')}</div>` : ''}
      <div class="plan-grid">
        <div class="plan-ad">
          <span class="simple-eyebrow">Exemplo de anúncio</span>
          ${an.headline ? `<h3>${lines(an.headline)}</h3>` : ''}
          ${an.corpo ? `<p>${lines(an.corpo)}</p>` : ''}
          ${an.cta ? `<div class="ad-cta">${escape(an.cta)}</div>` : ''}
        </div>
        <div class="plan-copy">
          <span class="simple-eyebrow">A isca digital (PDF gratuito)</span>
          ${isca.titulo ? `<h3 class="plan-subtitle">${lines(isca.titulo)}</h3>` : ''}
          ${isca.descricao ? `<p>${lines(isca.descricao)}</p>` : ''}
          ${(isca.capitulos || []).length ? `<ul class="material-checks plan-checks">${isca.capitulos.map(x => `<li>${lines(x)}</li>`).join('')}</ul>` : ''}
          ${c.grupo ? `<p class="plan-note">${lines(c.grupo)}</p>` : ''}
          <a class="plan-abrir" href="grupo.html" target="_blank" rel="noopener">Abrir a página do grupo <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      ${criativos(c.criativos, 'Três criativos que levam pro grupo', c.notaCriativos)}</section>`;
  }

  function videoMarkup(v) {
    if (!v) return '';
    return `<section class="plan-section" id="planVideo">${head('03', v.kicker || 'YouTube', v.title || 'O roteiro do vídeo de 18 minutos', v.intro)}
      <div class="plan-previa-video">
        <div class="plan-video-cena">
          <span class="plan-video-tempo">${escape((v.beats && v.beats[0] && v.beats[0].tempo) || '0:00')}</span>
          <div class="plan-video-frase">${lines((v.beats && v.beats[0] && v.beats[0].naTela) || v.title || '')}</div>
          <div class="plan-video-barras" aria-hidden="true">${(v.beats || []).map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</div>
        </div>
        <div class="plan-copy">
          <p>${escape((v.beats || []).length)} telas, do gancho ao convite — cada uma com a frase que aparece no vídeo e a fala correspondente, no seu prompter.</p>
          ${v.cta ? `<p class="plan-note">${lines(v.cta)}</p>` : ''}
          <a class="plan-abrir" href="slides.html" target="_blank" rel="noopener">Abrir os slides animados <span aria-hidden="true">↗</span></a>
        </div>
      </div></section>`;
  }

  function conversasMarkup(w) {
    if (!w) return '';
    const regras = (w.regras || []).length
      ? `<div class="plan-regras"><b>As três regras que atravessam todas as mensagens</b><ol>${w.regras.map(r => `<li>${lines(r)}</li>`).join('')}</ol></div>` : '';
    const mapa = (w.mapa || []).length
      ? `<div class="plan-mapa"><table><thead><tr><th>Etapa</th><th>Gatilho</th><th>Quem</th><th>Objetivo</th></tr></thead><tbody>${w.mapa.map(m => `<tr><td><b>${escape(m.etapa)}</b> ${escape(m.nome)}</td><td>${escape(m.gatilho)}</td><td>${escape(m.quem)}</td><td>${escape(m.objetivo)}</td></tr>`).join('')}</tbody></table></div>` : '';
    return `<section class="plan-section" id="planConversas">${head('04', w.kicker || 'WhatsApp', w.title || 'As conversas no WhatsApp, do primeiro oi ao agendamento', w.intro)}
      ${regras}${mapa}
      <div class="plan-chats">${(w.conversas || []).map(ch => `<article class="plan-chat"><header><strong>${escape(ch.titulo || '')}</strong>${ch.contexto ? `<span>${lines(ch.contexto)}</span>` : ''}</header><div class="chat-body">${(ch.mensagens || []).map(m => `<div class="dm-bubble${m.de === 'lead' ? ' user' : ''}">${lines(m.texto)}</div>`).join('')}</div></article>`).join('')}</div>
      ${w.nota ? `<p class="plan-note">${lines(w.nota)}</p>` : ''}</section>`;
  }

  root.innerHTML = [
    PLANO.titulo ? `<header class="plan-opening"><span class="simple-eyebrow">${escape(PLANO.kicker || 'O plano por trás do perfil')}</span><h2>${lines(PLANO.titulo)}</h2>${PLANO.intro ? `<p>${lines(PLANO.intro)}</p>` : ''}</header>` : '',
    agendamentoMarkup(PLANO.agendamento),
    campanhaMarkup(PLANO.campanhaGrupo),
    videoMarkup(PLANO.videoYoutube),
    conversasMarkup(PLANO.conversasWhatsApp),
    (PLANO.proposta && (PLANO.proposta.criativos || []).length)
      ? `<section class="plan-section" id="planCriativosProposta">${head('05', 'Anúncios da oferta', 'Três criativos que levam pra proposta', PLANO.proposta.introCriativos)}
          ${criativos(PLANO.proposta.criativos, 'Três criativos que levam pra página da proposta', PLANO.proposta.notaCriativos)}
         </section>` : '',
    (window.renderKit ? window.renderKit() : ''),
    PLANO.fechamento ? `<footer class="plan-closing"><p>${lines(PLANO.fechamento)}</p>${PLANO.fechamentoCta ? `<a class="solid-button plan-abrir-prop" href="proposta.html" target="_blank" rel="noopener">${escape(PLANO.fechamentoCta)} <span aria-hidden="true">↗</span></a>` : ''}</footer>` : ''
  ].join('');

  // O link da bio abre agendar.html numa aba nova (é o destino real).
  // [data-action="agenda"] sobrou para botões internos que só querem levar até a seção.
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-action="agenda"]')) return;
    const alvo = document.querySelector('#planAgendamento');
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
