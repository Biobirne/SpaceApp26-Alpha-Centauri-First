// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// Player-facing text that the rules produce. Plain English for ages 7–12 (see kids-ux skill).
// Facts here must be true; if unsure, leave it out.

export const CREWMATE_NAME = 'Sam'; // (open) final name decided with the art

// One name per room: the label on the base, the info sheet and every sentence use the same word
// (playtest: "Plants" on the base opened a sheet called "Greenhouse"). `short` stays for older callers.
export const ROOMS = {
  solar: { name: 'Solar panels', short: 'Solar panels' },
  lab: { name: 'Science lab', short: 'Science lab' },
  hab: { name: 'Home', short: 'Home' },
  greenhouse: { name: 'Greenhouse', short: 'Greenhouse' },
  shelter: { name: 'Shelter', short: 'Shelter' },
};

/** Science words the player can earn. Each explanation stays under 15 words. */
export const GLOSSARY = {
  flare: { word: 'Solar flare', text: 'A sudden, giant flash of energy from the Sun.' },
  particles: { word: 'Particle storm', text: 'Tiny bits from the Sun, some flying nearly as fast as light.' },
  radiation: { word: 'Radiation', text: 'Invisible energy that can harm living cells if you get too much.' },
  lunarNight: { word: 'Lunar night', text: 'Darkness on the Moon that lasts about two weeks.' },
  micrometeoroid: { word: 'Micrometeoroid', text: 'A space rock smaller than a grain of sand, flying super fast.' },
  scrubber: { word: 'CO₂ scrubber', text: 'A filter that cleans the air the crew breathes out.' },
  oxygenMachine: { word: 'Oxygen machine', text: 'It splits water into oxygen and hydrogen, using electricity.' },
  recycling: { word: 'Recycling loop', text: 'Used air and water get cleaned and used again and again.' },
  dust: { word: 'Lunar dust', text: 'Sharp, sticky Moon dust. It is bad for lungs and machines.' },
  eva: { word: 'Spacewalk', text: 'Going outside in a spacesuit, with oxygen, cooling water and spare air.' },
  magneticField: { word: 'Magnetic field', text: 'Earth’s invisible shield that bends solar particles away.' },
  atmosphere: { word: 'Atmosphere', text: 'A layer of air around a planet. Mars has a thin one.' },
  magnetShield: { word: 'Magnet shield', text: 'Test tech: strong magnets push solar particles away. No base has one yet.' },
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
  'Our oxygen machine makes most of our air from water. Plants help a little and grow food.',
  'One astronaut would need about 200 space-station salad gardens just to breathe.',
  'The space station gets back 98 of every 100 drops of water. Even sweat gets cleaned.',
  'In 2017, tiny algae flew to the space station. They turned CO₂ into oxygen.',
  // Story and history (mentor feedback: storytelling)
  'Apollo 11 landed near here in 1969. Their footprints are probably still there.',
  'In 1959, the US Army planned a Moon base called Project Horizon. It was never built.',
  'In August 1972, a giant solar storm hit between two Apollo missions. Luckily, nobody was on the Moon.',
  'NASA’s Artemis missions plan to bring astronauts back to the Moon, near its south pole.',
  // How a real base could be built (mentor feedback: materials)
  'Real Moon bases may be 3D-printed from Moon soil, so less has to fly from Earth.',
  'Every kilogram sent to the Moon costs a lot. That’s why a base recycles almost everything.',
  'Dark craters near the south pole hide ice. It could give water, air and rocket fuel.',
  'Some modules could be inflatable, like a big balloon with very strong walls.',
  // From a mentor who worked on Apollo: radiation, dust and spacesuits
  'Without thick walls, about one year on the Moon would give an astronaut a whole career’s worth of radiation.',
  'Moon dust is sharp like tiny bits of glass. Apollo astronauts sneezed from it. They called it “lunar hay fever”.',
  'Moon dust wore through layers of the Apollo astronauts’ boots. It gets into everything.',
  'Apollo spacesuits had water flowing through tubes in the underwear. It kept the astronauts cool.',
  'If an Apollo suit’s oxygen failed, a spare tank gave about 30 minutes to get back to safety.',
];

