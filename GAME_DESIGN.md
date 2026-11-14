# Game design

Status: agreed direction, Saturday 14 Nov 2026. Details marked **(open)** are decided during the build, depending on time.

## One sentence
**You run a Moon base for one month during a real solar storm, and you split your power between keeping the crew safe and doing science.**

## Who and how long
- Players are kids aged 7–12 on a phone. See the `kids-ux` skill for the rules.
- **One mission takes 5–10 minutes.** In that time a child must have felt the main lesson. Longer play is a bonus that comes from unlocks, never a requirement.
- It must be intuitive and never boring. If a calm stretch feels slow, speed it up. If a moment matters, slow it down.

## Setting: the Moon (decided)
Why the Moon:
- The radiation trade-off is strongest there. Our real data shows the Moon getting up to about 1800× its normal radiation during storms, because it has no air and no magnetic field.
- The lunar night gives a second simple, real trade-off for power.
- Kids can see the Moon in the sky, and Artemis is in the news.

Mars appears as the **end goal** (see "Rocket to Mars") and in the end-screen comparison.

**Honesty notes:**
- Our Moon radiation numbers come from the LRO spacecraft in **lunar orbit**. On the surface the dose is roughly half, because the Moon itself blocks half the sky. In-game text says "near the Moon" or "measured in orbit around the Moon".
- The site is a mid-latitude Moon base, so the lunar night applies. At the poles, where Artemis plans to land, some ridges get almost constant sunlight. Mention this on the end screen if there's time.

## Core resources (3, no more)
| Icon | Resource | Real thing it stands for |
|------|----------|--------------------------|
| ⚡ | **Power** | Solar panels charge batteries in daylight. During the lunar night (about 14 Earth days outside the polar regions), only the batteries remain. |
| 💨 | **Air** | Life support. It needs power every day. |
| 🛡️ | **Shield** | Radiation protection. A stronger shield costs power. The crew can also go to a shelter, which stops science. |

**Science** is the score. The crew earns it on days with no emergency. It is not a resource to manage.

Food is mentioned in the challenge. It can appear as an event or end-screen fact. It does not get a fourth bar. (The challenge itself advises 2–3 core resources.)

## Time
- **One mission = 30 Earth days.** That is exactly one storm file in `data/storms/` and about one full lunar day-and-night cycle (29.5 days).
- **Normal speed:** 1 day ≈ 15 s, so a full mission takes about 7.5 min.
- **Fast-forward** (⏩ button) on calm days: 1 day ≈ 5 s.
- **When something happens, time slows down or stops.** An event card appears and the clock **pauses until the player chooses**. A child never loses for reading slowly.
- The HUD shows the speed openly, for example "⏩ 1 day = 15 s". We never pretend the game runs in real time.

## Events come from real data
Each mission plays one storm from `data/storms/` (archived NASA measurements) or, once unlocked, the live month from DONKI.

| Real data | What happens in the game |
|-----------|--------------------------|
| DONKI flare (class M or X) | A warning card. The bigger the class, the stronger the warning. Choices cost power or science. |
| DONKI particle event (SEP) | Radiation is coming. Raise the shield or send the crew to the shelter. |
| RadLab `timesNormal` for `moonOrbit` on that day | **How strong the radiation really was** ("278× normal"). Combined with the player's shield level, it gives the crew's dose. |
| DONKI CME speed | Flavour text: "A cloud of solar material is racing out at 1500 km per second." |

Every decision offers 2–3 options. Each option shows its cost before the tap and its result after (see `kids-ux`). No option is free, and none is always best.

## Calling Mission Control (help with a cooldown)
Mission Control on Earth is the player's **help button**, not a punishment.

- Tap **"Call Earth"**. A light dot flies to Earth and back in a real **2.6 s**, the true radio round trip between Earth and the Moon. That's the moment to say: "Even light needs time to travel!"
- The answer is a **concrete tip for the current situation**. For example:
  - "A big storm is coming. Raise your shield to 3 tonight."
  - "Your batteries are low and night is coming. Pause the science for 2 days."
