# -*- coding: utf-8 -*-
"""Timeline determinística das telas animadas. Caixa 930x600, sempre via window.seek(t).

Atributos: data-in=t (entra) · data-type="t,dur" (digita) · data-bar="t,dur,pct" (barra)
data-count="t,dur,fim" (conta; com data-fmt="br" sai 3.600) · data-hl=t (marca-texto) · data-stamp=t (carimbo) · data-scan="t,dur" (varredura)
Classes prontas em BASE: .c (a tela) · .mk (trecho do marca-texto) · .stamp (carimbo).
"""

JS_TIMELINE = """<script>
window.DUR=12;
const cl=x=>Math.max(0,Math.min(1,x)), ease=x=>1-Math.pow(1-x,3);
const q=s=>document.querySelectorAll(s);
q('[data-type]').forEach(e=>e.dataset.full=e.textContent);
window.seek=t=>{
 q('[data-in]').forEach(e=>{const p=ease(cl((t-+e.dataset.in)/.45));e.style.opacity=p;e.style.transform=`translateY(${(1-p)*16}px)`});
 q('[data-type]').forEach(e=>{const [a,d]=e.dataset.type.split(',').map(Number);const n=Math.round(cl((t-a)/d)*e.dataset.full.length);e.textContent=e.dataset.full.slice(0,n)});
 q('[data-bar]').forEach(e=>{const [a,d,w]=e.dataset.bar.split(',').map(Number);e.style.width=(ease(cl((t-a)/d))*w)+'%'});
 q('[data-count]').forEach(e=>{const [a,d,f]=e.dataset.count.split(',').map(Number);const v=Math.round(ease(cl((t-a)/d))*f);e.textContent=e.dataset.fmt==='br'?v.toLocaleString('pt-BR'):v});
 q('[data-hl]').forEach(e=>{const p=cl((t-+e.dataset.hl)/.35);e.style.backgroundSize=(p*100)+'% 100%'});
 q('[data-stamp]').forEach(e=>{const p=ease(cl((t-+e.dataset.stamp)/.25));e.style.opacity=p;e.style.transform=`rotate(-8deg) scale(${2.2-1.2*p})`});
 q('[data-scan]').forEach(e=>{const [a,d]=e.dataset.scan.split(',').map(Number);const p=cl((t-a)/d);e.style.top=(p*100)+'%';e.style.opacity=(p>0&&p<1)?1:0});
};
window.seek(0);
</script>"""

BASE = """<style>
.c{position:absolute;inset:0;font-family:Inter,sans-serif;overflow:hidden}
.c *{box-sizing:border-box}
.mk{background-image:linear-gradient(var(--s,#FFE14D),var(--s,#FFE14D));background-repeat:no-repeat;background-size:0 100%;color:inherit;padding:0 4px;border-radius:4px}
.stamp{position:absolute;opacity:0;border:6px solid currentColor;border-radius:12px;padding:6px 20px;font-weight:800;letter-spacing:2px;white-space:nowrap}
</style>"""
