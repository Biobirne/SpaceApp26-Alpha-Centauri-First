# Research: make the game clear, honest and teaching

Research by Claude Code (SI), 14 Nov 2026, in answer to the playtest feedback in `FEEDBACK.md`. Three research passes:
1. Learning game design for kids aged 7–12
2. Real Moon science for the mechanics
3. Tools and skills

This file is the research as of 14 Nov. Words like "today" describe the game on that day. What was built since then is in `GAME_DESIGN.md` ("Build status") and `FEEDBACK.md`. Evidence quality is marked: **read** means the source was opened, **abstract/secondary** means a summary or a write-up by someone else. Section 8 lists what could not be verified.

## 0. Teaching comes first

**This is the team's top priority.** The challenge is a *mission trainer*. If kids don't learn, nothing else counts, however good the game looks. Every change is checked against this section first.

**What a child should be able to say after one mission** (our learning goals):
1. Solar panels make our power, and dust or night takes it away.
2. Space storms send fast particles. Thick walls or water protect you, so the crew hides in the shelter.
3. Hiding is safe, but then nobody works. That's the trade.
4. Air needs machines: the filter removes the CO₂ we breathe out, and oxygen is made from water using power.
5. The real storm in this game happened on a real date, measured by NASA.

**How we teach** (the rules behind sections 1–4):
- **Do first, then explain in one breath.** The child taps, sees the effect, and Sam gives the reason in ≤ 15 words. No reading before playing.
- **One new idea at a time.** Introduce it, let the child use it once safely, then make it matter.
- **Every number change shows its cause.** A child must always be able to answer "why did my air drop?" from the screen.
- **Mistakes are explained, not just punished.** One clear cause, one tip for next time.
- **What the fingers do is the lesson.** Each mini-game's action *is* the real thing: hatches to find a leak, mass against particles.
- **Help fades.** Lots of help the first time, a hint the second time, nothing the third.
- **Hints climb a ladder.** First the goal ("Keep the crew safe"), then the idea ("Thick walls stop particles"), then the exact step ("Tap the shelter"), and only then do it for them, with the why. Hints fire after a pause, after a mistake, or when the child taps for help (from `adaptive-hint-sequence-designer`, section 7).
- **Feedback says what happened, why, and one next step.** Praise the move, not the child ("Smart move: the shelter kept everyone safe").
- **Words are taught, not assumed.** Each new word (radiation, flare, CO₂) gets a kid definition plus a picture the first time it appears, then goes into "Words you learned".
- **Check understanding through actions, not a quiz.** For example: does the child send the crew to the shelter on the second storm without being told?

**Teaching test before the demo:** let 2 people who have never seen the game play one mission silently. Afterwards ask the 5 goals as "why" questions. Anything they can't answer is a P1 bug.

**Status on `main`** (15 Nov):
- Done:
  - tapping a building or the power, air or dose bar explains it ("Right now" breakdown)
  - lessons from mistakes
  - difficulty levels
  - the **shelter** is taught: in the training and as a guided step in the first mission (`src/ui/guide.js`)
  - every mini-game has its own action (dust, leak, filter, storm wall, reopening a room)
- Still open:
  - Cause tags don't fly to the bars as numbers change.
- Content fixed (mentor round 2): plants and algae are shown as *helpers* in the life support loop, and the oxygen machine (electrolysis) as the main oxygen source.
- **Build phase (mentor M7):** "tap a free spot" is close to the "switch on the base" idea in point 9 below. It works as long as it stays short and the storm still comes early.

## 1. Summary: the 10 changes with the most impact

Ranked by impact versus effort for about one day of build time.

1. **A practice alarm in the first 90 seconds.** It makes the player use shield *and* shelter once. The clock holds until they tap, then they see the dose stop and science stop. It is labelled "Drill, not real data".
   - This fixes the biggest playtest finding: "I didn't know I could send the crew to the shelter". `src/ui/guide.js` has no shelter step today, and only the leak step holds the clock.
   - Evidence: George Fan (Plants vs. Zombies), "get the player to do it once" and "do rather than read" (read).
2. **Show the reason next to every number change.** A small tag flies from the cause to the bar: "−2 air: leak in the lab", "+1 science: crew working", "−3 power: shield on Max". Tapping a bar lists what fills and drains it right now.
   - Evidence: explanatory feedback beats plain right/wrong feedback for learning and misconceptions (Moreno & Mayer 2005, abstract). NN/g: children struggle to find the root cause when something goes wrong (read).
