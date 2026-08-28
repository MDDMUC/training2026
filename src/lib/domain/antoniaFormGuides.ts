// Form guides for Antonia only. Martin never loads this UI.
// Keys are matched against prescribed exercise names (fuzzy).

export interface FormImage {
  src: string;
  alt: string;
  caption: string;
}

export interface FormGuide {
  key: string;
  setup: string[];
  movement: string[];
  cues: string[];
  avoid: string[];
  images: FormImage[];
}

const IMG = '/form-guides/antonia';

const GUIDES: Record<string, FormGuide> = {
  mobility: {
    key: 'mobility',
    setup: [
      'Clear a couple of metres of floor. You need a wall and enough room to swing your arms.',
      'This block is preparation, not work. Move slowly. Breathing stays quiet.',
      'If a shoulder or the neck nags, skip that drill and keep the rest.'
    ],
    movement: [
      'Arm circles: 10 forward, 10 back, arms long, small then bigger.',
      'Scapular wall slides: back, ribs, and head against the wall. Elbows at 90°. Slide the arms up as far as the wall contact allows, then down.',
      'Banded dislocates: wide grip on a band or stick, pass it from thighs to behind you and back. If it jams, go wider.',
      'Cat-cow: on all fours, round the spine up, then let the chest drop. Eight slow cycles.',
      'The long flow adds extra time in each position. Still not a workout — stay below a sweat.'
    ],
    cues: [
      'Slow is correct.',
      'Keep the neck long. Do not crank the head back on cow.',
      'Wall slides: if the low back leaves the wall, you went too far.'
    ],
    avoid: [
      'Do not stretch into sharp pain.',
      'Do not rush this to get to the pull-ups. The warm-up is the first set.'
    ],
    images: [
      {
        src: `${IMG}/mobility-ready.jpg`,
        alt: 'Athlete standing ready in a home gym under a pull-up bar',
        caption: 'Start standing. You will use the wall, the floor, and the bar in this flow.'
      },
      {
        src: `${IMG}/mobility-wall.jpg`,
        alt: 'Athlete with both hands on a wall, arms straight, preparing wall slides or wall push-ups',
        caption: 'Wall contact: used for wall slides in the warm-up, and for the easiest push-up variant later.'
      },
      {
        src: `${IMG}/mobility-floor.jpg`,
        alt: 'Athlete on all fours on the floor, the start of cat-cow',
        caption: 'Cat-cow starts here. Round the spine up, then let the chest drop. Eight slow cycles.'
      }
    ]
  },
  'scapular-pull-ups': {
    key: 'scapular-pull-ups',
    setup: [
      'Hang from the bar with a shoulder-width overhand grip. Thumbs around the bar.',
      'Feet off the floor. If you cannot hang, stand on a box so the knees are bent and only some weight is on the bar.',
      'Arms stay completely straight for the whole drill. This is not a pull-up.'
    ],
    movement: [
      'Start in a dead hang: shoulders shrugged up toward the ears, body still.',
      'Without bending the elbows, pull the shoulder blades down and back. The body lifts about 5 cm.',
      'Hold one second at the top. You should feel the muscles under the armpits and along the sides of the back.',
      'Lower with control back to the shrugged hang. That is one rep.'
    ],
    cues: [
      'Elbows locked. If they bend, it became a pull-up.',
      'Think “pockets” — put the shoulder blades in your back pockets.',
      'Quiet legs. No kicking.'
    ],
    avoid: [
      'Do not swing or kip.',
      'Do not shrug the shoulders up at the “top” — that is the start, not the finish.',
      'Stop if the elbows or the front of the shoulder pinches.'
    ],
    images: [
      {
        src: `${IMG}/hang-dead.jpg`,
        alt: 'Athlete in a straight-arm dead hang from a pull-up bar, feet off the floor',
        caption: 'Dead hang. Arms long, feet off the floor. This is the start of every scapular pull-up.'
      },
      {
        src: `${IMG}/hang-pull.jpg`,
        alt: 'Athlete pulling on a bar with bent elbows, showing the direction of a pull from the hang',
        caption: 'If the elbows bend, you have left the scapular drill. Keep them straight; the lift is only a few centimetres.'
      }
    ]
  },
  'band-assisted-pull-ups': {
    key: 'band-assisted-pull-ups',
    setup: [
      'Loop a thick band over the bar. Pull the hanging loop down.',
      'Step one foot into the loop, or rest one knee in it (more help). Take the bar with a shoulder-width overhand grip.',
      'Let the unused leg hang or lightly rest. You should be able to reach a dead hang with the band stretched.'
    ],
    movement: [
      'Pack the shoulders (same as the scapular pull-up), then bend the elbows and pull the chest toward the bar.',
      'Chin clears the bar. Pause a beat. Do not throw the head back.',
      'Lower for about two seconds to a straight-arm hang. That is one rep.',
      'Thicker band = more help. Thinner band = less help. Knee in the loop is easier than foot in the loop.'
    ],
    cues: [
      'Pull the elbows down toward the ribs, not out to the sides.',
      'Legs stay quiet. The band does the extra work, not a kick.',
      'If the last reps lose the chin-over, stop there. Form first.'
    ],
    avoid: [
      'Do not bounce out of the bottom.',
      'Do not let the band snap you up. You pull; the band only lightens the body.',
      'Do not start from a partial hang. Straighten the arms each rep unless the session says otherwise.'
    ],
    images: [
      {
        src: `${IMG}/banded-bottom.jpg`,
        alt: 'Athlete hanging from a pull-up bar with a thick band and one knee in the loop, arms long',
        caption: 'Setup. Band over the bar, one knee in the loop, arms long. This is the bottom of every rep.'
      },
      {
        src: `${IMG}/banded-top.jpg`,
        alt: 'Athlete at the top of a band-assisted pull-up with chin near the bar and a band under one knee',
        caption: 'Top. Chin to or over the bar, elbows in, band still loaded. Pause, then lower for two seconds.'
      }
    ]
  },
  'inverted-rows': {
    key: 'inverted-rows',
    setup: [
      'Use a sturdy bar at about hip height — a Smith bar, rings, or a table you can lie under if it will take your weight.',
      'Hold the bar, walk the feet forward, and make a straight line from head to heels. The more horizontal you are, the harder it is.',
      'Beginner: raise the bar or bend the knees. Harder: walk the feet farther under, or elevate the feet.'
    ],
    movement: [
      'Start with arms straight, body rigid like a plank turned over.',
      'Pull the chest to the bar. Squeeze the shoulder blades together at the top.',
      'Lower for two seconds to straight arms. That is one rep.',
      'Two seconds up, two seconds down is the default tempo.'
    ],
    cues: [
      'Hips stay in line. If they sag, shorten the leverage (bend the knees).',
      'Neck stays long. Look at the bar, not the ceiling behind you.',
      'Pull with the back, not a head-butt toward the bar.'
    ],
    avoid: [
      'Do not let the hips pike or drop.',
      'Do not pull only with the arms while the shoulder blades stay spread.',
      'If the set-up bar is too high, this becomes a very steep row — that is harder, not easier.'
    ],
    images: [
      {
        src: `${IMG}/row-start.jpg`,
        alt: 'Athlete in a straight-body inverted row start, hanging under a bar with arms extended',
        caption: 'Start. Body one line, arms long. Raise the bar or bend the knees if this angle is too steep.'
      },
      {
        src: `${IMG}/row-top.jpg`,
        alt: 'Athlete pulling her chest toward a bar in an inverted row, elbows bent',
        caption: 'Top. Chest to the bar, shoulder blades squeezed. Lower slowly to straight arms.'
      }
    ]
  },
  'push-ups': {
    key: 'push-ups',
    setup: [
      'Pick the hardest variant you can do for the prescribed reps with a straight body: wall → hands on a bench → knees → full.',
      'Hands under the shoulders, or slightly wider. Fingers forward.',
      'The body is a plank: head, ribs, hips, and heels in one line.'
    ],
    movement: [
      'Lower until the chest nearly touches the floor (or the wall / bench). Two seconds down.',
      'Elbows about 45° from the torso — not flared to 90°, not glued to the ribs.',
      'Press up to straight arms without letting the hips pike. Two seconds up.',
      'Every rep uses the same range. If range shortens, drop to an easier variant.'
    ],
    cues: [
      'Screw the hands lightly into the floor (outward) to set the shoulders.',
      'Squeeze the glutes so the hips stay in line.',
      'The chest moves, not the chin.'
    ],
    avoid: [
      'Do not let the low back sag.',
      'Do not only dip the head. The chest has to travel.',
      'Do not bounce off the floor.'
    ],
    images: [
      {
        src: `${IMG}/push-top.jpg`,
        alt: 'Athlete in a high plank, the start and finish of a push-up',
        caption: 'Top. High plank, arms straight, body one line. This is the start and the finish of each rep.'
      },
      {
        src: `${IMG}/push-low.jpg`,
        alt: 'Athlete lowering in a push-up with elbows bending, body still in a line',
        caption: 'Lower until the elbows bend and the chest approaches the floor. Keep the line from head to heels.'
      },
      {
        src: `${IMG}/mobility-wall.jpg`,
        alt: 'Athlete with hands on a wall, the easiest push-up variant',
        caption: 'Wall variant. Same rules: body one line, chest toward the wall. Step the feet back to make it harder.'
      }
    ]
  },
  'push-up-plus': {
    key: 'push-up-plus',
    setup: [
      'Same as a push-up, usually from knees or a full plank — choose a variant you can hold at the top with control.',
      'The “plus” happens at the top, after the arms are already straight.'
    ],
    movement: [
      'Do a push-up to straight arms.',
      'Then push the floor away extra: round the upper back slightly and spread the shoulder blades (protraction). That extra push is the plus.',
      'Let the shoulder blades come back together, then lower into the next push-up, or drop the knees and rest if the session is plus-only holds.'
    ],
    cues: [
      'The extra motion is small. Think “reach the floor farther away.”',
      'Hips stay in the plank. Do not pike to fake the round of the upper back.',
      'This is for the serratus (the muscles along the ribs), not for more chest work.'
    ],
    avoid: [
      'Do not shrug the shoulders to the ears.',
      'Do not hyperextend the elbows.',
      'If the wrists complain, make fists or use handles.'
    ],
    images: [
      {
        src: `${IMG}/push-top.jpg`,
        alt: 'Athlete locked out at the top of a push-up, the position for the plus',
        caption: 'Lock the elbows first. From here, push the floor away another centimetre and spread the shoulder blades.'
      }
    ]
  },
  'band-external-rotation': {
    key: 'band-external-rotation',
    setup: [
      'Anchor a band at elbow height to your side. Stand with the working elbow pinned to the ribs, forearm across the belly, holding the band.',
      'There should already be a little tension at the start. Step away until there is.',
      'This is a strength dose, not a warm-up flick. Choose a band where the last two reps of ten are honest.'
    ],
    movement: [
      'Keep the elbow glued to the ribs. Rotate the forearm out, away from the belly, until it points forward or slightly out.',
      'Pause. Return slowly.',
      'Finish the set, then switch sides. Left and right both get the same reps.'
    ],
    cues: [
      'Elbow stays on the ribs the whole time. If it drifts, the weight is too much or the set-up is too far from the anchor.',
      'Wrist stays straight. You are turning the upper arm, not waving the hand.',
      'Ribs stay down. Do not lean away from the band.'
    ],
    avoid: [
      'Do not let the elbow float off the body.',
      'Do not use a band so heavy that you have to rotate the whole torso.',
      'Stop if the front of the shoulder pinches — drop to a lighter band and a smaller arc.'
    ],
    images: [
      {
        src: `${IMG}/er.jpg`,
        alt: 'Athlete rotating a forearm outward against a band anchored at the side',
        caption: 'Band in the hand, elbow toward the ribs, forearm rotating out. Keep the elbow lower if it starts to float.'
      }
    ]
  },
  'hollow-body-hold': {
    key: 'hollow-body-hold',
    setup: [
      'Lie on your back. Press the low back into the floor before anything else. That contact is non-negotiable.',
      'Arms reach overhead, legs long. If that is too hard, bend the knees or bring the arms by the sides.'
    ],
    movement: [
      'Lift the legs and the shoulders a little so the body is a shallow banana, low back still pressed down.',
      'Hold for the prescribed time. Breathe into the ribs. Do not hold your breath for the whole set.',
      'If the low back pops off the floor, raise the legs (easier) until the back returns, then continue.'
    ],
    cues: [
      'Low back glued down beats pretty legs.',
      'Squeeze the glutes lightly and point the toes.',
      'Eyes on the ceiling, not tucked into the chest.'
    ],
    avoid: [
      'Do not let the low back arch.',
      'Do not crank the neck.',
      'Do not turn this into a sit-up.'
    ],
    images: [
      {
        src: `${IMG}/hollow.jpg`,
        alt: 'Athlete in a hollow body hold on the floor, shoulders and legs lifted, low back down',
        caption: 'Low back pressed to the floor. Shoulders and legs lifted. If the back lifts, bring the legs higher.'
      }
    ]
  },
  'prone-y-raise': {
    key: 'prone-y-raise',
    setup: [
      'Lie face-down on the floor or a bench. Forehead on a folded towel. Thumbs point up.',
      'Arms make a Y in front of you, about 45° from the head. Light (or no) weights — 1 kg is plenty.'
    ],
    movement: [
      'Set the shoulder blades down the back. Lift the arms a few centimetres. Hold one second.',
      'Lower slowly. The chest and the forehead stay down. Only the arms move.',
      'If you need to lift the chest to get the arms up, the load is too heavy. Drop the weights.'
    ],
    cues: [
      'Thumbs up.',
      'Think “long neck, long arms.”',
      'The work is in the lower traps, between the shoulder blades, not in the upper neck.'
    ],
    avoid: [
      'Do not turn this into a cobra or a back extension. Chest stays down.',
      'Do not shrug toward the ears.',
      'Do not swing the arms.'
    ],
    images: [
      {
        src: `${IMG}/prone-y.jpg`,
        alt: 'Athlete lying face-down with arms lifted in a Y, thumbs up',
        caption: 'Arms in a Y, thumbs up. Keep the chest closer to the floor than this — only the arms should lift.'
      }
    ]
  },
  'active-dead-hang': {
    key: 'active-dead-hang',
    setup: [
      'Overhand grip, shoulder-width or a little wider. Thumbs around the bar.',
      'Step or jump to a hang. Feet off the floor. Use a box if the bar is high.'
    ],
    movement: [
      'An active hang means the shoulders are packed: blades down and back, ears away from the shoulders, arms still straight.',
      'Hold for the prescribed time. Breathe. Legs can be slightly in front of the body, quiet.',
      'To rest, step onto a box — do not drop off a high bar.'
    ],
    cues: [
      'Long neck. Shoulders away from the ears.',
      'Grip the bar as if you could leave fingerprints in it.',
      'This is the same top position as the scapular pull-up, held for time.'
    ],
    avoid: [
      'Do not go fully passive and hang off the joint capsules if the session says “active.”',
      'Do not swing.',
      'Come down if the grip or a shoulder complains — that is a successful stop, not a failed set.'
    ],
    images: [
      {
        src: `${IMG}/hang-dead.jpg`,
        alt: 'Athlete hanging from a pull-up bar with straight arms and feet off the floor',
        caption: 'Hang with straight arms. For an active hang, pull the shoulders down away from the ears and hold.'
      }
    ]
  },
  'eccentric-pull-ups': {
    key: 'eccentric-pull-ups',
    setup: [
      'You only need to control the lowering. Get to the top however is honest: a box, a jump, or a band, then take the band off if the session says so.',
      'Chin starts over the bar, elbows in, shoulders packed.'
    ],
    movement: [
      'From the top, lower as slowly as prescribed (often 3–5 seconds, longer on “slowest” / “long descent” days).',
      'Keep the body tight. Legs together, no pike, no swing.',
      'Finish at a straight-arm hang, then use the box or band to get back to the top. The lowering is the work; the way up is just a reset.',
      'If you collapse in the last second, shorten the next lowering or use a little band help.'
    ],
    cues: [
      'Fight the last third. That is where the strength is built.',
      'Eyes on the horizon, not the ceiling.',
      'Exhale on the way down.'
    ],
    avoid: [
      'Do not drop the last 20 cm.',
      'Do not turn the reset into another pulling set — save the arms for the negatives.',
      'Do not shrug the shoulders into the ears on the way down.'
    ],
    images: [
      {
        src: `${IMG}/hang-pull.jpg`,
        alt: 'Athlete with chin near a pull-up bar, the start of an eccentric',
        caption: 'Start at the top, chin to the bar. This is where every negative begins.'
      },
      {
        src: `${IMG}/hang-dead.jpg`,
        alt: 'Athlete in a straight-arm hang, the finish of an eccentric pull-up',
        caption: 'Finish at a straight-arm hang, slowly. Then step to a box to get back to the top.'
      }
    ]
  },
  'unassisted-pull-up': {
    key: 'unassisted-pull-up',
    setup: [
      'No band. Overhand grip, just outside the shoulders. Dead hang first.',
      'These attempts are quality, not a grind-for-ten. Rest fully between tries. If you are not fresh, skip the extra attempts.'
    ],
    movement: [
      'Pack the shoulders, then pull. Chin over the bar, or as high as you get without kicking.',
      'Lower with control. A slow miss is still useful. A kipping miss is not the goal of this plan.',
      'On test days: one honest attempt, full rest, next attempt only if the first was close.'
    ],
    cues: [
      'The first centimetre is the scapular pull-up you already trained. Do that, then bend the elbows.',
      'Drive the elbows down.',
      'Breathe at the bottom. Do not hold a huge breath and stall.'
    ],
    avoid: [
      'Do not kip. This block is a strict pull-up.',
      'Do not grind a second ugly rep if the session is “attempts.”',
      'Do not jump from a high box into a half-rep and count it.'
    ],
    images: [
      {
        src: `${IMG}/hang-dead.jpg`,
        alt: 'Athlete in a dead hang, the start of an unassisted pull-up',
        caption: 'Start from a still dead hang. Pack the shoulders first.'
      },
      {
        src: `${IMG}/hang-pull.jpg`,
        alt: 'Athlete pulling on a bar with chin approaching the bar, unassisted',
        caption: 'Pull until the chin clears the bar. No kick. Lower with control even if the rep does not finish.'
      }
    ]
  },
  recruitment: {
    key: 'recruitment',
    setup: [
      'This is a primer, not a max set. A few easy scapular pull-ups and a few easy banded pulls to wake the pattern up.',
      'Use a band that feels too easy. You should finish fresher than you started.'
    ],
    movement: [
      'Two or three scapular pull-ups, slow.',
      'Two or three band-assisted pull-ups, easy, full range.',
      'Then rest the time written on the card. The hard work comes after this, or this is the whole session on a light day.'
    ],
    cues: [
      'Quality only. If it feels like a working set, the band is too thin.',
      'Same form rules as the main pull-up: packed shoulders, chin path, slow down.'
    ],
    avoid: [
      'Do not turn the recruitment into a personal-best attempt.',
      'Do not skip it to “save energy.” It is the warm-up for the nervous system.'
    ],
    images: [
      {
        src: `${IMG}/hang-dead.jpg`,
        alt: 'Athlete hanging from a bar to begin recruitment pulls',
        caption: 'A few easy hangs and scaps first.'
      },
      {
        src: `${IMG}/banded-top.jpg`,
        alt: 'Athlete at the top of an easy band-assisted pull-up',
        caption: 'Then a couple of easy banded reps. Full range, no grind.'
      }
    ]
  }
};

