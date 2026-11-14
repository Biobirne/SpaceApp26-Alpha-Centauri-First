---
name: kids-ux
description: Design and review rules for players aged 7–12. Covers reading level, touch targets, making every choice's cost visible, safe failure, no dark patterns, and calm framing of real space-weather data. Use whenever writing game text, designing a screen or choice, adding feedback or failure states, or reviewing the game before a merge.
---

# Kids UX (ages 7–12)

Our players are children on a phone, often a parent's or teacher's, in a noisy room. Many of them are still learning to read. Every screen must be usable by a 7-year-old who skips the instructions, and still be interesting for a 12-year-old.

## Words
- Keep sentences short, about 12 words at most, with one idea each. Use everyday words and the present tense, and address the player as "you".
- **Explain each science term once, in place**, in under 15 words. Example: "A solar flare is a sudden flash of energy from the Sun." Then use the term the same way everywhere.
- Pair every number with a picture (bar, icon or meter). Keep values small and round: "3 days of food" instead of "72.4 kg".
- Don't write in all caps or italics, and don't justify text. Use sentence case. Body text is 18px or more on a phone.
- Buttons name the action: "Build shield", not "OK" or "Submit".
- Read it aloud. If you stumble, cut it.

## Choices and trade-offs (the core of this game)
- **Show the cost before the tap.** Every option shows what it gives and what it takes, using the same icons as the resource HUD. For example: "+2 shield, −1 power".
- **Show the cause after the tap.** Animate the bars that changed and say why in one sentence. For example: "Your shield blocked the radiation, but the lights are dim now."
- Show 2–3 options per decision. Never present an option that is clearly best. If testing shows one choice always wins, rebalance it.
- Don't use real-time pressure for decisions. The player decides when to end a turn. A countdown, if any, is decoration only.

## Failure is safe
- Warn before things go wrong. A resource gets a warning state at about 25 % (colour plus icon plus text), well before it hits zero.
- Hitting zero causes a setback, not a cruel game over. Example: "The crew moved to the shelter. You lost a day." A full restart is only offered at the end and is one tap away.
- No death, injury or scary imagery. Astronauts are always okay, and the outpost is what struggles.
- The end screen explains what happened and one thing to try next time. It celebrates any outcome.

## Touch and layout
- Tap targets are at least 44×44 CSS px, with at least 8px between them.
- Taps only. Avoid long-press, double-tap, drag-only and hover-only actions. Swipe can be a shortcut, never the only way to do something.
- Keep important UI inside `env(safe-area-inset-*)`. Portrait comes first, landscape must not break.
- Colour is never the only signal. Red means danger only when an icon or word says so too.

## Motion, sound and comfort
- Respect `prefers-reduced-motion`: swap shakes and slides for fades or instant changes.
- No flashing more than 3 times per second (WCAG 2.3.1). A solar flare effect is a glow, not a strobe.
- Sound starts muted or only after the first tap. Keep a mute button visible on every screen.

## Ethics (non-negotiable)
- No dark patterns: no streaks, no guilt messages, no fake urgency, no loot boxes, no "watch an ad", and no score comparison with other people.
- No personal data: no name entry, no accounts, no analytics, no tracking. Storing progress in `localStorage` is fine. The name "Commander" is fine; asking for the child's real name is not.
- No external links inside gameplay. The credits or about screen may link to NASA sources.

## Real data, calm framing
- Space weather is real and the data is from NASA DONKI. Say so plainly and label archived data as archived: "Real solar flares from May 2024 (archived NASA data)". Wording rules: `data/README.md`.
- Frame events as challenges the crew can handle, not disasters. Example: "A big flare is coming! Time to check your shields." Don't write "DANGER: lethal radiation".

## Review checklist (run before merge, together with `playtest`)
1. At 390×844: every tap target is at least 44px, nothing is clipped, and there is no horizontal scroll.
2. A first-time player can make the first choice within 30 seconds without reading a tutorial.
3. Every option shows its cost before the tap and its cause after.
4. Emulate `prefers-reduced-motion: reduce` with the Playwright `browser_emulate_media` tool. Motion is calm.
5. Read all new text aloud. Sentences are short, terms are explained, and there are no all caps.
6. There is no path that ends in a hard game over without a warning first.
