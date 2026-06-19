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
