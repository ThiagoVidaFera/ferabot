import { test } from "node:test";
import assert from "node:assert/strict";
import { classificarReunioes, type ContatoReuniao } from "../../src/lib/reunioes";

const agora = new Date("2026-11-04T15:00:00Z");

function contato(id: string, evento_data: unknown, eventos: ContatoReuniao["eventos"] = [], tags: string[] = []): ContatoReuniao {
  return {
    id,
    name: id,
    phone: null,
    origem: "funil:agendar",
    customFields: evento_data === undefined ? {} : { evento_data },
    eventos,
    tags,
  };
}

test("futura vai pra 'a realizar'; sem evento_data ou lixo fica de fora", () => {
  const r = classificarReunioes(
    [contato("a", "2026-11-05T12:00:00-03:00"), contato("b", undefined), contato("c", "amanha")],
    agora,
  );
  assert.deepEqual(r.aRealizar.map((x) => x.id), ["a"]);
  assert.equal(r.realizadas.length + r.noShow.length, 0);
});

test("passada com resultado vai pra realizadas ou no show", () => {
  const r = classificarReunioes(
    [
      contato("ok", "2026-11-03T12:00:00-03:00", [{ resultado: "compareceu", timestamp: new Date("2026-11-03T16:00:00Z") }]),
      contato("faltou", "2026-11-03T12:00:00-03:00", [{ resultado: "no_show", timestamp: new Date("2026-11-03T16:00:00Z") }]),
    ],
    agora,
  );
  assert.deepEqual(r.realizadas.map((x) => x.id), ["ok"]);
  assert.deepEqual(r.noShow.map((x) => x.id), ["faltou"]);
});

test("passada sem resultado fica em 'a realizar' marcada como pendente de resultado", () => {
  const r = classificarReunioes([contato("p", "2026-11-04T09:00:00-03:00")], agora);
  assert.equal(r.aRealizar[0].semResultado, true);
});

test("no show antigo não vale depois de remarcar pra data nova", () => {
  const r = classificarReunioes(
    [contato("re", "2026-11-06T12:00:00-03:00", [{ resultado: "no_show", timestamp: new Date("2026-11-01T16:00:00Z") }])],
    agora,
  );
  assert.deepEqual(r.aRealizar.map((x) => x.id), ["re"]);
  assert.equal(r.noShow.length, 0);
});

test("a realizar ordena da mais próxima; realizadas da mais recente", () => {
  const r = classificarReunioes(
    [contato("longe", "2026-11-10T12:00:00-03:00"), contato("perto", "2026-11-05T12:00:00-03:00")],
    agora,
  );
  assert.deepEqual(r.aRealizar.map((x) => x.id), ["perto", "longe"]);
});

test("tags viram temperatura e proposta recebida no cartão", () => {
  const r = classificarReunioes(
    [
      contato("q", "2026-11-05T12:00:00-03:00", [], ["reuniao-quente", "proposta-recebida"]),
      contato("f", "2026-11-06T12:00:00-03:00", [], ["reuniao-fria"]),
      contato("n", "2026-11-07T12:00:00-03:00"),
    ],
    agora,
  );
  const [q, f, n] = r.aRealizar;
  assert.equal(q.temperatura, "quente");
  assert.equal(q.propostaRecebida, true);
  assert.equal(f.temperatura, "frio");
  assert.equal(f.propostaRecebida, false);
  assert.equal(n.temperatura, null);
});
