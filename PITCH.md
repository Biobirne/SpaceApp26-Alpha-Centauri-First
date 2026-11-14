# Pitch: Moon Base Commander

The final pitch in one place: what we have, why it is good, what mattered to us, and a 90-second script.
Draft by Claude Code (SI) from our own docs (`GAME_DESIGN.md`, `RESEARCH.md`, `FEEDBACK.md`) and the storm data. The ideas are the team's. **Everything marked ✏️ needs our own words before the pitch.**

Time budget: **90 seconds planned, 2 minutes hard limit.** QR code on the last slide.

## The pitch in one sentence
Kids aged 7–12 run a Moon base for 30 days through a **real solar storm measured by NASA**, and every choice costs something: power against protection, safety against science.

## Our 3 main selling points (focus on these)

### 1. A real storm, not invented numbers
- **What:** five real solar storms from 2017 to 2024 are the Moon levels. Every flare, particle storm and radiation value comes from NASA, replayed day by day. A sixth storm (Nov 2025) is deep-space only and is kept for the planned Mars mission.
- **Proof in the game:** the radiation chip shows "278× normal" on 14 May 2024. That is what NASA's LRO spacecraft measured near the Moon (1528 µGy/h against 5.5 on a calm day). Tap "Data" to see the real chart.
- **Why it matters:** the challenge asks for "real NASA open data, rather than invented statistics" and names DONKI and OSDR. We use both: DONKI for flares and particle storms, OSDR RadLab for the radiation.

### 2. Every choice costs something, and the game says why
- **What:** each decision shows its cost before the tap and its cause after.
  - **Shield:** a stronger shield costs power, and at night the battery can run dry.
  - **Shelter:** keeps the crew safe, but no science gets done.
  - **Spacewalk:** the panels get clean, but there is no shield outside.
- **Proof in the game:** shield buttons show "−3.5 ⚡/day". After a mistake, Sam the crewmate says what happened and what to try next time. There is no game over, only setbacks with a lesson.
- **Why it matters:** the challenge's core sentence is "no choice is free, and every decision teaches something true". That is our main mechanic, not a quiz on top.

### 3. Honest science, one tap deep
- **What:** kids see simple numbers and bars. Tap any of them and you get a short explanation, the real unit and the real-life fact.
- **Proof in the game:**
  - Tap "Shield": a table of every level with today's radiation. The sheet says no base has a magnet shield yet, and names the CERN and NASA research behind the idea.
  - Tap the dose bar: gray vs. sievert, and NASA's 600 mSv career limit.
- **Why it matters:** it is simple enough for a 7-year-old and deep enough for a jury. We always say what is real and what is a game rule.

## More strengths (for questions, or if there is time)
- **Communication delay you can feel:** "Call Earth" waits the real 2.6 seconds for a radio signal to reach the Moon and come back. Mission Control's answer gives a tip and the reason behind it.
- **The hands do the lesson (mini-games):**
  - Rub Moon dust off the solar panels.
  - Stack heavy supplies on the shelter wall: water and Moon soil stop particles, a pillow does not.
- **Life support loop (mentor feedback):** air and water are recycled like on the space station (98 % of the water). The oxygen machine splits water with power. Plants and an algae bioreactor help, but their lamps cost power.
- **Learned from an Apollo-era mentor:** Moon dust clogs the air filter, spacesuit facts, and the radiation limit of about one year on the Moon.
- **Built for kids:**
  - Read-aloud with the device's voice, for kids who are still learning to read.
  - Easy, Normal and Hard. An intro where kids place each building themselves.
  - Badges and stars, with no streaks and no pressure.
- **Works for everyone, right away:** runs in any phone browser. No install, no login, no personal data, a small download. The game plays without internet data from NASA, so venue Wi-Fi can't break it.
- **The same storm on the Moon, on Mars and on the space station:** in the May 2024 storm, the Moon peaked at 278× (14 May), Mars at 15× (20 May), and the space station stayed near 1×. Each is measured by NASA instruments; peaks can fall on different days.

## What mattered to us ✏️
From our own rules (`AGENTS.md`, `RESEARCH.md`). Put this in our own words, and add one personal sentence each.
- **Teaching comes first.** If a child plays one mission and can't say why the crew goes to the shelter, we failed, however good the game looks.
- **Honest with kids.** Real data is labelled as archived, never as live. Made-up game numbers are called game numbers.
- **Safe for kids.** No accounts, no tracking, no dark patterns, no scary game over.
- **Feedback rounds:** two mentor rounds, an Apollo-era mentor and our own playtests. `FEEDBACK.md` lists every point and what we did about it.
- ✏️ *Why we picked this challenge, in one sentence (personal).*

## The 90-second script
About 210 spoken words. Read slowly; pauses are marked with "/".