3. **Every event card gets a before and an after.** Before: each option previews which bars move and which way, like Reigns. After: one result line with real numbers ("Shield on Max blocked most of it. It cost 6 power.").
4. **Sam is dominant while teaching and quiet afterwards.** While teaching: a big bubble near the centre, the rest dimmed, the target control glowing, at most about 8 words, read aloud by default. Afterwards the bubble shrinks back.
   - Evidence: Fan, about 8 words on screen; NN/g, kids skip instruction paragraphs (read); Mayer, spoken words with pictures beat text (summary).
5. **Start 1–2 days before the first storm and announce it:** "Particle storm arrives tomorrow" plus a countdown. Today the first decision comes on day 14.
   - Evidence: Into the Breach telegraphing (secondary).
6. **Say the "why" in one breath before each repair, and give each repair its own verb** (section 4). Fewer repairs, more variety.
   - Evidence: intrinsic integration. Children learn more when the content *is* the mechanic (Habgood & Ainsworth 2011, abstract), and the effect comes from where attention goes (Cutting & Iacovides 2022, abstract).
7. **Let the risky option go wrong once, visibly and safely, with an explanation.** Show the safe way first, then allow failure.
   - Evidence: the productive-failure meta-analysis favours "instruction first" for grades 2–5 (Sinha & Kapur 2021, abstract).
8. **Make science visible at its source.** "+1" ticks rise from the lab while the crew works; the lab shows "paused" when the crew is in the shelter. The goal is a bar with the star thresholds.
   - Evidence: NN/g saw 7-year-olds stuck on an unexplained number in a kids' game (read).
9. **Don't build free module placement. Do a 30-second "switch on the base" instead.** The player taps 4 modules in fixed places; each lights up, fills its bar and gets one sentence ("Solar panels make our power").
   - Evidence: Kingdoms and Castles tested free placement, got broken layouts, and taught through limited starting problems instead (read). Free placement also delays the storm, which is the actual lesson, and it is new touch code on the last day.
10. **Quieten Sam's queue.** At most one queued line, drop stale lines, and give tips only when the player is doing something wrong.
    - Evidence: Fan's "adaptive messaging, don't create noise" (read).

