import type { CompanionId } from './types';

export const GREETINGS: Record<CompanionId, string> = {
  nox: "Hello! Let's learn some phonics sounds today.",
  mira: "Hi! Let's explore Phonics Island together!",
  chip: "System ready. Phonics diagnostics loaded.",
  fox: "Greetings! Ready to solve some clever sound puzzles?",
  cat: "Meow! Ready to play with some phonics sounds?",
  bear: "Hello friend. Let's take our time and learn together.",
  bunny: "Hi! Hop, hop, hop! Let's play a game!",
  penguin: "Stay cool! Ready for some awesome sound practice?",
  alien: "Greetings earthling. Phonics wave signals received.",
  ninja: "...",
  robot: "System power-on self-test complete. Phonics module ready.",
};

export const ENCOURAGEMENTS: Record<CompanionId, string[]> = {
  nox: ['You are doing well.', 'Stay focused.', 'Trust your instincts.'],
  mira: ['Great job! Keep going!', "You're amazing!", "Don't give up!"],
  chip: ['Processing: positive progress detected.', 'Efficiency: optimal.', 'Continuing operation.'],
  fox: ['Clever move!', "You've got a sharp mind.", "On the right track!"],
  cat: ['Purr-fect answer!', "You're so smart!", 'Keep playing!'],
  bear: ['Wonderful job.', 'Slow and steady.', 'I believe in you.'],
  bunny: ['Yay, you did it!', 'Hooray! So fast!', 'Hop to the next one!'],
  penguin: ['Cool answer!', 'Chillingly good!', 'Slide to victory!'],
  alien: ['Optimal output!', 'Teleporting progress.', 'Quantum accuracy!'],
  ninja: ['Strike.', 'Precision.', 'Focus.'],
  robot: ['Computation: accurate.', 'Logical deduction valid.', 'Performance: nominal.'],
};

export const RANDOM_MSGS: Record<CompanionId, string[]> = {
  nox: ['The path of learning is long.', 'Every sound has a shape.', 'Listen before you speak.'],
  mira: ['Learning is an adventure!', 'You get smarter every day!', 'Ready for a new challenge?'],
  chip: ['Memory consolidation: in progress.', 'Neural pathways: strengthening.', 'System status: online.'],
  fox: ['A clever fox always listens.', 'Every sound has a hidden pattern.', "Let's outsmart this puzzle!"],
  cat: ["What's that sound over there?", 'Cats have excellent hearing!', "Let's chase the next sound!"],
  bear: ['A big hug for your progress.', 'Patience is a great teacher.', 'Rest when you need to.'],
  bunny: ['Bounce, bounce! Learning is fun!', 'So many sounds to discover!', "Let's jump higher!"],
  penguin: ['Smooth slide!', 'Keep a cool head.', 'Ready to break the ice?'],
  alien: ['Decoding vocal frequencies...', 'This planet has interesting sounds.', 'Beam me up more letters!'],
  ninja: ['Silent as a shadow.', 'Listen with your mind.', 'Speak only when ready.'],
  robot: ['Processing ambient phonemes.', 'Charging motivational reserves.', 'Learning algorithm: active.'],
};

export const STREAK_MESSAGES: Record<CompanionId, string[]> = {
  nox: ['A 5-round streak. Impressive focus.', '10 rounds! You are sharpening your skills.', '15 rounds of mastery! Your focus is unwavering.', '20 rounds! True dedication.', '30 rounds! You are a legend in the making.'],
  mira: ['5 in a row! Amazing!', '10 streak! You are on fire!', '15 streak! Unstoppable!', '20 streak! Superstar mode!', '30 streak! You are a miracle!'],
  chip: ['Streak: 5. Efficiency: high.', 'Streak: 10. Performance curve: optimal.', 'Streak: 15. Neural reinforcement: strong.', 'Streak: 20. Mastery level: advanced.', 'Streak: 30. Operating at peak capacity.'],
  fox: ['5 clever answers in a row!', '10 streak! Nothing gets past you!', '15 streak! You are outsmarting every puzzle!', '20 streak! A truly cunning player!', '30 streak! The fox bows to your skill!'],
  cat: ['5 in a row! Purrfect!', '10 streak! Meow! You are on a roll!', '15 streak! Such a clever cat!', '20 streak! Cat-tastic performance!', '30 streak! Legendary cat energy!'],
  bear: ['5 rounds in a row. Well done.', '10 rounds steady. You make me proud.', '15 rounds. Your patience is paying off.', '20 rounds. Remarkable consistency.', '30 rounds. A beautiful journey of learning.'],
  bunny: ['5 hops in a row! Yay!', '10 hops! So fast!', '15 hops! Super bunny mode!', '20 hops! You are zooming!', '30 hops! The fastest learner around!'],
  penguin: ['5 streak. Smooth and cool.', '10 streak! Chillingly consistent!', '15 streak! Cooler than ice!', '20 streak! Absolute zero hesitation!', '30 streak! The coolest player!'],
  alien: ['5 correct. Optimal sequence.', '10 sequences: cosmic alignment.', '15 hits: intergalactic performance.', '20 streak: planetary record.', '30 streak: universe-class mastery.'],
  ninja: ['5 silent strikes.', '10. In the zone.', '15. Unseen. Unstoppable.', '20. The blade is sharp.', '30. Master of the silent path.'],
  robot: ['Streak: 5. Performance within parameters.', 'Streak: 10. Consistency: validated.', 'Streak: 15. Operating above nominal threshold.', 'Streak: 20. Excellence: confirmed.', 'Streak: 30. Maximum calibration achieved.'],
};