export const UPGRADES = {
  battery: {
    name: 'Bigger battery',
    text: 'Store more power for the long lunar night. The new cells arrive fully charged.',
    fact: 'Real Moon bases must survive about 14 days of darkness.',
  },
  walls: {
    name: 'Regolith walls',
    text: 'Pile Moon soil on the base. Less radiation gets in.',
    fact: 'NASA studies covering Moon habitats with lunar soil for protection.',
  },
  algae: {
    name: 'Algae bioreactor',
    text: 'Tanks of tiny green algae eat CO₂ and make oxygen. A clogged filter hurts less. Uses a little power.',
    fact: 'ESA’s MELiSSA project grows spirulina algae for this. On the space station they made oxygen as fast as on Earth.',
  },
  suitport: {
    name: 'Suitports',
    text: 'Spacesuits stay docked outside. The crew climbs in through the back, so no Moon dust comes in.',
    fact: 'NASA has tested suitports on a prototype Moon rover.',
  },
  fission: {
    name: 'Fission power unit',
    text: 'A small reactor that makes power day and night.',
    fact: 'NASA’s Fission Surface Power project is designing one for the Moon.',
  },
};

/** Badges for ways of playing. Collected across missions (stored only in this browser). */
export const BADGES = {
  fixer: { title: 'Fix-it pro', text: 'Fix 3 problems in one mission.' },
  allRooms: { title: 'Every room safe', text: 'Finish a mission without a sealed room.' },
  steady: { title: 'Steady hands', text: 'No empty battery, no empty air, no dose limit.' },
  shield: { title: 'Shield smart', text: 'Block most of the radiation.' },
  team: { title: 'Team player', text: 'Ask Mission Control for advice.' },
  builder: { title: 'Builder', text: 'Build an upgrade.' },
  science: { title: 'Science star', text: 'Reach the science goal.' },
  hardHero: { title: 'Hard-mode hero', text: 'Get 2 stars or more on Hard.' },
};

/** Easter eggs: true facts when a kid taps Earth or the Sun. */
export const FUN_FACTS = {
  earth: [
    'From the Moon, Earth has phases too, just like the Moon has from Earth.',
    'Earth looks almost four times wider from the Moon than the Moon looks from Earth.',
    'Earth hardly moves in our sky, because the Moon always shows Earth the same side.',
    'A radio call from here to Earth takes a bit more than one second.',
    'Earth’s magnetic field bends most solar particles away. The Moon has no such shield.',
  ],
  // Tap Sam: the spacesuit (Apollo mentor feedback)
  suit: [
    'My spacesuit carries oxygen in a big backpack.',
    'Water flows through thin tubes in my underwear to keep me cool. The Sun is hot out there!',
    'There is a drink bag in my helmet, so I can sip water while I work outside.',
    'If my main oxygen stops, a spare tank gives me about 30 minutes to get back inside.',
    'Before I come in, I brush off the Moon dust. It is sharp and bad for our lungs.',
  ],
  sun: [
    'Sunlight takes about 8 minutes to reach the Moon.',
    'One day on the Moon, from sunrise to sunrise, lasts about 29 and a half Earth days.',
    'More than a million Earths would fit inside the Sun.',
    'A solar flare is a sudden flash of energy from the Sun. The biggest ones are X-class.',
    'The sky on the Moon is black even at noon, because there is no air to scatter the light.',
  ],
};

/**
 * The life support loop (mentor feedback: recycling, bio-based life support), shown in the air sheet.
 * Real: ISS oxygen generator (electrolysis), ISS water recovery 98% (NASA, June 2023),
 * spirulina on the ISS 2017 (ESA ArtemISS / MELiSSA). Plants and algae are helpers, not the main source.
 */
export const LIFE_LOOP = {
  intro: 'Air and water go round in a loop and get used again. Almost nothing is wasted.',
  crew: { name: 'Crew', text: 'Breathes in oxygen, breathes out CO₂ and wet air.' },
  filter: { name: 'CO₂ filter', text: 'Catches the CO₂ the crew breathes out.' },
  water: { name: 'Water recycler', text: 'Cleans used water, even sweat. 98 of every 100 drops come back.' },
  oxygen: { name: 'Oxygen machine', text: 'Splits water into oxygen with electricity. Most of our air comes from here.' },
  plants: { name: 'Plants', text: 'Help a little with oxygen, and grow fresh food. They need light.' },
  algae: { name: 'Algae', text: 'Eat CO₂ and make oxygen. Build the algae bioreactor to add them.' },
  leak: 'Air escaping through a leak is lost to space. The loop can’t get it back.',
};

