# Art hook

The Moon base in `src/scene/MoonScene.js` is drawn from simple shapes as a placeholder. Real art replaces it without code changes:

1. Put the image files in this folder (PNG or WebP, transparent background for rooms).
2. List them in `manifest.json`, with paths relative to this folder:

```json
{
  "background": "moon-and-earth.webp",
  "rooms": { "hab": "rooms/hab.png", "lab": "rooms/lab.png" }
}
```

3. Reload. Any room left as `null` keeps its placeholder drawing.

## How images are placed
- **Background** is scaled to cover the whole screen (like CSS `background-size: cover`), centred. Keep the important parts in the middle, because phones in portrait crop the sides. Earth and the Sun are still drawn on top by the scene. If the background already shows Earth, tell the code owner so the drawn one can be switched off.
- **Rooms** are scaled to fit their box and stand on the ground line (bottom centre anchor). The boxes have these aspect ratios (width : height):

| Room id | Name | Wide screens | Phones (portrait) |
|---------|------|--------------|-------------------|
| `solar` | Solar panels | 18 : 12 | 20 : 13 |
| `greenhouse` | Greenhouse | 17 : 11 | 18 : 12 |
| `hab` | Living quarters | 24 : 14 | 28 : 16 |
| `lab` | Science lab | 19 : 12 | 20 : 13 |
| `shelter` | Storm shelter | 19 : 10 | 24 : 12 |

- Draw at about 600 px wide per room so it stays sharp on phones (the canvas renders at up to 2× pixel density).
- A sealed (lost) room is shown darkened with a grey tint, so no extra image is needed.
- Keep the total size of all art small (a few hundred KB). The whole game should load fast on venue Wi-Fi.

## Rules (from AGENTS.md)
- No SI-generated images (Space Apps term for AI), no NASA logos or insignia.
- Record every file and its license in `CREDITS.md`.