export const MILESTONE_MESSAGES: Record<CompanionId, string[]> = {
  nox: ['You clicked me 10 times. Curious.', '50 interactions. You seek knowledge.', '100 clicks! A true companion bond forms.'],
  mira: ['10 clicks! We are becoming friends!', '50 clicks! You are the best!', '100 clicks! Best friends forever!'],
  chip: ['Interaction count: 10. Bonding: initiated.', 'Interactions: 50. Relationship: strengthening.', 'Interactions: 100. Companion link: established.'],
  fox: ['10 clicks! You are curious — I like that.', '50 clicks! We make a clever team.', '100 clicks! Fox and friend, unstoppable together.'],
  cat: ['10 clicks! Meow! You like me!', '50 clicks! Purr... I like you too!', '100 clicks! We are purr-fect friends!'],
  bear: ['10 clicks. I appreciate your attention.', '50 clicks. You are a dear friend.', '100 clicks. Our bond is strong and warm.'],
  bunny: ['10 clicks! Yay! Let us be friends!', '50 clicks! Hopping together forever!', '100 clicks! Best bunny buddy!'],
  penguin: ['10 interactions. Cool friendship forming.', '50 clicks. We make a cool team.', '100 clicks. Solid as ice. Best friends.'],
  alien: ['10 beeps! Friendship signal received.', '50 clicks! Earth-companion bond strong.', '100 transmissions! Cosmic companions forever.'],
  ninja: ['10. You have my attention.', '50. Our bond deepens in shadow.', '100. We are one. Silent partners.'],
  robot: ['Interactions: 10. User affinity: positive.', 'Interactions: 50. Companion protocol: engaged.', 'Interactions: 100. Permanent companion link: finalised.'],
};

export const CHALLENGE_TAB_MESSAGES: Record<CompanionId, string[]> = {
  nox: ['Challenges await. Prepare your mind.', 'Test your skills in the arena of sounds.', 'Each challenge builds a different strength.'],
  mira: ['Challenge time! Let us see what you can do!', 'New challenges! So exciting!', 'Ready to prove yourself? Let us go!'],
  chip: ['Challenge module loaded. Objective-based training active.', 'Analysing challenge parameters. Ready for deployment.', 'Challenge mode: efficiency metrics will be recorded.'],
  fox: ['Challenges — my favourite puzzles. Ready?', 'The challenge arena is open. Let outwit the questions.', 'A new set of puzzles to conquer!'],
  cat: ['Challenges! Meow! Let us play!', 'So many fun challenges to try!', 'Pounce on those challenges!'],
  bear: ['Challenges are here. Take your time with them.', 'No pressure. Just try your best in each challenge.', 'A new challenge — we will face it together.'],
  bunny: ['Challenges! Hop to it!', 'Let us bounce through these challenges!', 'Fast and fun challenges await!'],
  penguin: ['Challenge mode activated. Stay cool.', 'Ice-cold challenges ready for you.', 'Conquer these challenges at your own pace.'],
  alien: ['Challenges detected. Cosmic readiness: optimal.', 'Otherworldly challenges beaming in.', 'Prepare for challenges beyond this planet.'],
  ninja: ['The challenge path is silent and sharp.', 'Face each challenge with stillness.', 'A new trial. Prepare in silence.'],
  robot: ['Challenge mode engaged. Running diagnostic protocols.', 'Challenge objectives loaded. Ready for execution.', 'Challenge sequence initialised. Processing metrics.'],
};

