/* Funil Reunião Fantasma. Sem backend: o submit abre o WhatsApp do dono com a mensagem pronta.
   A linha [AGENDAMENTO] é o contrato lido pelo agente de leads. Não mude o formato sem mudar o parser
   (SkillsDoFera/funil-reuniao-fantasma/parse_marcador.py). */
(function () {
  "use strict";
  var C = window.FUNIL;
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var $ = function (id) { return document.getElementById(id); };
  var escolhido = { dia: null, hora: null };

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* "agora" no fuso do negócio, como pseudo-UTC pra comparar sem depender do fuso do visitante */
  function agoraNoFuso() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-CA", {
        timeZone: C.fuso, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    } catch (e) {
      var d = new Date();
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
    }
  }

  function isoDe(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }

  function bloqueado(iso, hora) {
    return C.bloqueios.indexOf(iso) !== -1 || C.bloqueios.indexOf(iso + " " + hora) !== -1;
  }

  /* lista [{iso, ms, horas:[...]}] com os próximos dias que têm horário livre */
  function gerarSlots() {
    var agora = agoraNoFuso();
    var limite = agora + C.antecedencia_horas * 3600000;
    var dia0 = Date.UTC(new Date(agora).getUTCFullYear(), new Date(agora).getUTCMonth(), new Date(agora).getUTCDate());
    var saida = [];
    for (var i = 0; i <= C.janela_dias; i++) {
      var ms = dia0 + i * 86400000;
      var dow = new Date(ms).getUTCDay();
      if (C.dias_semana.indexOf(dow) === -1) continue;
      var iso = isoDe(ms);
      var horas = C.horarios.filter(function (h) {
        var hh = h.split(":");
        var inst = ms + (+hh[0]) * 3600000 + (+hh[1]) * 60000;
        return inst >= limite && !bloqueado(iso, h);
      });
      if (horas.length) saida.push({ iso: iso, ms: ms, horas: horas });
    }
    return saida;
  }

  function rotuloDia(ms) {
    var d = new Date(ms);
    return DIAS[d.getUTCDay()] + ", " + d.getUTCDate() + " de " + MESES[d.getUTCMonth()];
  }

  function normalizarZap(bruto) {
    var d = String(bruto).replace(/\D/g, "");
    if (d.indexOf("55") === 0 && d.length > 11) d = d.slice(2);
    return d.length === 10 || d.length === 11 ? "55" + d : "";
  }

  function normalizarInsta(bruto) {
    var s = String(bruto).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@+/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(s) ? "@" + s.toLowerCase() : "";
  }

  /* o separador do marcador é " | ": tira barras verticais e quebras de linha de qualquer campo */
  function limpar(t) { return String(t).replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim(); }

  function montarMensagem(dados) {
    var linhas = [
      "Oi, " + C.dono + "! Reservei a reunião de " + C.duracao + " minutos: " + dados.rotulo + ", às " + dados.hora + ".",
      "",
      "[AGENDAMENTO] " + dados.dia + " " + dados.hora + " | " + limpar(dados.nome) + " | " + dados.insta + " | " + dados.zap
    ];
    dados.respostas.forEach(function (r) { linhas.push("[CONTEXTO] " + limpar(r.rotulo) + " | " + limpar(r.valor)); });
    return linhas.join("\n");
  }

  function linkZap(texto) {
    return "https://wa.me/" + C.whatsapp_dono + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  /* ---------- UI de dias e horas ---------- */
  var slots = gerarSlots();
  var elDias = $("dias"), elHoras = $("horas");

  function marcar(container, sel, alvo) {
    Array.prototype.forEach.call(container.querySelectorAll(sel), function (b) {
      b.setAttribute("aria-pressed", b === alvo ? "true" : "false");
    });
  }

  function mostrarHoras(s) {
    elHoras.innerHTML = "";
    s.horas.forEach(function (h) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "hora"; b.textContent = h; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        marcar(elHoras, ".hora", b);
        escolhido = { dia: s.iso, hora: h, rotulo: rotuloDia(s.ms) };
        var rot = rotuloDia(s.ms) + ", às " + h; $("escolhido").textContent = rot.charAt(0).toUpperCase() + rot.slice(1);
        $("form").hidden = false;
        $("form").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      elHoras.appendChild(b);
    });
  }

  if (!slots.length) {
    $("sem-horario").hidden = false;
    $("link-zap-vazio").href = linkZap("Oi, " + C.dono + "! Não achei horário na página. Podemos combinar um?");
  }
  slots.forEach(function (s) {
    var d = new Date(s.ms);
    var b = document.createElement("button");
    b.type = "button"; b.className = "dia"; b.setAttribute("aria-pressed", "false");
    b.innerHTML = "<small>" + DIAS[d.getUTCDay()].slice(0, 3) + "</small><b>" + d.getUTCDate() + "</b><small>" + MESES[d.getUTCMonth()].slice(0, 3) + "</small>";
    b.addEventListener("click", function () {
      marcar(elDias, ".dia", b);
      escolhido = { dia: null, hora: null };
      $("form").hidden = true;
      mostrarHoras(s);
    });
    elDias.appendChild(b);
  });

  /* ---------- máscara do WhatsApp ---------- */
  var tel = document.querySelector("[name=whatsapp]");
  tel.addEventListener("input", function () {
    var d = tel.value.replace(/\D/g, "");
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length > 6) tel.value = "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    else if (d.length > 2) tel.value = "(" + d.slice(0, 2) + ") " + d.slice(2);
    else tel.value = d;
  });

  /* ---------- envio ---------- */
  function avisar(msg, campo) {
    var a = $("aviso");
    a.textContent = msg; a.hidden = false;
    if (campo) campo.focus();
  }

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    $("aviso").hidden = true;
    if (!escolhido.dia) return avisar("Escolha um horário primeiro.");
    var nome = limpar(f.nome.value);
    if (nome.length < 2) return avisar("Coloque seu nome.", f.nome);
    var zap = normalizarZap(f.whatsapp.value);
    if (!zap) return avisar("Confira o WhatsApp. Faltou DDD ou um dígito.", f.whatsapp);
    var insta = normalizarInsta(f.instagram.value);
    if (!insta) return avisar("Confira o Instagram. Use só o @ do perfil.", f.instagram);
    var respostas = [];
    for (var i = 0; i < C.perguntas.length; i++) {
      var q = C.perguntas[i], campo = f["pergunta" + i], v = limpar(campo.value);
      if (v.length < q.minimo) return avisar("Responda: " + q.rotulo, campo);
      respostas.push({ rotulo: q.rotulo, valor: v });
    }
    if (!f.ciente.checked) return avisar("Marque a confirmação para continuar.", f.ciente);

    var url = linkZap(montarMensagem({
      dia: escolhido.dia, hora: escolhido.hora, rotulo: escolhido.rotulo,
      nome: nome, insta: insta, zap: zap, respostas: respostas
    }));

    try { if (window.fbq) window.fbq("track", "Lead"); } catch (err) { /* pixel nunca trava o lead */ }

    $("form").hidden = true;
    $("passo2").hidden = false;
    $("abrir-zap").href = url;
    $("passo2").scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(function () { window.location.href = url; }, 350);
  });

  /* ---------- barra fixa: some quando a agenda está na tela ---------- */
  var barra = $("barra"), hero = document.querySelector(".hero-bg"), agenda = $("agenda");
  if ("IntersectionObserver" in window) {
    var visivel = { hero: true, agenda: false };
    var atualiza = function () { barra.hidden = visivel.hero || visivel.agenda; };
    new IntersectionObserver(function (es) { visivel.hero = es[0].isIntersecting; atualiza(); }).observe(hero);
    new IntersectionObserver(function (es) { visivel.agenda = es[0].isIntersecting; atualiza(); }).observe(agenda);
  }
})();