Cheap extra with high value: watch two kids (or two strangers) play silently before the demo and fix the first thing that confuses them (Valve's practice, read).

## 2. Proposed onboarding: the first 3 minutes

| Time | What happens | Player does |
|---|---|---|
| 0:00–0:30 | **Switch on the base.** Four modules in fixed places, dark. Sam is large and centred, one line each. | Taps the solar panels (power bar fills), the air machine (air bar fills), the lab (first "+1 science") and the shelter door ("the safe room"). |
| 0:30–0:50 | **The safe first leak** (already exists). Before: "Air is leaking out. Seal the crack." After: a tag "air stopped dropping". | Fixes the leak; the clock waits. |
| 0:50–1:30 | **Practice alarm, "Drill, not real data".** The radiation chip rises. Step 1: the shield glows, the player raises it, a tag shows the power cost. Step 2: the shelter glows, the player sends the crew in, the dose stops and the lab shows "paused". Sam: "Safe, but no science. That's the trade." | Shield, then shelter, then brings the crew back out. The clock holds on each step. |
| 1:30–2:00 | **Real data starts.** Banner: "Real storm from [date]. Arrives tomorrow." Countdown. Nothing is highlighted any more. Fast-forward is introduced. | Prepares. |
| 2:00–2:40 | **First real event card** with option previews. The game pauses. | Chooses. |
| 2:40–3:00 | **Result line** with real numbers and bar tags. If the risky option was chosen, one explained setback. Call Earth is introduced only now. | Plays on. |

Rules:
- **Gate only the three core actions:** repair, shield, shelter. After about 8 s without the right tap, the hint gets stronger: first a bigger arrow, then Sam says exactly where to tap. A child is never stuck.
- Returning players skip the drill, and judges get a skip link.
- Everything else (Call Earth, data chip, upgrades) is explained in context, not gated.
- **Fade the help:** on the first alarm Sam shows everything, on the second he gives a hint, on the third he says nothing.
  - Evidence: worked examples with fading, adaptive fading better than fixed (secondary).

## 3. Realism check of the mechanics

| Mechanic | Verdict | Honest version |
|---|---|---|
| **Shield dome** (Off/Low/Mid/Max, costs power) | **Misleading as today's tech.** Active magnetic shields are concept studies only (NASA NIAC). NASA: force fields would need "a prohibitive amount of power and structural material". What really protects is **mass**: water, polyethylene, supply bags, Moon soil. Mass costs no power. | Best: protection by mass that costs something else, such as crew time, water you can't use for anything else, or digging time. Orion's real plan: the crew builds a shelter from supply bags within an hour and stays up to 24 h. PR #11 now labels the dome "Magnet shield, test tech", which is acceptable as a fallback. |
| **Storm shelter** | **Accurate.** It is the real strategy, and the trade-off (stuck inside, no work) is real. | Keep. The crew can thicken it themselves. |
| **Greenhouse "makes our oxygen"** | **Misleading.** One person needs about 20–25 m² of crops just for oxygen; the ISS salad garden is 0.15 m², so about 200 of them per person. Real oxygen comes from **splitting water with electricity** (ISS). | "Machines make most of our oxygen from water. Plants help a little and give fresh food." This links air to power and water, which makes a good trade-off. |
| **Dusty solar panels** | **Simplified-OK, but the timing is wrong.** Panels sitting still collect dust extremely slowly; dust comes from **landings, rovers and boots**. | Trigger dust after a landing or a rover drive, not at random. |
| **Leak from a space rock** | **Simplified-OK.** Detection by pressure drop and patching are real. The famous real leaks were a drilled hole and cracks, not rocks. | "Something made a tiny hole. Find it." Whipple shields explain why most hits don't get through. |
| **Swap the air filter (CO₂)** | **Accurate** for canister scrubbers (Apollo, spacesuits). ISS regenerates its beds instead. | "The filter is full of the CO₂ you breathed out." |
| **Solar panels plus 14-day night** | **Accurate.** The lunar night is the real hard problem away from the poles. | Keep. A small reactor as an upgrade ("works in the dark"). Polar sites get sun most of the year. |
| **Call Earth, 1.3 s one way** | **Accurate** (384,400 km at the speed of light is 1.28 s). | Keep. |
| **Storm timeline** | **One trap.** On the Moon the danger is the **fast particles** (minutes to hours after the flare), not the slow CME cloud (1–3 days). | "Flash first, particles soon after." Don't make the CME arrival the main radiation hit. |
| **Limited spare parts** (idea) | **Plausible.** Resupply is slow and expensive, but no direct source was read. | "We only brought 3 patches. The next cargo ship is weeks away." A small spares counter on each repair. |

## 4. Mini-games that teach (one verb, one true fact, the result on a real bar)

Frame them all the same way: a why-line before, ≤ 20 s, a result tag on the real bar after. Only the verb changes.
- Evidence: WarioWare plans each microgame as one picture plus one verb (read). Intrinsic integration: what the fingers do is what the child remembers.

| Mini-game | Verb | What it teaches | Real story behind it |
|---|---|---|---|
| **Leak hunt** | Close hatches one by one. The room whose pressure needle keeps falling has the leak. Release "tea leaves", watch them drift to the hole, drag tape on. | How leaks are found and why hatches exist. | ISS 2020: the crew closed modules one by one, then floating tea leaves showed the crack. |
| **Dust: brush vs. dust shield** | Swiping with a brush leaves smears. Tapping the "electric dust shield" makes the dust jump off in a wave. Power rises as each panel clears. | Moon dust is sticky and sharp. Brushing worked badly on Apollo. | NASA's Electrodynamic Dust Shield worked on the Moon in 2025 (Blue Ghost). |
| **Square peg, round hole** | Drag a bag, cardboard, hose and tape into the right order to make the filter fit. | CO₂ must be removed; engineers improvise. | Apollo 13's "mailbox" adapter. |
| **Build the storm fort** | Before the particles arrive, drag water bags and supply crates onto the thin side of the sleeping room. The dose meter drops as the gaps close. | Mass blocks radiation; water is a good shield. | Orion's real shelter plan. |
| **Split the water** | Drag power to the oxygen machine. Each drop splits into O₂ (to the room) and H₂. | Oxygen costs water *and* power. | ISS oxygen generator (electrolysis). |
| **Night budget** | Before sunset, drag limited battery bars onto heater, air, radio and lab. Anything without a bar goes dark for the night. | The lunar night lasts about 14 days, and batteries must last. | NASA lunar power studies. |

Pick 2–3 for the demo. The best ratio of teaching to effort is probably **dust** (fixes "why clean panels?"), **storm fort** (fixes the misleading shield) and **leak hunt**.

## 5. Kid sentences (true, ≤ 15 words)

- **Shield**
  - Thick walls stop space radiation. Water and Moon soil make good walls.
  - Astronauts build a storm fort from their own supply bags.
  - Magnetic shields are still an idea. Nobody has built one yet.
- **Dust**
  - Moon dust is sharp like tiny glass and sticks like socks from the dryer.
  - A new NASA shield shakes dust off with electricity. It worked on the Moon in 2025.
- **Leak**
  - Astronauts once found a leak by watching tea leaves float to the hole.
- **CO₂**
  - You breathe out CO₂. A filter has to catch it, or the air goes bad.
  - Apollo 13's crew fixed their air filter with tape, a bag and cardboard.
- **Oxygen**
  - The space station makes oxygen by splitting water with electricity.
  - One astronaut would need about 200 space-station salad gardens to breathe.
- **Power**
  - Night on the Moon lasts about two weeks. Solar panels get no light then.
- **Resources**
  - Moon soil is almost half oxygen, locked inside the rock.
- **Storm warning**
  - Light from a flare reaches us in eight minutes. Particles can follow within an hour.

## 6. Look: getting away from the generic SI style

What distinctive kids' games share, and what the current navy/purple look lacks:
- light or warm backgrounds instead of navy
- one committed shape language
- flat colour with texture instead of gradients and glow
- **resources as things in the world** instead of bars
- **a results screen that is an object from the world**, such as a mission logbook or a patch board, instead of stat cards

References:
- **Astroneer:** oxygen and power are physical things on the backpack.
- **Reigns:** a choice previews which stats it touches.
- **Mini Metro:** off-white background, 6–7 flat colours, strict shapes.
- **Animal Crossing:** warm cream and teal, speech bubbles with a name tag.
- **Tinybop Space:** learning by poking a system.
- **Duolingo:** one strong button style everywhere.
- **Alba:** UI as an in-world phone and a paper field guide.
- **Game Builder Garage:** one new idea per lesson, then a checkpoint puzzle.

Earlier research (14 Nov) for art without a drawer: real NASA images for the sky and ground (SDO Sun, LRO Moon, Earth photo), Phosphor icons (MIT), and modules placed by a human or labelled as SI.

## 7. Tools and skills

**No reputable ready-made skill for children's learning games exists.** These are **options for the team, nothing is installed.** Each was read in full on 14 Nov, by two separate SI reviewers plus an automated scan for hidden characters, injection phrases and links. Copy only as plain markdown at the pinned commit, never via an installer.

| Skill | Source and licence | Security check | Verdict |
|---|---|---|---|
| `onboarding-and-teaching` (SKILL, GUIDE, CHECKLIST) | rondorkerin/gamestack @ `0419358`, MIT | No commands, installs, links, file writes or hidden text. Only dead links to sibling skills. | **Safe with edits.** Delete the analytics/tracking lines (CHECKLIST.md:65, :74; GUIDE.md:137–142, :158c) because our players are children and we collect no data. Delete the "Headless guardrails" and "Procedural / headless implication" parts (CHECKLIST.md:92–102; GUIDE.md:48, :86, :122, :158), which don't apply. Useful: one idea per beat, the first win before the first failure, every failure with one cause nameable in 5 s, real play within 3 minutes. |
| `adaptive-hint-sequence-designer`, `feedback-quality-analyser`, `cognitive-load-analyser`, `vocabulary-tiering-tool` | GarethManning/education-agent-skills @ `135d627`, **CC BY-SA 4.0** | No commands, installs, links, file writes or hidden text. The README offers installers; don't run them. | **Safe, but don't commit them.** ShareAlike means copied files can't sit under our MIT licence. Use the ideas (already folded into section 0), not the files. They are written for teachers of 11–18-year-olds and say "AI". |
| `color-expert` | meodai/skill.color-expert @ `5bf7c77`, CC BY 4.0 | 2.7 MB of reference files, too big to read in full. Its SKILL.md suggests running `npx` tools. | **Not recommended.** Pick colours by hand with the references in section 6 and the contrast check below. |

**Avoid:**
- Impeccable: downloads a binary and installs hooks.
- taste-skill and ui-ux-pro-max: scripts, built for landing pages.
- Large "game studio" packs.
- Repos without a licence.
- All MCP servers found for readability, accessibility, TTS or colour: tiny, unvetted, and they run third-party code.

**Lightweight checks without new dependencies:**
- **Readability:** max ~10–12 words per sentence, an allow-list plus a glossary of taught words. The Flesch–Kincaid formula is only meaningful on whole screens of text, not on button labels. The New Dolch List (CC BY-SA 4.0) is the cleanly licensed kids' word list.
- **Accessibility:** inject axe-core from cdnjs in Playwright at test time only. It checks the HTML HUD, not the Phaser canvas.
- **Contrast:** the WCAG formula in about 10 lines. Targets: 4.5:1 for text, 3:1 for bar fills against their track.

## 8. Not verified

- Several figures come from abstracts or summaries only:
  - Andersen et al. 2012 (tutorial A/B tests)
  - Habgood & Ainsworth's effect size
  - Mayer, Wouters and Sinha & Kapur effect sizes
  - the GDC talks on Into the Breach, Reigns and Portal
- **No controlled study on gating for children** and none on mini-game variety. Those points are judgement calls.
- **Science facts read only as summaries:**
  - the June 2026 Zvezda update
  - the 100 kW reactor goal
  - the Chang'E-4 dose
  - the habitat power figures
  - NOAA timings

  Open the source before quoting any of them in the game.
  The tea-leaf story was opened afterwards (UPI, 20 Oct 2020, and TASS) and is used in the leak mini-game.
- **Facts that remain uncertain:**
  - The micrometeoroid puncture rate for a Moon habitat was not found.
  - The regolith thickness needed differs between sources, so the game should avoid giving a number.
  - Spare-part resupply cadence was not sourced.
- **Skills:** none has evidence that it improves agent output. The gamestack and education files were read in full; color-expert's reference files were only scanned automatically. The gamestack plugin's shared `PREAMBLE.md` was not read, because the onboarding skill doesn't reference it.
- No source for how long Space Apps judges actually play.

## Sources (main)

- George Fan, 10 tutorial tips: https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan
- NN/g children's UX: https://www.nngroup.com/articles/childrens-websites-usability-issues/ and https://www.nngroup.com/articles/kids-cognition/
- Habgood & Ainsworth 2011: https://shura.shu.ac.uk/3556; Cutting & Iacovides 2022: https://eprints.whiterose.ac.uk/189921/
- Sinha & Kapur 2021 (productive failure): https://doi.org/10.3102/00346543211019105
- Andersen et al. CHI 2012: https://grail.cs.washington.edu/projects/game-abtesting/chi2012/
- Kingdoms and Castles: https://www.gamedeveloper.com/design/teaching-players-without-tutorials-in-i-kingdoms-and-castles-i-
- Valve playtesting: https://gmtk.substack.com/p/valves-secret-weapon
- NASA on radiation protection: https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/
- Orion shelter plan: https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/
- NASA dust shield on the Moon: https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/
- Apollo dust (Gaier): https://ntrs.nasa.gov/citations/20070021819
- Apollo 13 CO₂ adapter: https://www.nasa.gov/image-article/putting-square-peg-round-hole
- Plants vs. oxygen (Wheeler, NASA KSC): https://simoc.space/wp-content/uploads/2018/09/When-Can-Plants-Begin-to-Contribute-to-Atmospheric-Management-WHEELER.pdf
- Lunar power: https://ntrs.nasa.gov/api/citations/20220005893/downloads/Power%20and%20Energy%20for%20the%20Lunar%20Surface.pdf
- NOAA radiation storms: https://www.swpc.noaa.gov/phenomena/solar-radiation-storm
- Skills: https://github.com/rondorkerin/gamestack, https://github.com/GarethManning/education-agent-skills, https://github.com/meodai/skill.color-expert