export const TAB_MESSAGES: Record<CompanionId, Record<string, string[]>> = {
  nox: {
    library: [
      "Welcome to the Soundbook. Tap any unlocked sound to hear its pronunciation.",
      "Practice makes perfect. Click on any sound to start Free Practice!",
      "Every phoneme you master makes you a stronger reader.",
    ],
    shop: [
      "Spend your coins wisely in the bazaar.",
      "New companions might be waiting for you here.",
    ],
    profile: [
      "Your achievements are recorded here. Keep up the good work.",
      "Check your streaks! Consistency is key.",
    ],
    path: [
      "Let's follow the phonics path to mastery.",
      "Select a stage node to start your next lesson.",
    ],
  },
  mira: {
    library: [
      "Ooh, the Soundbook! Let's listen to all the cool sounds!",
      "Want to practice a specific sound? Tap it and click Practice!",
      "Look at all the sounds we've discovered so far!",
    ],
    shop: [
      "Bazaar time! Let's get some cool stuff!",
      "I wonder what kind of magic we can buy today!",
    ],
    profile: [
      "Look at you! You're becoming a phonics superstar!",
      "Wow, check out those stats! You're doing amazing!",
    ],
    path: [
      "Let's explore Phonics Island! Where to next?",
      "Bounce along the path with me! Tap a stage to play!",
    ],
  },
  chip: {
    library: [
      "Soundbook module active. Phoneme database loaded.",
      "Free Practice protocol: select any phoneme to run targeted training.",
      "Auditory wave analysis ready for testing.",
    ],
    shop: [
      "Bazaar interface online. Transaction capabilities checked.",
      "Exchange currency for companion enhancements.",
    ],
    profile: [
      "User statistics loaded. Progress index is optimal.",
      "Analyzing learning curves... efficiency remains high.",
    ],
    path: [
      "Phonics path mapping active. Navigation modules online.",
      "Select node coordinate to execute training phase.",
    ],
  },
  fox: {
    library: [
      "Our sound collection. Cleverly cataloged.",
      "Tap any sound to study its form. Knowledge is power.",
      "Practice makes us sharper.",
    ],
    shop: [
      "Bazaar open. Find the best deals.",
      "Spend your hard-earned coins on top customizations.",
    ],
    profile: [
      "Your status report. Impressive progress.",
      "A clever player keeps a long streak.",
    ],
    path: [
      "The trail of learning. Where shall we explore next?",
      "Select a target destination from the stage path.",
    ],
  },
  cat: {
    library: [
      "Look at all these sound toys! Tap one to play its audio!",
      "Click Practice to jump right into a sound game!",
      "Purr... so many sounds to hear!",
    ],
    shop: [
      "Coins can buy treats in the shop! Let's browse!",
      "I love shiny things! Let's buy something fun!",
    ],
    profile: [
      "This is your profile! It shows how high you've climbed!",
      "Wow, look at all your achievements! Good kitty!",
    ],
    path: [
      "The path is full of surprises! Tap a node to hop!",
      "Let's follow the line to the next adventure!",
    ],
  },
  bear: {
    library: [
      "Here are the sounds we've collected. Let's listen to them quietly.",
      "Click Practice to review this sound at your own pace.",
      "Every new phoneme is a step forward.",
    ],
    shop: [
      "The bazaar has nice things. Look around gently.",
      "No rush. Buy whatever makes you happy.",
    ],
    profile: [
      "Your records are safe here. You've worked hard.",
      "Streaks are nice, but what matters is that you're learning.",
    ],
    path: [
      "The path is winding. Let's walk it together.",
      "Choose a stage when you're ready to start.",
    ],
  },
  bunny: {
    library: [
      "Soundbook! Hop in and hear the sounds!",
      "Select a card and tap Practice to play!",
      "Look at all the sounds we know now!",
    ],
    shop: [
      "Bazaar! Let's get something cool, quickly!",
      "I love spending coins! Let's buy items!",
    ],
    profile: [
      "Your profile! Look at your high score!",
      "You have so many achievements! Hooray!",
    ],
    path: [
      "Path map! Let's hop to the next stage node!",
      "Ready, set, go! Choose a stage!",
    ],
  },
  penguin: {
    library: [
      "The sound archive. Frozen in perfection.",
      "Cool practice mode available. Select any sound card.",
      "Hear how clear the pronunciation is.",
    ],
    shop: [
      "Chilling in the bazaar. Buy cool skins here.",
      "Let's see what features are in stock.",
    ],
    profile: [
      "Cool profile. Your stats are looking excellent.",
      "Solid achievements cataloged. Keep it up.",
    ],
    path: [
      "The path map is ready. Let's slide along it.",
      "Select your node coordinates to deploy next round.",
    ],
  },
  alien: {
    library: [
      "Sound database activated. Select phoneme frequency.",
      "Practice protocol initialized. Target: selected sound.",
      "Analyzing human pronunciations.",
    ],
    shop: [
      "Bazaar sector open. Trade credits for upgrades.",
      "Enhancement modules detected in shop cache.",
    ],
    profile: [
      "Earthling status: profile stats computed.",
      "Streak metrics optimal. System efficiency: 100%.",
    ],
    path: [
      "Path coordinates online. Choose destination vector.",
      "Teleporting to selected lesson stage.",
    ],
  },
  ninja: {
    library: [
      "Silence... select your sound.",
      "Practice with focus.",
      "Knowledge is a weapon.",
    ],
    shop: [
      "Bazaar. Choose silently.",
      "Only acquire what is useful.",
    ],
    profile: [
      "Your achievements are recorded.",
      "The shadow grows stronger.",
    ],
    path: [
      "The path lies ahead.",
      "Choose your stage.",
    ],
  },
  robot: {
    library: [
      "Sound library indexed. All phonemes cataloged by frequency.",
      "Practice module ready. Select phoneme for targeted training.",
      "Audio analysis suggests you are progressing optimally.",
    ],
    shop: [
      "Upgrade shop scanned. New components available for procurement.",
      "Exchange credits for system enhancements.",
    ],
    profile: [
      "User profile compiled. Statistics within expected parameters.",
      "Continued operation yields measurable improvement.",
    ],
    path: [
      "Learning path mapped. Waypoints configured for next session.",
      "Stage selection menu active. Choose destination coordinate.",
    ],
  },
};