- **Cooldown:** after a call, the button recharges over a few in-game days. The game shows this as a filling ring. The text "Mission Control is working out the next plan" makes clear that this is a game rule, not a physics limit.
- If the player is in trouble (a resource in the warning zone, or several bad choices in a row), the button gently pulses. No forced pop-ups.

## Failure is safe
- Each resource warns at about 25 %, using colour, icon and text.
- At 0 the player gets a setback, not a game over. Examples: "The crew moved to the shelter. You lost 2 days of science." "Life support switched to emergency mode."
- The astronauts are always okay. The base and the science suffer.
- The end screen celebrates any result and gives one tip for next time.

## End screen (the lesson)
- What happened, with the real numbers. For example: "On 14 May 2024 the radiation near the Moon was 278× normal. Your shield blocked most of it."
- **The real comparison, same day, from the same storm file:**
  - "On Mars it was only 15×. Mars has a thin atmosphere."
  - "On the space station it was about 1×. Earth's magnetic field protects it."
- A science score and 1–3 stars.
- Data attribution, with the label "Archived NASA measurements, <month year>".

## Progression and unlocks
1. **The storm library as levels.** The suggested order is: Oct 2021 (gentle) → May 2024 → Mar 2024 → Sep 2017 (extreme). Each finished mission unlocks the next. Feb 2022 and Nov 2025 are for the Mars and rocket content.
2. **Live mission.** Unlocked after the first mission: "The real Sun this month", using DONKI fetched live. The radiation factor is then estimated from similar past storms, and the game labels it as an estimate.
3. **Rocket to Mars, the end goal.** Unlocked after a few missions. Grounded in real facts:
   - Earth and Mars line up for a launch about **every 26 months**. The trip takes **about 7 months**.
   - In deep space there is no air and no magnetic field. Our BioSentinel data shows what storms do out there (up to about 300× normal).
   - Once at Mars, a radio message to Earth takes **between about 3 and 22 minutes one way**.

   **(open)** What happens after launch depends on remaining time. In order of effort:
   1. The game ends with a launch celebration and a "you made it" screen with real facts.
   2. The player can launch more rockets (collection or score).
   3. A cruise phase: one deep-space storm, played from `nov2025.json` or `mar2024.json` deep-space data.
   4. A Mars base with the **warning race**. The warning from Earth takes minutes, and the fastest particles might arrive before it. Do you act now or wait for advice? The animation is shortened and labelled "sped up", and the real minutes are shown.
4. Progress is saved in `localStorage`. No account and no personal data.

## Real vs. game rules (keep this line clear)
| Real (from NASA data or physics) | Game rule (say so if asked) |
|----------------------------------|-----------------------------|
| Storm dates, flare classes, particle events, CME speeds | Time compression, shown as "1 day = 15 s" |
| Radiation factors per site and day | Exact power and air costs per action |
| Earth–Moon radio round trip of 2.6 s | The cooldown on calling Mission Control |
| Lunar night of about 14 days, launch windows every 26 months, a 7-month trip to Mars | Science points and stars |

## Build order (cut from the bottom)
1. **One playable Moon mission with one storm** (May 2024), using grey boxes and no art: start → 30 days → end → restart. Test it with a real kid or teammate. (See `prototype-fast`.)
2. Event cards with costs, the 3 bars, shield and dose.
3. The end screen with the real comparison and attribution.
4. Call Earth (2.6 s round trip, tips, cooldown).
5. Speed controls (normal, fast-forward, pause on event).
6. Art and sound pass. Juice only after the loop is fun (see `game-feel`).
7. The storm library as levels, and unlocks.
8. The live DONKI mission.
9. The rocket to Mars (option 1 first).

## Still to decide today (team)
- Tech stack: Phaser 3 via CDN, or plain HTML/CSS/JS.
- Interfaces: game state shape, event format, module functions (see `AGENTS.md`).
- Art style and who draws (no AI images; `CREDITS.md` for everything).
- Exact numbers: costs, cooldown length, shield levels. Tune them by playtesting, not on paper.
