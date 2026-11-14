// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Player-facing text that the rules produce. Plain English for ages 7–12 (see kids-ux skill).
// Facts here must be true; if unsure, leave it out.

export const CREWMATE_NAME = 'Sam'; // (open) final name decided with the art

export const ROOMS = {
  solar: { name: 'Solar panels', short: 'Solar' },
  lab: { name: 'Science lab', short: 'Lab' },
  hab: { name: 'Living quarters', short: 'Home' },
  greenhouse: { name: 'Greenhouse', short: 'Plants' },
  shelter: { name: 'Storm shelter', short: 'Shelter' },
};

/** Science words the player can earn. Each explanation stays under 15 words. */
export const GLOSSARY = {
  flare: { word: 'Solar flare', text: 'A sudden, giant flash of energy from the Sun.' },
  particles: { word: 'Particle storm', text: 'Tiny bits from the Sun, some flying nearly as fast as light.' },
  radiation: { word: 'Radiation', text: 'Invisible energy that can harm living cells if you get too much.' },
  lunarNight: { word: 'Lunar night', text: 'Darkness on the Moon that lasts about two weeks.' },
  micrometeoroid: { word: 'Micrometeoroid', text: 'A space rock smaller than a grain of sand, flying super fast.' },
  scrubber: { word: 'CO₂ scrubber', text: 'A filter that cleans the air the crew breathes out.' },
  dust: { word: 'Lunar dust', text: 'Sharp, sticky Moon dust that covers everything.' },
  magneticField: { word: 'Magnetic field', text: 'Earth’s invisible shield that bends solar particles away.' },
  atmosphere: { word: 'Atmosphere', text: 'A layer of air around a planet. Mars has a thin one.' },
};

/** Calm-moment lines so something is always happening. All true facts. */
export const CHATTER = [
  'The sky is black here, even in daytime. There’s no air to scatter sunlight.',
  'Earth looks almost four times wider from here than the Moon looks from Earth.',
  'One day and night on the Moon lasts about 29 Earth days.',
  'There’s no wind on the Moon, so footprints stay for a very long time.',
  'The Moon has no magnetic field to push solar particles away. That’s why we need shields.',
  'Apollo astronauts said Moon dust smells a bit like burnt gunpowder.',
  'You weigh about one sixth of your Earth weight here. Great for jumping!',
  'Earth never sets in our sky. From this side of the Moon it is always up there.',
  'Radio signals to Earth take about 1.3 seconds. That’s how far away home is.',
  'Plants in our greenhouse make fresh oxygen for us to breathe.',
];

export const UPGRADES = {
  battery: {
    name: 'Bigger battery',
    text: 'Store more power for the long lunar night.',
    fact: 'Real Moon bases must survive about 14 days of darkness.',
  },
  walls: {
    name: 'Regolith walls',
    text: 'Pile Moon soil on the base. Less radiation gets in.',
    fact: 'NASA studies covering Moon habitats with lunar soil for protection.',
  },
  fission: {
    name: 'Fission power unit',
    text: 'A small reactor that makes power day and night.',
    fact: 'NASA’s Fission Surface Power project is designing one for the Moon.',
  },
};
