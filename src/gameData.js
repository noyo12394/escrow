// =============================================================================
// S.T.A.R. Earthquake Rescue Lab - game data
// -----------------------------------------------------------------------------
// All survival content lives here so the scene/UI code can stay generic.
//
// Each "card" represents one of the 12 survival actions. Every card knows:
//   - id            : stable key used across the app
//   - action        : the full action text shown on cards and tables
//   - short         : a compact label for the 3D hover scanner
//   - expertRank    : the official S.T.A.R. expert ranking (1 best .. 12 worst)
//   - hotspotId     : which 3D object opens this card's quiz (may be shared)
//   - clue          : the expert rationale revealed after answering
//   - question      : a short survival question tied to the object
//   - choices       : three answer choices, one isCorrect: true
//   - feedback      : message shown after answering (correct / incorrect)
// =============================================================================

export const SCENARIO = {
  title: 'S.T.A.R. Earthquake Rescue Lab',
  intro:
    'A magnitude 7.4 earthquake has struck. You and three coworkers are trapped ' +
    'in the basement of a damaged multi-story office building. The stairwell exit ' +
    'is buried in rubble. Electricity and telephone lines are dead, but air flows ' +
    'in through cracks in the foundation. You have a battery radio, candles, ' +
    'cleaning supplies, a first-aid kit, matches, coffee, a flashlight with spare ' +
    'batteries, chicken salad sandwiches, chips, ice trays, soda, tools, a bucket, ' +
    'bleach, a screwdriver, a wrench, and work gloves. Rank every survival action, ' +
    'then compare with the rescue experts.',
};

