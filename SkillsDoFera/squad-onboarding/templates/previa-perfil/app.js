(() => {
  'use strict';
  const P = window.PROFILE || {};
  const escape = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lines = value => escape(Array.isArray(value) ? value.join('\n') : value || '').replace(/\n/g, '<br>');
  const svg = name => {
    const paths = {left:'<path d="m14 5-7 7 7 7"/>',right:'<path d="m10 5 7 7-7 7"/>',send:'<path d="m5 12 7-7 7 7M12 5v15"/>',carousel:'<rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V5a2 2 0 0 1 2-2h11"/>',reel:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M7 5l3 5M14 5l3 5"/>'};
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  };
  function bodyText(body) {
    if (!body) return '';
    return (Array.isArray(body) ? body : String(body).split(/\n\n/)).map(p => `<p>${lines(p)}</p>`).join('');
  }
  function renderSlide(slide = {}, options = {}) {
    const live = options.live || false;
    const eager = options.eager || false;
    const loading = eager ? 'eager' : 'lazy';
    const alt = escape(slide.alt || slide.title || slide.subtitle || 'Fotografia do perfil');
    if (slide.export && !live) return `<div class="slide-frame exported-slide" data-slide-id="${escape(slide.id)}"><img class="slide-image" src="${escape(slide.export)}" alt="${alt}" loading="${loading}" decoding="async"></div>`;
    const data = `data-slide-id="${escape(slide.id || '')}"`;
    if (slide.type === 'video') return `<div class="slide-frame video-frame" ${data}><video controls playsinline preload="metadata" ${slide.poster ? `poster="${escape(slide.poster)}"` : ''} aria-label="${alt}"><source src="${escape(slide.src)}">Seu navegador não conseguiu reproduzir este vídeo.</video></div>`;
    const layout = slide.layout || 'clean';
    if (slide.type === 'photo' || (slide.image && slide.type !== 'editorial')) {
      const overlay = layout !== 'clean' && slide.title;
      const klass = layout === 'top-strip' ? 'strip top' : layout === 'note' ? 'strip center' : '';
      return `<div class="cover-frame layout-${escape(layout)}" ${data}><img class="cover-image" src="${escape(slide.image || slide.src || '')}" alt="${alt}" loading="${loading}" decoding="async" ${slide.position ? `style="object-position:${escape(slide.position)}"` : ''}>${overlay ? `${layout === 'bottom-title' ? '<div class="cover-shade"></div>' : ''}<div class="cover-headline ${klass}">${layout === 'top-strip' || layout === 'note' ? `<span>${lines(slide.title)}</span>` : lines(slide.title)}</div>` : ''}${slide.subtitle ? `<div class="photo-subtitle">${lines(slide.subtitle)}</div>` : ''}</div>`;
    }
    const theme = slide.theme || (['paper','note','conversation'].includes(layout) ? 'sand' : layout === 'flow' ? 'olive' : 'charcoal');
    const items = slide.items || [];
    let itemMarkup = '';
    if (layout === 'conversation') itemMarkup = `<div class="slide-conversation">${items.map((it,i)=>`<div class="slide-message ${i%2 ? 'reply' : ''}">${it.label ? `<strong>${escape(it.label)}</strong>` : ''}<span>${lines(it.text)}</span></div>`).join('')}</div>`;
    else if (layout === 'split') itemMarkup = `<div class="slide-columns">${items.map(it=>`<div>${it.label ? `<strong>${escape(it.label)}</strong>` : ''}<span>${lines(it.text)}</span></div>`).join('')}</div>`;
    else if (layout === 'flow') itemMarkup = `<div class="slide-flow">${items.map((it,i)=>`<div class="flow-item"><span class="flow-num">${String(i+1).padStart(2,'0')}</span><div>${it.label ? `<strong>${escape(it.label)}</strong>` : ''}<p>${lines(it.text)}</p></div></div>`).join('')}</div>`;
    else itemMarkup = items.length ? `<div class="slide-items">${items.map(it=>`<div class="slide-step">${it.label ? `<b>${escape(it.label)}</b>` : ''}<span>${lines(it.text)}</span></div>`).join('')}</div>` : '';
    // titleSize/bodySize viram custom properties: o auto-ajuste multiplica os dois por --fit,
    // em vez de cada slide ser calibrado na mão.
    const escala = `--t:${Number(slide.titleSize) || 7.8};--b:${Number(slide.bodySize) || 4.2}`;
    const miolo = `${slide.kicker ? `<div class="slide-kicker">${escape(slide.kicker)}</div>` : ''}${slide.title ? `<h2 class="slide-title">${lines(slide.title)}</h2>` : ''}${slide.subtitle ? `<div class="slide-subtitle">${lines(slide.subtitle)}</div>` : ''}${slide.body ? `<div class="slide-body">${bodyText(slide.body)}</div>` : ''}${itemMarkup}${slide.footer ? `<div class="slide-foot">${lines(slide.footer)}</div>` : ''}`;
    return `<div class="slide-frame" ${data}><div class="slide-composition ${escape(theme)} layout-${escape(layout)}" style="${escala}"><div class="slide-inner">${miolo}</div></div></div>`;
  }

  /**
   * Cresce a tipografia até o texto ocupar a altura útil do slide.
   * Sem isso, slide de texto curto fica com metade do quadro vazia e o feed parece inacabado —
   * e calibrar titleSize por slide na mão não sobrevive a uma troca de copy.
   */
  function ajustarEscala(raiz) {
    (raiz || document).querySelectorAll('.slide-composition').forEach(comp => {
      const inner = comp.querySelector('.slide-inner');
      if (!inner || !comp.clientHeight) return;
      const estilo = getComputedStyle(comp);
      const util = comp.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
      if (util <= 0) return;
      let baixo = 0.75, alto = 2.4, melhor = 1;
      for (let i = 0; i < 12; i++) {           // busca binária: ~12 passos bastam p/ 0,1% de erro
        const meio = (baixo + alto) / 2;
        comp.style.setProperty('--fit', meio);
        if (inner.offsetHeight <= util * 0.95) { melhor = meio; baixo = meio; } else alto = meio;
      }
      comp.style.setProperty('--fit', melhor);
    });
  }
  window.ajustarEscala = ajustarEscala;
  // Medir antes das fontes carregarem dá altura errada e o slide fica apertado ou frouxo.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ajustarEscala());

  window.renderSlide = renderSlide;
  window.findProfileSlide = id => [...(P.posts || []),...(P.highlights || [])].flatMap(x=>x.slides || []).find(s=>s.id === id);

  if (document.body.classList.contains('render-mode')) {
    const id = new URLSearchParams(location.search).get('slide');
    const slide = window.findProfileSlide(id);
    const root = document.querySelector('#renderRoot');
    if (slide) { root.innerHTML = renderSlide(slide,{live:true,eager:true}); ajustarEscala(root); document.title = `Slide ${id}`; }
    else { root.innerHTML = '<p class="load-note">Slide não encontrado.</p>'; document.body.dataset.error = 'slide-not-found'; }
    if (slide) Promise.all(Array.from(root.querySelectorAll('img')).map(img=>img.decode())).then(()=>document.fonts.ready).then(()=>{document.body.dataset.ready='true';window.renderReady=true;}).catch(()=>{document.body.dataset.error='image-load-failed';window.renderReady=false;});
    return;
  }
  const grid = document.querySelector('#feedGrid');
  const dialog = document.querySelector('#contentDialog');
  const content = document.querySelector('#dialogContent');
  if (!grid || !dialog) return;
  const posts = P.posts || [];
  const highlights = P.highlights || [];
  let view = null, currentPost = null, currentHighlight = null, slideIndex = 0, returnFocus = null, filter = 'all';
  let dmStarted = false, touchStart = null;
  const firstHighlight = () => highlights.find(h=>h.id === 'comece') || highlights[0];
  const status = message => {document.querySelector('#liveStatus').textContent = message;};
  const avatar = (cls='reader-avatar') => `<img class="${cls}" src="${escape(P.avatar || '')}" alt="${escape(P.name || 'Foto de perfil')}" loading="eager">`;
  function init() {
    if (!P.handle) {document.querySelector('#profileHeader').innerHTML='<p class="load-note">Perfil em preparação.</p>';return;}
    document.title = `${P.name} — proposta de perfil`;
    document.querySelector('#profileHeader').innerHTML = `<button class="avatar-wrap" data-action="start" aria-label="Abrir apresentação de ${escape(P.name)}">${avatar('profile-avatar')}</button><div class="profile-info"><div class="profile-topline"><h1 class="profile-handle">${escape(P.handle)}</h1><div class="profile-actions"><button class="solid-button" data-action="start">Ver como funciona</button><button class="secondary-button" data-action="dm">Mensagem</button></div></div><p class="profile-count"><strong>${posts.length}</strong> posições</p><p class="profile-name">${escape(P.name)}</p>${P.category ? `<p class="profile-category">${escape(P.category)}</p>` : ''}<p class="profile-bio">${lines(P.bio)}</p><a class="bio-link" href="agendar.html" target="_blank" rel="noopener"><span aria-hidden="true">↗</span>${escape(P.bioLink || 'Agendar uma conversa')}</a></div>`;
    document.querySelector('#highlights').innerHTML = highlights.map(h=>`<button class="highlight-button" data-highlight="${escape(h.id)}" aria-label="Abrir destaque ${escape(h.title)}"><span class="highlight-ring"><img src="${escape(h.cover || h.slides?.[0]?.image || P.avatar)}" alt="" loading="eager"></span><span class="highlight-label">${escape(h.title)}</span></button>`).join('');
    document.querySelector('#footerName').textContent=P.name;
    if (P.topNote) {
      const note = document.createElement('p');note.className='profile-context';note.textContent=P.topNote;
      document.querySelector('#profileHeader').after(note);
    }
    renderGrid();
  }
  function renderGrid() {
    const selected = filter === 'reels' ? posts.filter(p=>p.kind === 'reel') : posts;
    grid.innerHTML = selected.map(p=>{
      const s=p.slides?.[0] || {};
      const cover = s.type === 'video' ? {...s,type:'photo',image:s.poster || s.image,layout:'clean'} : s;
      return `<button class="post-tile" data-post="${escape(p.id)}" aria-label="Abrir ${p.kind==='reel' ? 'Reel: ' : ''}${escape(p.title)}">${renderSlide(cover,{eager:true})}${p.fixado ? '<span class="tile-fixo" title="Fixado no perfil" aria-label="Fixado no perfil"></span>' : ''}${p.kind==='reel' || p.slides?.length>1 ? `<span class="tile-kind">${svg(p.kind==='reel'?'reel':'carousel')}</span>` : ''}<span class="tile-hover"></span></button>`;
    }).join('');
    ajustarEscala(grid);
    status(`${selected.length} publicações`);
  }
  function show(kind, html) {
    if (!dialog.open) returnFocus = document.activeElement;
    view = kind;dialog.dataset.view=kind;content.innerHTML=html;
    document.body.classList.add('modal-open');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop=0;content.scrollTop=0;
    requestAnimationFrame(()=>{const focus=content.querySelector('[autofocus]') || dialog.querySelector('.close-button');focus?.focus({preventScroll:true});});
  }
  function close() {
    content.querySelectorAll('video').forEach(v=>v.pause());
    dialog.close();document.body.classList.remove('modal-open');view=null;
    returnFocus?.focus({preventScroll:true});
  }
  function readerUser(label) {return `<div class="reader-user">${avatar()}<div><div class="reader-handle">${escape(P.handle)}</div>${label?`<div class="reader-format">${escape(label)}</div>`:''}</div></div>`;}
  function postType(p) {return p.kind==='reel' ? 'Reel' : p.kind==='carousel' ? 'Carrossel' : p.kind==='journal' ? 'Registro' : p.kind==='opinion' ? 'Lâmina' : 'Fotografia';}
  function scriptMarkup(p) {
    if (p.kind !== 'reel' || !p.script?.length) return '';
    return `<section class="content-section" id="postScript"><h3 class="section-label">Roteiro e storyboard</h3>${p.script.map(item=>`<div class="script-line"><span class="script-time">${escape(item.time)}</span><div><div class="script-copy">${lines(item.voice)}</div>${item.visual ? `<div class="script-scene">${lines(item.visual)}</div>` : ''}</div></div>`).join('')}</section>`;
  }
  function demoMarkup(p) {return p.demoUrl ? `<a class="demo-link" href="${escape(p.demoUrl)}" target="_blank" rel="noopener">Abrir demonstração <span aria-hidden="true">↗</span></a>` : '';}
  function openPost(id) {
    currentPost=posts.find(p=>p.id===id);if(!currentPost)return;slideIndex=0;
    const p=currentPost;
    show('post',`<article class="post-reader"><div class="reader-media" id="readerMedia"><div class="media-art"><div class="reader-slide" id="readerSlide"></div></div><div class="media-controls"><button class="slide-arrow prev" data-action="previous" aria-label="Slide anterior">${svg('left')}</button><button class="slide-arrow next" data-action="next" aria-label="Próximo slide">${svg('right')}</button><span class="slide-counter" id="slideCounter"></span><div class="slide-dots" id="slideDots"></div></div></div><aside class="reader-side">${readerUser(postType(p))}<div class="reader-copy">${p.mediaNote ? `<div class="media-status">${escape(p.mediaNote)}</div>`:''}<h2 class="reader-title" id="dialogTitle">${escape(p.title)}</h2><p class="caption-text">${escape(p.caption || '')}</p>${demoMarkup(p)}${scriptMarkup(p)}</div>${p.cta==='guia' ? '<div class="reader-bottom"><button class="solid-button" data-action="guide-dm">Pedir o GUIA</button></div>' : ''}</aside></article>`);
    paintPost();
  }
  function paintPost() {
    const slides=currentPost.slides || [];const slide=slides[slideIndex];if(!slide)return;
    content.querySelector('#readerSlide').innerHTML=renderSlide(slide,{eager:true});
    ajustarEscala(content.querySelector('#readerSlide'));
    content.querySelector('[data-action="previous"]').hidden=slides.length<2;
    content.querySelector('[data-action="next"]').hidden=slides.length<2;
    content.querySelector('[data-action="previous"]').disabled=slideIndex===0;
    content.querySelector('[data-action="next"]').disabled=slideIndex===slides.length-1;
    content.querySelector('#slideCounter').hidden=slides.length<2;
    content.querySelector('#slideCounter').textContent=`${slideIndex+1} / ${slides.length}`;
    content.querySelector('#slideDots').innerHTML=slides.length>1?slides.map((_,i)=>`<button class="slide-dot ${i===slideIndex?'active':''}" data-slide-index="${i}" aria-label="Ir para slide ${i+1}" aria-current="${i===slideIndex?'true':'false'}"></button>`).join(''):'';
    status(`Slide ${slideIndex+1} de ${slides.length}`);
  }
  function openHighlight(id) {
    currentHighlight=highlights.find(h=>h.id===id);if(!currentHighlight)return;slideIndex=0;
    show('highlight',`<article class="highlight-reader" id="highlightReader"><div class="highlight-live" id="highlightSlide"></div><div class="highlight-progress" id="highlightProgress"></div><div class="highlight-profile">${avatar('highlight-avatar')}<span id="dialogTitle">${escape(currentHighlight.title)}</span></div><button class="slide-arrow prev" data-action="previous" aria-label="Slide anterior">${svg('left')}</button><button class="slide-arrow next" data-action="next" aria-label="Próximo slide">${svg('right')}</button><div class="highlight-action" id="highlightAction"></div></article>`);
    paintHighlight();
  }
  function paintHighlight() {
    const slides=currentHighlight.slides || [];const slide=slides[slideIndex];if(!slide)return;
    content.querySelector('#highlightSlide').innerHTML=renderSlide(slide,{eager:true});
    ajustarEscala(content.querySelector('#highlightSlide'));
    content.querySelector('#highlightProgress').innerHTML=slides.map((_,i)=>`<button class="${i===slideIndex?'active':i<slideIndex?'done':''}" data-slide-index="${i}" aria-label="Ir para slide ${i+1}"></button>`).join('');
    content.querySelector('[data-action="previous"]').disabled=slideIndex===0;
    content.querySelector('[data-action="next"]').disabled=slideIndex===slides.length-1;
    const last=slideIndex===slides.length-1;
    const action=currentHighlight.id==='trabalhar'?'offer':'guide-dm';
    content.querySelector('#highlightAction').innerHTML=last && currentHighlight.id!=='vida'?`<button class="solid-button" data-action="${action}">${action==='offer'?'Como trabalhar comigo':'Ver o guia'}</button>`:'';
    status(`${currentHighlight.title}, slide ${slideIndex+1} de ${slides.length}`);
  }
  function move(delta) {
    if(view==='post') {const n=currentPost.slides?.length || 0;slideIndex=Math.max(0,Math.min(n-1,slideIndex+delta));paintPost();}
    else if(view==='highlight') {const n=currentHighlight.slides?.length || 0;slideIndex=Math.max(0,Math.min(n-1,slideIndex+delta));paintHighlight();}
  }
  function openDM(started=false) {
    dmStarted=started;
    show('dm',`<section class="dm-reader"><header class="dm-top">${avatar()}<div><strong id="dialogTitle">${escape(P.name)}</strong><small>Prévia da conversa — não envia mensagens</small></div></header><div class="dm-messages" id="dmMessages"></div><div class="dm-input-area"><div class="dm-suggestions"><button class="dm-suggestion" data-action="dm-guia">GUIA</button><button class="dm-suggestion" data-action="offer">Como trabalhar comigo</button></div><form id="dmForm"><input id="dmInput" aria-label="Mensagem da simulação" placeholder="Escreva GUIA" autocomplete="off"><button type="submit" aria-label="Simular envio">${svg('send')}</button></form></div></section>`);
    paintDM();
  }
  function paintDM() {
    const dm=P.dm || {};
    content.querySelector('#dmMessages').innerHTML=dmStarted?`<div class="dm-notice">Conversa simulada nesta prévia</div><div class="dm-bubble user">${lines(dm.incoming || 'GUIA')}</div><div class="dm-bubble">${lines(dm.confirmation || dm.outgoing)}<button class="solid-button" data-action="dm-following">Quero receber</button><button class="outline-button" data-action="dm-not-following">Ainda não sigo</button></div>`:'<p class="dm-notice">Use GUIA para percorrer o caminho até o material.</p>';
  }
  function deliverDM() {
    const dm=P.dm || {};
    content.querySelector('#dmMessages').innerHTML+=`<div class="dm-bubble user">Quero receber.</div><div class="dm-bubble">${lines(dm.outgoing)}<button class="solid-button" data-action="guide">Abrir o guia completo</button></div><div class="dm-bubble">${lines(dm.invitation)}<button class="solid-button" data-action="offer">Ver a carta convite</button></div>`;
    content.querySelectorAll('[data-action="dm-following"],[data-action="dm-not-following"]').forEach(b=>b.disabled=true);
    content.querySelector('#dmMessages').lastElementChild.scrollIntoView({block:'nearest'});
  }
  function guideMarkup() {
    const g=P.guide || {};
    return `<article class="simple-reader material-reader"><span class="simple-eyebrow">Guia</span><h1 id="dialogTitle">${escape(g.title)}</h1><p>${lines(g.intro)}</p>${(g.sections || []).map((s,i)=>`<section class="material-section"><span class="simple-eyebrow">${String(i+1).padStart(2,'0')}</span><h2>${escape(s.title)}</h2><p>${lines(s.body)}</p>${s.items?.length?`<ul class="material-checks">${s.items.map(it=>`<li>${lines(it)}</li>`).join('')}</ul>`:''}</section>`).join('')}${g.example?`<section class="material-section"><h2>${escape(g.example.title)}</h2><div class="material-example">${lines(g.example.body)}</div></section>`:''}${g.closing?`<p>${lines(g.closing)}</p>`:''}<button class="solid-button" data-action="offer">Como trabalhar comigo</button></article>`;
  }
  function openOffer() {
    const o=P.offer || {};
    show('offer',`<article class="simple-reader offer-reader"><span class="simple-eyebrow">Trabalhar comigo</span><h1 id="dialogTitle">${escape(o.title)}</h1><p>${lines(o.intro)}</p>${(o.steps || []).map((s,i)=>`<section class="material-section"><span class="simple-eyebrow">${String(i+1).padStart(2,'0')}</span><h2>${escape(s.title)}</h2><p>${lines(s.body)}</p></section>`).join('')}${o.fit?.length?`<section class="material-section"><h2>Para quem faz sentido</h2><ul>${o.fit.map(x=>`<li>${lines(x)}</li>`).join('')}</ul></section>`:''}${o.ctaText?`<section class="material-section"><h2>${escape(o.ctaText)}</h2><p>${lines(o.ctaBody)}</p></section>`:''}<button class="outline-button" data-action="guide">Voltar ao guia</button></article>`);
  }
  document.addEventListener('click',event=>{
    const post=event.target.closest('[data-post]');if(post){openPost(post.dataset.post);return;}
    const highlight=event.target.closest('[data-highlight]');if(highlight){openHighlight(highlight.dataset.highlight);return;}
    const tab=event.target.closest('[data-filter]');if(tab){filter=tab.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderGrid();return;}
    const dot=event.target.closest('[data-slide-index]');if(dot){slideIndex=Number(dot.dataset.slideIndex);view==='post'?paintPost():paintHighlight();return;}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='close')close();
    if(action==='start' && firstHighlight())openHighlight(firstHighlight().id);
    if(action==='dm')openDM();
    if(action==='guide-dm')openDM(true);
    if(action==='dm-guia'){dmStarted=true;paintDM();content.querySelector('#dmInput').value='';}
    if(action==='dm-following')deliverDM();
    if(action==='dm-not-following')content.querySelector('#dmMessages').innerHTML+=`<div class="dm-bubble">${lines(P.dm.notFollowing)}<button class="solid-button" data-action="dm-following">Já sigo · continuar a simulação</button></div>`;
    if(action==='guide')show('guide',guideMarkup());
    if(action==='offer')openOffer();
    if(action==='previous')move(-1);
    if(action==='next')move(1);
  });
  content.addEventListener('submit',event=>{
    if(event.target.id!=='dmForm')return;event.preventDefault();
    const input=content.querySelector('#dmInput');
    if(input.value.trim().toUpperCase()==='GUIA'){dmStarted=true;paintDM();input.value='';}
    else {input.value='';input.placeholder='Nesta prévia, use GUIA';status('Nesta prévia, escreva GUIA para abrir o material.');}
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  document.addEventListener('keydown',event=>{if(!dialog.open || /INPUT|TEXTAREA/.test(event.target.tagName))return;if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}if(event.key==='ArrowRight'){event.preventDefault();move(1);}});
  content.addEventListener('touchstart',event=>{if(!event.target.closest('.reader-media,.highlight-reader'))return;touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
  content.addEventListener('touchend',event=>{if(!touchStart)return;const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
  init();
  window.profileUI={openPost,openHighlight,openDM,openGuide:()=>show('guide',guideMarkup()),openOffer,close,renderSlide};
  document.body.dataset.ready=P.handle ? 'true' : 'pending-content';
  if (P.handle && new URLSearchParams(location.search).get('ver') === 'trabalhar') openOffer();
})();
