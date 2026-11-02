/* proposta-pagina: comportamento da página. A configuração vem de window.PROPOSTA (escrita pelo gerar_proposta.py). */
(function () {
  var P = window.PROPOSTA || {};
  var R = function (n) { return 'R$ ' + Math.round(n).toLocaleString('pt-BR'); };
  var $ = function (id) { return document.getElementById(id); };
  var reduz = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- validade de 3 dias ---- */
  var fim = new Date(P.valida_ate).getTime();
  function restam() {
    var ms = fim - Date.now();
    if (ms <= 0) return null;
    var min = Math.floor(ms / 60000), d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
    if (d > 0) return 'faltam ' + d + (d > 1 ? ' dias' : ' dia') + ' e ' + h + ' h';
    if (h > 0) return 'faltam ' + h + ' h e ' + m + ' min';
    return 'faltam ' + m + ' min';
  }
  var vencida = false;
  function atualizaValidade() {
    var r = restam();
    document.querySelectorAll('[data-restam]').forEach(function (e) { e.textContent = r || 'proposta vencida'; });
    if (!r && !vencida) {
      vencida = true;
      document.body.classList.add('vencida');
      document.querySelectorAll('.js-comecar').forEach(function (b) {
        if (P.wa) {
          b.textContent = 'Pedir uma nova proposta';
          b.setAttribute('href', 'https://wa.me/' + P.wa + '?text=' + encodeURIComponent('Olá, a proposta venceu e quero reabrir.'));
        } else {
          b.textContent = 'Proposta vencida';
          b.removeAttribute('href');
        }
      });
    }
  }
  atualizaValidade(); setInterval(atualizaValidade, 60000);

  /* ---- barra fixa e progresso ---- */
  var barra = $('barra'), prog = $('prog');
  function onScroll() {
    barra.classList.toggle('on', window.scrollY > window.innerHeight * 0.7);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- revelar ao rolar e contador do preço ---- */
  var alvos = document.querySelectorAll('.q,.passo,.quem .col,.sobre .item,.fase,.gar');
  alvos.forEach(function (el, i) { el.classList.add('rv'); el.style.setProperty('--rd', ((i % 4) * 0.08) + 's'); });
  function contar(el) {
    var alvo = +el.dataset.count, t0 = null;
    function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1300), e = 1 - Math.pow(1 - k, 3); el.textContent = R(alvo * e); if (k < 1) requestAnimationFrame(f); else el.textContent = R(alvo); }
    requestAnimationFrame(f);
  }
  var todos = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          var c = e.target.querySelector && e.target.querySelector('[data-count]');
          if (c && !reduz) contar(c);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    todos.forEach(function (el) { io.observe(el); });
  } else { todos.forEach(function (el) { el.classList.add('in'); }); }

  /* ---- menu lateral e barra superior ---- */
  var secs = [].slice.call(document.querySelectorAll('[data-sec]'));
  var links = [].slice.call(document.querySelectorAll('.rail nav a'));
  var tb = $('topbar'), tbn = $('tbn'), tbl = $('tbl');
  var capa = document.querySelector('.capa');
  function atualiza() {
    var y = window.innerHeight * 0.35, atual = null;
    secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) atual = s; });
    links.forEach(function (a) {
      var on = !!atual && a.getAttribute('href') === '#' + atual.id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (tb && capa) {
      tb.classList.toggle('on', capa.getBoundingClientRect().bottom < 60);
      if (atual) { tbn.textContent = atual.dataset.n; tbl.textContent = atual.dataset.l; }
    }
  }
  window.addEventListener('scroll', atualiza, { passive: true }); atualiza();
})();