type Matcher = { test: (name: string) => boolean; key: keyof typeof GUIDES };

const MATCHERS: Matcher[] = [
  { test: (n) => /recruitment/.test(n), key: 'recruitment' },
  { test: (n) => /unassisted pull-up|benchmark test/.test(n), key: 'unassisted-pull-up' },
  { test: (n) => /eccentric|negative|descent/.test(n), key: 'eccentric-pull-ups' },
  { test: (n) => /scapular pull-up/.test(n), key: 'scapular-pull-ups' },
  { test: (n) => /band-assisted pull-up|banded pull-up/.test(n), key: 'band-assisted-pull-ups' },
  { test: (n) => /inverted row/.test(n), key: 'inverted-rows' },
  { test: (n) => /push-up plus|push-up-plus/.test(n), key: 'push-up-plus' },
  { test: (n) => /push-up/.test(n), key: 'push-ups' },
  { test: (n) => /external rotation/.test(n), key: 'band-external-rotation' },
  { test: (n) => /hollow/.test(n), key: 'hollow-body-hold' },
  { test: (n) => /prone y/.test(n), key: 'prone-y-raise' },
  { test: (n) => /dead hang/.test(n), key: 'active-dead-hang' },
  {
    test: (n) =>
      /warm-up|mobility|cool-down|cool down|celebration/.test(n),
    key: 'mobility'
  }
];

export function formGuideFor(exerciseName: string): FormGuide | null {
  const n = exerciseName.toLowerCase();
  for (const m of MATCHERS) {
    if (m.test(n)) return GUIDES[m.key];
  }
  return null;
}

export function formGuideKeys(): string[] {
  return Object.keys(GUIDES);
}
