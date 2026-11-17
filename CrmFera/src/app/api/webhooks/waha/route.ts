// Alias do webhook de entrada. O caminho canonico e /api/webhooks/evolution
// (nome do megaprompt); este existe pra quem prefere o nome do provider real.
// `dynamic` NAO pode ser reexportado — o Next recusa o build.
export const dynamic = "force-dynamic";
export { POST, GET } from "../evolution/route";
