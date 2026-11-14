# SI Disclosure

How this project labels the use of **Super Intelligence (SI)** tools. Space Apps uses the word SI for machine learning, chatbots, image generation and large language models. We always write "SI" in this repo and in the game, never "AI".

Source: [Space Apps project submission guide](https://www.spaceappschallenge.org/resources/project-submission-guide), section "Use of Super Intelligence (SI)" (checked 14 Nov 2026).

## The official rules (short version)

- Using SI tools is allowed.
- SI must not be used to come up with the idea of how to solve the challenge. The idea has to come from the team.
- SI-generated content must not use, contain or change any NASA branding or design elements.
- **Images and videos** made by SI need a **visible watermark** that says they are SI-generated.
- **Audio** made by SI needs an acknowledgement in **descriptive text and in metadata**.
- **Code and data** made with SI need an acknowledgement in **descriptive text and in metadata**.
- The SI question in the submission form is only for statistics. But judges can see every SI indicator in the project (watermarks, text, metadata).

Our record for the idea rule: the game concept came from team discussion. SI helped write it down (`GAME_DESIGN.md`) and build it (see `SI_USAGE.md`).

## Where we label what

| Kind | Descriptive text | Metadata | Visible in the game |
|------|------------------|----------|---------------------|
| Code (`src/`, `tests/`, `tools/`) | A header comment in every file; `SI_USAGE.md` | `si-manifest.json` | Credit line on the start and end screens |
| Data (`data/`) | `data/README.md`, `SI_USAGE.md` | `si-manifest.json` (JSON files can't hold comments) | Credit line names the NASA sources |
| Docs (`*.md`) | `SI_USAGE.md` | `si-manifest.json` | – |
| Images | `CREDITS.md` | `si-manifest.json`, plus file metadata (below) | **Watermark** on the image itself |
| Audio | `CREDITS.md`, in-game credit line | `si-manifest.json`, plus file tags (below) | Credit line |
| Video (demo video) | Video description | Upload metadata | **Watermark** on SI-generated footage |

### Placeholder pictures in the game right now

The Moon base, Earth, Sun, icons and crewmate are drawn by code that an SI tool wrote. We treat these pictures as SI-generated images. So the game shows the watermark **"SI-generated placeholder art"** in the corner of the Moon scene. It goes away once the team's own art replaces everything: set `"siPlaceholders": false` in `assets/art/manifest.json`. Team art itself never gets the watermark, because people drew it.

The project rule (AGENTS.md, rule 6) stays the same: the **final** game uses no SI-generated images.

## How to label a new SI-generated file

Do this for every file that an SI tool generated (picture, sound, voice line, video clip). A file that a person made with normal tools needs none of this, only a row in `CREDITS.md`.

1. **Add a row to `CREDITS.md`** with the words "SI-generated", the tool name and the date.
2. **Add an entry to `si-manifest.json`** (`"si": "generated"`, tool, date, what the prompt asked for).
3. **Put a label on the file itself**:
   - **Image:** burn a visible watermark into a corner, for example with ImageMagick:
     `magick in.png -gravity SouthEast -pointsize 18 -fill "#ffffffcc" -undercolor "#00000088" -annotate +6+6 " SI-generated " out.png`
     Then write the metadata too (IPTC digital source type for generated media):
     `exiftool -XMP-iptcExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" -XMP-dc:Description="SI-generated with <tool>, <date>" out.png`
   - **Audio:** write a comment tag, for example with ffmpeg:
     `ffmpeg -i in.wav -c:a libvorbis -q:a 3 -metadata comment="SI-generated with <tool>, <date>" -metadata artist="<tool> (SI)" out.ogg`
     Then name it in the in-game credit line ("Voices made with the SI tool <tool>").
   - **Video:** the watermark must be visible during the SI-generated part. Also mention it in the video description.
4. **Add one line to `SI_USAGE.md`.**

## Voices and sounds: the plan

Status 14 Nov: the sound effects and voice option 1 (read aloud with the device's own voice) are built. Options 2 and 3 are open for the team.

Sound must stay small (venue Wi-Fi), safe for kids and easy to switch off. The kids-ux rules apply: sound starts only after the first tap, and a mute button is visible on every screen.

### Sound effects: made in the browser, no files

- Short effects (button click, leak hiss, repair done, flare warning, star earned) are **synthesized live with the Web Audio API**: oscillators, noise and envelopes in a small module (`src/audio/sfx.js`).
- Upside: zero download, no license question, easy to tune.
- Labeling: the synth code is SI-assisted code, so it gets the header comment and a `si-manifest.json` entry. No sound file is SI-generated, so no audio tags are needed. The credit line says so.
- Rules: quiet by default (low master volume), no harsh or scary sounds, no constant loop, and every effect has a visual twin (sound is never the only signal).

### Voice: three options, in order of preference

1. **Read aloud with the device's own voice** (`speechSynthesis`, built into browsers). A speaker button reads the crewmate's line. It costs zero bytes and helps kids who are still learning to read. Prefer a voice with `localService: true` and `lang` starting with `en`. Online voices send the text to the browser maker's server; our text contains no personal data, but local is cleaner. This is not SI-generated content that we ship: the device makes the sound at runtime, and we don't store any audio. We still mention it in the credits ("Read aloud by your device's voice").
2. **Team members record the voice lines themselves.** It sounds best and feels personal. Record short OGG files (mono, 48–64 kbps, a few KB each), add `CREDITS.md` rows ("recorded by the team, MIT"), and load them only after the first tap. Use the adult team members' voices only; never record children.
3. **SI voice generation** (a text-to-speech or voice SI service), only if 1 and 2 don't work out. Then follow "How to label a new SI-generated file" above: file tags, `CREDITS.md`, `si-manifest.json`, and a visible credit line in the game ("Crew voice generated with the SI tool <tool>"). Never clone a real person's voice. Never use a voice that sounds like a NASA announcer or uses NASA names.

### Background music

Leave it out for the hackathon. If the team wants music, use a track with a clear free license (CC0 or CC BY) and credit it, or make a short loop in a music tool by hand. SI-generated music would need the audio labeling above.
