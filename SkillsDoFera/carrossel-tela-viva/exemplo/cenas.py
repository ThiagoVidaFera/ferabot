# -*- coding: utf-8 -*-
"""4 telas de exemplo para um perfil de nutrição. Dados fictícios. Cada tela conta uma cena e tem visual próprio.

Cores da marca: var(--p) é a cor_primaria e var(--s) a cor_secundaria do perfil.json.
A estrutura existe desde o começo (rótulos, linhas, rodapé). Só valores e estados animam.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "motor"))
from timeline import BASE  # noqa: E402

TRIAGEM = BASE + """<style>
.tg{background:#F4F6FB;padding:26px}
.tg .top{display:flex;justify-content:space-between;font-size:25px;font-weight:700;color:var(--p);margin-bottom:10px}
.tg .q{background:#fff;border-radius:14px;height:76px;margin-bottom:8px;padding:6px 20px;position:relative;border:2px solid #E1E6F0}
.tg .q small{display:block;font-size:21px;color:#5B6478}
.tg .q b{font-size:28px;display:block;min-height:34px}
.tg .q i{position:absolute;right:18px;top:18px;width:38px;height:38px;border-radius:50%;background:#16A34A;color:#fff;font:800 22px/38px Inter;text-align:center;font-style:normal}
.tg .fim{position:absolute;left:26px;right:26px;bottom:22px;background:var(--p);color:#fff;border-radius:14px;padding:16px;font-size:30px;font-weight:800;text-align:center}
</style>
<div class="c tg"><div class="top"><span>TRIAGEM DE NOVA PACIENTE</span><span>5 perguntas</span></div>
 <div class="q"><small>Objetivo</small><b data-type="0.3,1">Reduzir a fome à noite</b><i data-in="1.4">✓</i></div>
 <div class="q"><small>Rotina de trabalho</small><b data-type="1.5,1">Escritório, sem horário fixo</b><i data-in="2.6">✓</i></div>
 <div class="q"><small>Refeições por dia</small><b data-type="2.7,.6">3</b><i data-in="3.4">✓</i></div>
 <div class="q"><small>Restrição alimentar</small><b data-type="3.5,.8">Sem lactose</b><i data-in="4.4">✓</i></div>
 <div class="q"><small>Já fez acompanhamento</small><b data-type="4.5,.6">Não</b><i data-in="5.2">✓</i></div>
 <div class="fim" data-in="7">Ficha pronta para a consulta</div></div>"""

CARDAPIO = BASE + """<style>
.k{background:linear-gradient(135deg,#FFF1E0,#FFF9F1);color:#4A2B0B;padding:24px;display:grid;grid-template-columns:300px 1fr;gap:24px}
.k .tag{font-size:23px;font-weight:700;color:#B45309;margin-bottom:10px}
.k .ch{background:#fff;border:3px solid #B45309;border-radius:14px;padding:12px 15px;font-size:26px;font-weight:700;margin-bottom:12px}
.k .seta{font-size:25px;font-weight:700;color:#B45309;margin-top:12px;line-height:1.25}
.k .tel{height:552px;background:#fff;border:9px solid #1B1B1B;border-radius:38px;padding:22px;position:relative}
.k .tel h3{font-size:30px;font-weight:800;margin:0 0 4px}
.k .tel small{font-size:21px;color:#7A5A3A}
.k .rf{background:#FFF4E6;border-radius:13px;padding:11px 15px;margin-top:12px}
.k .rf b{display:block;font-size:24px}
.k .rf span{font-size:23px;color:#5C3D1E}
.k .stamp{color:#B45309;font-size:34px;left:30px;bottom:40px;background:#fff}
</style>
<div class="c k"><div><div class="tag">O que a ficha trouxe</div>
 <div class="ch">Sem lactose</div><div class="ch">3 refeições</div><div class="ch">Fome à noite</div>
 <div class="seta" data-in="0.6">O agente monta cada refeição do&nbsp;dia&nbsp;→</div>
 <div class="stamp" data-stamp="9.4">REVISAR</div></div>
 <div class="tel"><h3>Cardápio de exemplo</h3><small>Rascunho para você revisar</small>
  <div class="rf" data-in="1.6"><b>Café da manhã</b><span>Ovos mexidos e fruta</span></div>
  <div class="rf" data-in="3.4"><b>Almoço</b><span>Prato com proteína e legumes</span></div>
  <div class="rf" data-in="5.2"><b>Jantar</b><span>Sopa com proteína, para segurar a fome</span></div>
  <div class="rf" data-in="7"><b>Lanche da noite</b><span>Iogurte sem lactose</span></div></div></div>"""

WHATS = BASE + """<style>
.w{background:#075E54;padding:22px;display:grid;grid-template-columns:1.4fr 1fr;gap:20px}
.w .tl{background:#EFE7DD;border-radius:20px;overflow:hidden;height:556px}
.w .h2{background:#128C7E;color:#fff;font-size:26px;font-weight:700;padding:13px 18px}
.w .ms{padding:14px;display:flex;flex-direction:column;gap:11px}
.w .b{max-width:92%;font-size:24px;line-height:1.24;padding:10px 14px;border-radius:13px;color:#10201C}
.w .e{background:#fff;align-self:flex-start}
.w .a{background:#D3F8C4;align-self:flex-end}
.w .av{background:#0F1419;color:#fff;border-radius:18px;padding:20px;align-self:center}
.w .av small{display:block;font-size:21px;color:#25D366;font-weight:700;margin-bottom:8px}
.w .av .ti{font-size:30px;font-weight:800;line-height:1.1;margin-bottom:12px}
.w .av .rs{font-size:23px;line-height:1.28;color:#C9D3CF;margin-bottom:9px}
.w .av .bd{background:#25D366;color:#06270F;font-size:24px;font-weight:800;text-align:center;border-radius:11px;padding:12px}
</style>
<div class="c w"><div class="tl"><div class="h2">Paciente de exemplo</div><div class="ms">
 <div class="b e" data-in="0.6">Posso trocar o jantar por uma salada?</div>
 <div class="b a" data-in="2.2">Pode. Pelo seu plano, a salada precisa de uma proteína para você não acordar com fome.</div>
 <div class="b e" data-in="4.4">Entendi. E se eu jantar mais tarde?</div>
 <div class="b a" data-in="6">Essa é uma decisão da sua nutricionista. Vou passar para ela te responder aqui.</div></div></div>
 <div class="av" data-in="7.4"><small>AVISO PARA VOCÊ</small><div class="ti">Essa pergunta é sua</div>
  <div class="rs">Dúvida sobre horário do jantar.</div><div class="rs">Troca da salada já respondida.</div><div class="bd">Abrir conversa</div></div></div>"""

FOLHA = BASE + """<style>
.f{background:repeating-linear-gradient(-45deg,var(--s) 0 26px,#111 26px 52px);padding:22px}
.f .pp{background:#fff;height:100%;border-radius:10px;padding:20px 26px;position:relative;color:#111}
.f .tt{display:flex;justify-content:space-between;align-items:baseline;border-bottom:4px solid #111;padding-bottom:9px;margin-bottom:6px}
.f .tt b{font-size:33px;font-weight:800}
.f .tt span{font-size:24px;font-weight:600;color:#555}
.f .ln{display:grid;grid-template-columns:260px 1fr;gap:12px;padding:21px 0;border-bottom:2px solid #E3E3E3;align-items:baseline}
.f .k2{font-size:24px;font-weight:700;color:#555}
.f .v{font-size:29px;font-weight:700;min-height:36px;line-height:1.2}
.f .stamp{color:#C81E1E;font-size:56px;right:24px;bottom:18px;background:#ffffffdd}
</style>
<div class="c f"><div class="pp"><div class="tt"><b>Folha da consulta</b><span>Paciente de exemplo</span></div>
 <div class="ln"><div class="k2">Respondeu na triagem</div><div class="v" data-type="0.6,1.4">Fome à noite, sem lactose</div></div>
 <div class="ln"><div class="k2">Rascunho revisado</div><div class="v" data-type="2.4,1.4">Jantar com proteína</div></div>
 <div class="ln"><div class="k2">Já combinado</div><div class="v" data-type="4.2,1.6">Três refeições por dia</div></div>
 <div class="ln"><div class="k2">Para decidir ao vivo</div><div class="v" data-type="6.2,1.4">Horário do jantar</div></div>
 <div class="stamp" data-stamp="9">PRONTA</div></div></div>"""

CENAS = {"triagem": TRIAGEM, "cardapio": CARDAPIO, "whats": WHATS, "folha": FOLHA}
