"""Ensaio por IA para cliente MULHER: reusa o motor de gerar_fotos.py trocando identidade e cenas. Uso: python -I gerar_fotos_mulher.py <saida> <ref_rosto.jpg> <ref_corpo.jpg> (ajustar CENAS ao nicho). Chave: GEMINI_API_KEY, igual ao gerar_fotos.py."""
import importlib.util, pathlib, sys
T = pathlib.Path(__file__).resolve().with_name("gerar_fotos.py")
spec = importlib.util.spec_from_file_location("gf", T); gf = importlib.util.module_from_spec(spec); spec.loader.exec_module(gf)

gf.IDENTIDADE = """Using BOTH reference images I attached, generate a new photograph of the SAME woman.

Image 1 = close-up portrait of the woman's face. This is the identity anchor.
Image 2 = photograph showing her build, posture, hair and skin tone.

WHAT MUST STAY THE SAME as the references:
- same face shape and same facial features as Image 1: same nose, same mouth, same jawline,
  same eyebrows, same eye colour
- same hair as in the references: same colour, same length, same cut
- same skin tone and same build as Image 2
- she must remain unmistakably the same person, recognisable at a glance by someone who knows her

HOW SHE LOOKS IN THIS PHOTOGRAPH:
- the same age as in the references, rested and radiant, warm genuine smile that reaches the eyes
- natural skin texture with visible pores and slight asymmetry; never plastic or airbrushed
- the same accessories as in the references, if any; never add new jewellery

GAZE — hard requirement:
- she is NOT looking at the camera and NOT looking at the lens
- her eyes are directed off-frame, at something or someone in her own world
- the photograph reads as a candid moment caught by an observer, never as a posed headshot

FRAMING: tight portrait. Head and shoulders fill the frame and the face is large in frame.
Hands out of frame. 85mm lens look, shallow depth of field, background softly out of focus.

NEVER SHOW: no text, no captions, no titles, no watermark, no logos, no readable signage,
no readable screens, no readable book spines, no glowing edges, no flashes, no sparkles,
no magic particles, no morphing, no CGI look, no over-saturated grade."""

gf.CENAS = {
    "escritorio": "WHAT CHANGES: a bright modern office with a large window on the left. She wears a "
                  "well-fitted navy blazer over a white top. She is smiling at someone standing "
                  "off-frame to her right, mid-conversation, relaxed.",
    "reuniao": "WHAT CHANGES: seated at a meeting table in a bright small-company office, an "
               "out-of-focus laptop edge in the near foreground. She wears a light blue shirt. She "
               "is smiling and listening to a colleague off-frame to her left.",
    "operacao": "WHAT CHANGES: standing in a tidy modern operations floor of a small company, "
                "shelves and workstations softly out of focus behind her, warm daylight. She wears "
                "a charcoal blazer over a white top. She smiles at a team member off-frame.",
    "lounge": "WHAT CHANGES: the lounge of a high-end business hotel in the late afternoon — warm "
              "lamps, dark polished wood, deep armchairs, soft golden light. She wears a cream "
              "blazer over a black top. She smiles at something off-frame, at ease, like a woman "
              "between two good meetings.",
}
gf.CENA_AVATAR = ("WHAT CHANGES: a bright modern office, softly out of focus behind her, with a window "
                  "behind her shoulder making the background LIGHTER than she is. She wears a navy "
                  "blazer over a white top. Warm open smile.\n\n"
                  "GAZE — this photograph OVERRIDES the gaze rule above: here she looks straight "
                  "into the lens, making direct eye contact with the viewer. This one is a portrait, "
                  "read at 32 pixels wide, where an averted gaze becomes an unreadable silhouette.")
gf.main()