// The 12 action cards. expertRank is the authoritative S.T.A.R. answer key.
export const CARDS = [
  {
    id: 'utilities',
    action: 'Shut off all utilities.',
    short: 'Utility Panel',
    expertRank: 1,
    hotspotId: 'utilityPanel',
    clue:
      'Gas leaks, electrical shorts, and flooding from broken mains are the ' +
      'deadliest secondary hazards after a quake. Killing utilities first prevents ' +
      'fire and explosion, so experts rank it #1.',
    question:
      'You reach the utility panel. What is the single most urgent action right after a major earthquake?',
    choices: [
      { text: 'Shut off gas, water, and electrical mains to stop secondary hazards.', isCorrect: true },
      { text: 'Leave everything on so you keep lights and water running.', isCorrect: false },
      { text: 'Switch the main breaker on and off a few times to test it.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Ruptured gas and damaged wiring cause post-quake fires. Shutting utilities off is the top priority.',
      incorrect:
        'Not quite. Leaving gas and power on risks fire and explosion. Shutting all utilities off comes first.',
    },
  },
  {
    id: 'firstaid',
    action: 'Check for injuries and administer first-aid.',
    short: 'First-Aid Station',
    expertRank: 2,
    hotspotId: 'firstAid',
    clue:
      'People are your most valuable resource. Untreated bleeding or shock can be ' +
      'fatal within minutes, so triage and first-aid come right after making the ' +
      'space safe from utilities.',
    question:
      'A coworker is bleeding from a cut. When do you address injuries?',
    choices: [
      { text: 'Immediately after securing the area - check everyone and give first-aid.', isCorrect: true },
      { text: 'Only after you have finished signaling for rescue.', isCorrect: false },
      { text: 'Wait until morning when you can see the wounds better.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Treating injuries early prevents shock and blood loss. The team must be healthy to survive.',
      incorrect:
        'Not quite. Injuries can be life-threatening fast. First-aid is second only to securing utilities.',
    },
  },
  {
    id: 'radio',
    action: 'Assign someone to monitor the radio and listen for updates.',
    short: 'Radio Desk',
    expertRank: 3,
    hotspotId: 'radioDesk',
    clue:
      'The battery radio is your only link to the outside world. Emergency ' +
      'broadcasts tell you about aftershocks, rescue progress, and instructions. ' +
      'One person should monitor it to conserve batteries.',
    question:
      'The battery radio still works. How should the team use it?',
    choices: [
      { text: 'Assign one person to monitor emergency broadcasts and conserve batteries.', isCorrect: true },
      { text: 'Play music on it continuously to keep morale high.', isCorrect: false },
      { text: 'Turn it off to save it and never listen.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Monitored emergency broadcasts guide your decisions and warn of aftershocks.',
      incorrect:
        'Not quite. The radio is a lifeline - assign someone to monitor official updates while saving battery.',
    },
  },
  {
    id: 'water',
    action: 'Locate and secure a water supply.',
    short: 'Water Station',
    expertRank: 4,
    hotspotId: 'waterStation',
    clue:
      'A person can survive only about three days without water. Ice trays, soda, ' +
      'and the water heater tank are sources. Securing water early - before ' +
      'rationing food - keeps the team alive.',
    question:
      'You can survive much longer without food than without water. What comes first?',
    choices: [
      { text: 'Locate and secure every water source: ice trays, water heater, soda.', isCorrect: true },
      { text: 'Ignore water since rescue will surely come within hours.', isCorrect: false },
      { text: 'Pour out the ice trays to make room in the freezer.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Water is more urgent than food. Securing it early is a high priority.',
      incorrect:
        'Not quite. Dehydration kills faster than hunger. Securing water is a top survival action.',
    },
  },
  {
    id: 'signaling',
    action: 'Develop day and night signaling techniques/begin signaling immediately.',
    short: 'Signal Board',
    expertRank: 5,
    hotspotId: 'signalBoard',
    clue:
      'Rescuers must be able to find you. A flashlight at night and tapping or ' +
      'reflective markers by day, used through cracks where air enters, help ' +
      'searchers pinpoint your location safely.',
    question:
      'Air enters through cracks in the wall. How do you help rescuers find you?',
    choices: [
      { text: 'Develop day and night signals - flashlight, taps, markers at the cracks.', isCorrect: true },
      { text: 'Stay completely silent so you do not waste energy.', isCorrect: false },
      { text: 'Shout nonstop all day and night until someone hears.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Planned signaling for day and night maximizes the chance rescuers locate you.',
      incorrect:
        'Not quite. Silence or constant shouting both fail. Develop deliberate day and night signals.',
    },
  },
  {
    id: 'longterm',
    action: 'Discuss long-term survival strategies as a group.',
    short: 'Planning Table',
    expertRank: 6,
    hotspotId: 'planningTable',
    clue:
      'Once immediate dangers are handled, the group should plan together: ration ' +
      'schedules, sanitation, work shifts, and morale. Shared planning prevents ' +
      'panic and conserves resources.',
    question:
      'Immediate hazards are handled. What keeps the team functioning for days?',
    choices: [
      { text: 'Gather the group to plan rationing, sanitation, shifts, and morale.', isCorrect: true },
      { text: 'Let everyone act independently with no plan.', isCorrect: false },
      { text: 'Assign one person to make all decisions in secret.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Group planning prevents panic and stretches resources over the long wait.',
      incorrect:
        'Not quite. A shared long-term plan keeps the team coordinated and calm.',
    },
  },
  {
    id: 'eat-tonight',
    action: 'Divide the sandwiches and eat them this evening.',
    short: 'Food Station',
    expertRank: 7,
    hotspotId: 'foodStation',
    clue:
      'Chicken salad is perishable. Without refrigeration it will spoil within a ' +
      'day, so eating the sandwiches this evening avoids food poisoning - a far ' +
      'better choice than trying to ration spoiled food.',
    question:
      'The refrigerator is dead. What should you do with the chicken salad sandwiches?',
    choices: [
      { text: 'Divide and eat them this evening before the chicken salad spoils.', isCorrect: true },
      { text: 'Save them sealed for a week to ration slowly.', isCorrect: false },
      { text: 'Throw them out immediately to avoid any risk.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Perishable chicken salad must be eaten the first evening before it spoils.',
      incorrect:
        'Not quite. Chicken salad spoils fast without refrigeration - eat it tonight, do not ration it.',
    },
  },
  {
    id: 'purify',
    action: 'Purify the water source.',
    short: 'Purification Supplies',
    expertRank: 8,
    hotspotId: 'purification',
    clue:
      'Bleach can purify water (a few drops per gallon), but you must first HAVE ' +
      'water to purify. That is why purification ranks below locating water - ' +
      'useful, but not before the supply is secured.',
    question:
      'You have bleach and a bucket. How does purification fit your plan?',
    choices: [
      { text: 'Purify water you have already located, using a few drops of bleach.', isCorrect: true },
      { text: 'Drink the bleach straight to kill any germs inside you.', isCorrect: false },
      { text: 'Purify first, before bothering to find any water.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Purification matters, but only after you have secured a water supply to treat.',
      incorrect:
        'Not quite. Never drink bleach. Purify water you have already secured - find the water first.',
    },
  },
  {
    id: 'pipes',
    action: 'Pound the pipes with the steel wrench.',
    short: 'Pipes',
    expertRank: 9,
    hotspotId: 'pipes',
    clue:
      'Tapping pipes carries sound far through a building and is a recognized ' +
      'rescue signal - but it is lower priority than safety, water, and food, and ' +
      'should be done in patterns to save energy.',
    question:
      'Sound travels through metal. How useful is pounding the pipes?',
    choices: [
      { text: 'A helpful secondary signal - tap in patterns, but after higher priorities.', isCorrect: true },
      { text: 'The most important thing to do - pound them nonstop all day.', isCorrect: false },
      { text: 'Useless - sound never travels through pipes.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Pounding pipes signals rescuers, but ranks below safety, water, and food.',
      incorrect:
        'Not quite. It helps as a signal, but it is a mid-priority action, not the top one.',
    },
  },
  {
    id: 'ration-days',
    action: 'Divide the sandwiches and ration them over the next few days.',
    short: 'Food Station',
    expertRank: 10,
    hotspotId: 'foodStation',
    clue:
      'Rationing the chicken salad over several days guarantees it spoils and ' +
      'causes food poisoning. This is why experts rank rationing the perishable ' +
      'sandwiches near the bottom of the list.',
    question:
      'Should the perishable chicken salad sandwiches be rationed across several days?',
    choices: [
      { text: 'No - rationing spoiled chicken salad causes food poisoning.', isCorrect: true },
      { text: 'Yes - rationing always makes food last longer and safer.', isCorrect: false },
      { text: 'Yes - cold basements keep chicken salad fresh for a week.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Rationing perishable sandwiches risks food poisoning - a low-ranked choice.',
      incorrect:
        'Not quite. Rationing spoiled chicken salad is dangerous; this is one of the worst options.',
    },
  },
  {
    id: 'rubble',
    action: 'Attempt to remove the rubble from the entrance from the first floor.',
    short: 'Blocked Stairwell',
    expertRank: 11,
    hotspotId: 'rubble',
    clue:
      'Digging at the rubble can trigger a collapse of the already-damaged ' +
      'structure above you, burying the team. It wastes energy and is extremely ' +
      'dangerous, so experts rank it second-to-last.',
    question:
      'The stairwell is buried. Should the team dig out the rubble themselves?',
    choices: [
      { text: 'No - disturbing rubble can collapse the damaged structure on you.', isCorrect: true },
      { text: 'Yes - dig hard and fast to escape before aftershocks.', isCorrect: false },
      { text: 'Yes - pull out the largest support beams first.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. Removing rubble risks a deadly collapse - leave it to trained rescuers.',
      incorrect:
        'Not quite. Digging into rubble can bring the damaged building down. It is a very dangerous choice.',
    },
  },
  {
    id: 'candles',
    action: 'Light the candles so you can see and rescuers will be able to locate you.',
    short: 'Candle Shelf',
    expertRank: 12,
    hotspotId: 'candleShelf',
    clue:
      'An open flame in a building that may be leaking gas is the most dangerous ' +
      'action of all - it can cause an explosion. With a flashlight available, ' +
      'candles are never worth the risk, so they rank dead last.',
    question:
      'It is dark. Should you light the candles to see and signal?',
    choices: [
      { text: 'No - an open flame can ignite leaking gas. Use the flashlight instead.', isCorrect: true },
      { text: 'Yes - candles are the safest light source in a basement.', isCorrect: false },
      { text: 'Yes - light all of them at once for maximum brightness.', isCorrect: false },
    ],
    feedback: {
      correct:
        'Correct. With possible gas leaks, an open flame could cause an explosion. Candles rank last.',
      incorrect:
        'Not quite. Open flame plus possible gas is the most dangerous action - use the flashlight, not candles.',
    },
  },
];

// The starting order shown on the ranking board (the worksheet table order).
// Values are card ids in the order they should appear before the player sorts.
export const INITIAL_BOARD_ORDER = [
  'rubble',
  'ration-days',
  'candles',
  'water',
  'eat-tonight',
  'longterm',
  'pipes',
  'radio',
  'firstaid',
  'utilities',
  'signaling',
  'purify',
];

// Convenience lookup: id -> card
export const CARD_BY_ID = CARDS.reduce((map, card) => {
  map[card.id] = card;
  return map;
}, {});

// Hotspot metadata for the 3D scene. position is [x, y, z] in world space.
// label is shown in the hover scanner. cardId links the hotspot to its quiz.
export const HOTSPOTS = [
  { id: 'utilityPanel', cardId: 'utilities', label: 'Utility Panel', position: [-7.4, 2.0, -3.0], color: 0x49d0ff },
  { id: 'firstAid', cardId: 'firstaid', label: 'First-Aid Station', position: [-7.4, 1.6, 2.5], color: 0xff5a6e },
  { id: 'radioDesk', cardId: 'radio', label: 'Radio Desk', position: [-3.0, 1.1, -6.6], color: 0xffd84d },
  { id: 'waterStation', cardId: 'water', label: 'Water Station', position: [3.0, 1.2, -6.6], color: 0x4dd2ff },
  { id: 'signalBoard', cardId: 'signaling', label: 'Signal Board', position: [7.4, 1.9, -1.5], color: 0x8affc1 },
  { id: 'planningTable', cardId: 'longterm', label: 'Planning Table', position: [0.0, 1.1, 1.0], color: 0xc9a0ff },
  { id: 'foodStation', cardId: 'eat-tonight', label: 'Refrigerator / Food Station', position: [7.4, 1.6, 3.5], color: 0xffa24d },
  { id: 'purification', cardId: 'purify', label: 'Purification Supplies', position: [3.4, 1.0, 6.4], color: 0x6effe0 },
  { id: 'pipes', cardId: 'pipes', label: 'Overhead Pipes', position: [0.0, 4.1, -3.0], color: 0xb0b8c4 },
  { id: 'rubble', cardId: 'rubble', label: 'Blocked Stairwell', position: [-3.2, 1.8, 6.6], color: 0xff7a3c },
  { id: 'candleShelf', cardId: 'candles', label: 'Candle Shelf', position: [-7.4, 1.1, 5.5], color: 0xffe08a },
];