/** Info sheet for each building (tap it when nothing is broken). All facts are real. */
export const ROOM_INFO = {
  solar: {
    does: 'Turns sunlight into electricity. The battery stores it for the night. Cleaning the panels means a spacewalk.',
    real: 'Real Moon panels can turn to follow the low Sun. Near the south pole, some hills get sunlight almost all the time.',
    built: 'Silicon solar cells, glass covers and light metal frames. Moon soil contains silicon, so one day panels could be made here.',
    fact: 'There is no air on the Moon, so no clouds ever block the Sun.',
  },
  greenhouse: {
    does: 'Plants grow fresh food and help clean the air a little. They need light, so LED lamps use power.',
    real: 'Astronauts on the space station have grown lettuce, radishes and chili peppers.',
    built: 'A sealed module with LED grow lights, water pipes, and trays where roots grow in water or soil.',
    fact: 'One astronaut would need about 200 space-station salad gardens to make enough oxygen. That is why machines do most of it.',
  },
  hab: {
    does: 'The crew lives, sleeps and eats here. The air and water machines are here too, with the CO₂ filter.',
    real: 'On the space station, machines recycle about 98% of the water, even sweat.',
    built: 'Metal modules launched from Earth, or inflatable ones. An inflatable test room has been on the space station since 2016.',
    fact: 'Water is heavy to launch, so every drop gets cleaned and used again.',
  },
  lab: {
    does: 'The crew studies Moon rocks, plants and how space affects people. That earns science points.',
    real: 'Apollo astronauts brought back 382 kg of Moon rocks. Scientists still study them today.',
    built: 'A metal module with microscopes, freezers and computers.',
    fact: 'Moon rocks showed that the Moon probably formed when a huge object hit the young Earth.',
  },
  shelter: {
    does: 'A small room with extra-thick walls. The crew hides here during strong solar storms.',
    real: 'NASA’s Orion capsule has a storm plan: the crew builds a shelter from bags of supplies.',
    built: 'Moon soil piled on top, or water tanks in the walls. Using Moon soil means less to launch from Earth.',
    fact: 'Water is great against radiation because it is full of light hydrogen atoms.',
  },
};

/** Why a setback happened and what to try next time (mentor feedback: learn from mistakes). */
export const LESSONS = {
  power: ({ night, shield, dust }) => ({
    title: 'The battery ran empty',
    why: night && shield ? 'It was lunar night, so the panels made no power, but the shield kept using it.'
      : night ? 'It was lunar night, so the solar panels made no power.'
        : dust ? 'Moon dust covered the panels, so they made much less power.'
          : 'The base used more power than the panels made.',
    next: night ? 'Charge up before sunset, and keep the shield low when radiation is calm.'
      : dust ? 'Clean the panels as soon as dust covers them.'
        : 'Watch the power bar, and turn the shield down when it gets low.',
  }),
  air: ({ leak, filter, noPower }) => ({
    title: 'The air ran out',
    why: leak ? `Air escaped through the leak in the ${leak}.`
      : filter ? 'The clogged filter stopped the air from being cleaned.'
        : noPower ? 'With no power, the air machines stopped.'
          : 'The base lost more air than it made.',
    next: leak || filter ? 'Fix leaks and filters right away. If you are not sure, call Earth.'
      : 'Keep some power in the battery for the air machines.',
  }),
  dose: ({ shieldLabel, sheltered }) => ({
    title: 'The crew got too much radiation',
    why: sheltered ? 'The crew had already taken a lot of radiation earlier in the storm.'
      : shieldLabel === 'Off' ? 'A strong storm hit while the shield was off and the crew was outside the shelter.'
        : shieldLabel === 'Max' ? 'A very strong storm hit while the crew was outside the shelter. Even the Max shield lets a little through.'
          : `A strong storm hit while the shield was only on ${shieldLabel}.`,
    next: 'When a big flare or particle storm is announced, raise the shield or go to the shelter right away.',
  }),
  roomLost: ({ room, days }) => ({
    title: `The ${room} was sealed`,
    why: `The leak in the ${room} was not fixed for ${days} days, so the crew closed it to save air.`,
    next: 'Tap a room with a red ! as soon as you see it. You can rebuild sealed rooms with science points.',
  }),
};

/** Difficulty levels on the start screen. The tuning is in config.js (DIFFICULTY_TUNING). */
export const DIFFICULTY = {
  easy: { label: 'Easy', text: 'Fewer problems, a bigger battery, and Mission Control answers more often. Good for your first missions.' },
  normal: { label: 'Normal', text: 'The mission as we designed it. Things go wrong now and then, and you have time to fix them.' },
  hard: { label: 'Hard', text: 'More problems, rooms get sealed sooner, weaker panels, and Mission Control is busy longer. For a real challenge.' },
};