| Time | Slide | Say |
|------|-------|-----|
| 0:00–0:12 | **1. Hook:** the May 2024 radiation chart, the Moon bar towering | "On the 14th of May 2024, a real solar storm hit the Moon. / NASA measured 278 times the normal radiation. / Imagine you are in charge of a Moon base that day. What do you do?" |
| 0:12–0:22 | **2. The problem** (one line of text) | "Space content for kids is often posters and facts, or far too complex. Kids never feel the trade-offs that real missions face." |
| 0:22–0:47 | **3. The game:** a short silent screen recording or 2 screenshots | "So we built Moon Base Commander. Kids aged 7 to 12 run a Moon base for 30 days, through a real storm from NASA's archive. / Raise the shield? It costs power, and at night the battery runs dry. Hide in the shelter? Safe, but no science gets done. Need help? Call Earth, and wait the real 2.6 seconds for the answer." |
| 0:47–1:17 | **4. Three points**, one line each | "Three things make it special. / One: real data. Five real Moon storms, from NASA DONKI and OSDR. No invented numbers. / Two: every choice costs something, and Sam, the crewmate, explains why. No game over, just lessons. / Three: honest science, one tap deep. Kids see simple numbers. Tap one, and you find the real unit and the source." |
| 1:17–1:30 | **5. QR code** + the game's link | "One rule came first for us: if kids don't learn, nothing else counts. / It runs on any phone. No install, no login. Scan the code and survive the storm yourself. Thank you!" |

✏️ If we pitch in German, translate the script but keep the numbers.

## Slides (5, little text)
1. **Hook:** the real radiation chart of May 2024 (the in-game "Data" sheet or a clean chart from `data/storms/may2024.json`), with "278× normal radiation near the Moon, 14 May 2024" and "Data: NASA OSDR RadLab, LRO CRaTER".
2. **Problem:** one sentence, e.g. "Kids learn space facts. They never feel space trade-offs."
3. **The game:** a phone frame with gameplay. A storm day with the shield buttons and their costs, plus the storm fort mini-game.
4. **Three points:** Real storm · Every choice costs · One tap deep. One icon or screenshot each.
5. **QR code:** "Play now, on your phone", the URL https://biobirne.github.io/SpaceApp26-Alpha-Centauri-First/ and the team name. Leave it up during questions.

No NASA logos on any slide (Space Apps rule). If a slide uses SI-made images, they need a visible watermark. Screenshots of our own game are fine.

## Demo or slides?
**Recommendation: slides with a 15–20 s screen recording on slide 3, no live demo.**
- In 90 seconds, a live demo eats the time: loading, Wi-Fi, a wrong tap.
- A recording has a fixed length and always shows the best moment: the storm arrives, the kid raises the shield, the battery drops, and they go to the shelter.
- The QR code is the live demo: judges can play on their own phone during or after the questions.
- Bring a phone with the game already open as a backup for questions.

## Questions the jury might ask (short answers)
| Question | Answer |
|----------|--------|
| Is the data live? | No. These are archived NASA measurements from six real storms (five of them play on the Moon), and the game says so. NASA's radiation archive ends in November 2025. A live month from DONKI is possible (the API works from the browser), but we did not build it. |
| Do magnet shields exist? | Not on any base yet. Scientists are testing the idea (CERN's SR2S project, NASA NIAC studies). The game calls it test tech, and the shield sheet says so with sources. Real protection today is mass: water, Moon soil and a shelter. That is what the storm fort mini-game teaches. |
| Where are food and Mars? | Plants and algae are part of the life support loop. Food has no extra bar, because the challenge itself advises 2–3 core resources. Mars is in the data (same storm, Mars vs. Moon) and is planned as the end goal. |
| How do you know kids learn? | Five learning goals (`RESEARCH.md`, section 0). Kids learn by doing, and the game explains each step, without a quiz. ✏️ Add what our playtests showed. |
| Did you use SI? | Yes, for code and research, and it is all disclosed (`SI_USAGE.md`, `si-manifest.json`). The ideas and decisions are ours. No SI-generated images in the game. |
| Why the Moon? | It has no air and no magnetic field. In September 2017, radiation there reached about 1800× normal. And kids can see the Moon from home. |

## Fact check (numbers in this pitch)
| Number | Where it comes from |
|--------|---------------------|
| 278× normal near the Moon on 14 May 2024 (1528 µGy/h, calm 5.49) | `data/storms/may2024.json`, NASA OSDR RadLab, LRO CRaTER |
| about 1800× normal (1778×) on 11 Sep 2017 | `data/storms/sep2017.json`, same source |
| Mars 15× (20 May 2024), space station about 1× | `data/storms/may2024.json`, Curiosity RAD and ISS DosTel |
| 2.6 s radio round trip Earth–Moon | `GAME_DESIGN.md`, "Real vs. game rules" |
| 98 % water recycling on the space station | `GAME_DESIGN.md`, NASA 2023 |
| NASA career limit 600 mSv | `src/ui/numbers.js` (NASA-STD-3001) |
| Six storms in the archive, 2017–2025 (five Moon levels) | `data/storms/` |

## Still to do before the pitch ✏️
- [ ] Fill in the ✏️ parts in our own words.
- [ ] Decide on the language (English or German).
- [ ] Record the 15–20 s clip and take screenshots once the design is final.
- [ ] Make the QR code from the game URL and test it with two phones.
- [ ] Rehearse with a timer. Aim for 1:30; cut a "More strengths" point rather than speaking faster.
