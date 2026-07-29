
## Rodada 2 — briefing assistido (2026-07-29, após feedback de campo)

Bug de campo: cliente instalou via /instale e o briefing (perfil + metas) não rodou —
`input()` recebia EOF no shell do Claude; no Windows, NUL se apresenta como tty
(`isatty()` mente), então a detecção simples não bastava.

| # | Teste | Resultado |
|---|---|---|
| 17 | instalar.py com CLAUDECODE=1 → modo assistido, pula perfil/metas, instala 15 skills, termina com [BRIEFING PENDENTE] | ok |
| 18 | instalar.py com stdin NUL (isatty mentiroso) → EOF no 1º input vira modo assistido no ato, sem traceback | ok |
| 19 | setup_metas.py / setup_perfil.py com EOF → mensagem apontando briefing via /fera (exit 2), sem morrer em silêncio | ok |
| 20 | setup_base/setup_skills sem perfil.json → instalam sem ruído de [ERRO] | ok |
| 21 | Briefing conversacional simulado: perfil.json + metas.json gravados no schema, entrega registrada, painel gerado, status correto | ok |
