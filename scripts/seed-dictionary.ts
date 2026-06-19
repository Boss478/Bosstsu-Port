import fs from "fs";
import path from "path";
import { parseIpaToPhonemes } from "./ipa-parser";
import { detectIpaDialect } from "../src/lib/detect-ipa-dialect";

interface DictEntry {
  word: string;
  phonemeIds: string[];
  dialect: string;
  ipa: string;
}

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

const WORDS = [
  // All 51 WORDS + common phonics words
  "cat","bed","sit","hot","cup","car","see","moon","bird","day",
  "fly","boy","now","about","near","care","tour","book","ship","measure",
  "chin","jump","sing","thin","this","correct","office","wash","hope",
  "bat","hat","bag","sad","man","pen","leg","hen","wet","nest",
  "pin","pig","big","dig","lip","dog","box","fox","top","pot","map",
  "tap","cap","gap","nap","lap","sap","back","pack","rack","tack",
  "jam","ram","yam","fan","pan","van","tan","pad","bad","mad",
  "dad","fad","lad","tag","rag","wag","cab","dab","gab","lab",
  "web","bet","get","jet","let","met","net","pet","set","yet",
  "fed","led","red","wed","beg","peg","den","ken","men","ten",
  "wen","yes","mess","less","bell","tell","sell","well","fell",
  "hill","mill","fill","bill","dill","will","win","tin","din","kin",
  "fin","him","dim","tip","dip","hip","zip","rip","sip","kid",
  "lid","bid","did","hid","rid","fig","wig","hop","pop","mop",
  "cop","shop","drop","stop","job","rob","cob","nod","log","fog",
  "hog","jog","got","lot","not","rot","bud","mud","dud","hut",
  "gut","cut","shut","run","fun","bun","gun","sun","buzz","puff",
  "bus","bug","sun","nut","tub","bee","tree","feet","green","sleep",
  "star","park","farm","dark","art","ball","law","saw","draw","fall",
  "cool","pool","food","spoon","blue","cake","lake","rain","train","play",
  "journey","neighbor","pleasure","machine","character","achieve","treasure","enormous","knowledge","adventure",
  "substance","relevant","keep","deep","weep","jeep","cheap","street","sweet","queen","team","dream",
  "clean","mean","read","lead","leaf","meal","seal","deal","goal","coat",
  "boat","goat","road","soap","foam","oak","teach","reach","peach","beach",
  "dear","fear","hear","year","gear","spear","roar","soar","four","pour",
  "bar","far","jar","tar","hard","yard","card","harm","charm","bark",
  "mark","spark","fern","jerk","perk","germ","term","herd","verb","serve",
  "turn","burn","curl","hurl","fur","blur","slur","curve","nurse","purse",
  "worse","worm","world","word","work","warm","ward","warn","swarm","thorn",
  "born","corn","horn","sport","short","fort","port","sort","north","cord",
  "lord","force","porch","torch","coin","join","loin","voice","choice","noise",
  "point","pout","loud","cloud","proud","ground","sound","round","found","house",
  "mouse","mouth","south","couch","pouch","touch","young","rough","tough","double",
  "trouble","couple","country","cousin","blood","oven","glove","dove","love","above",
  "none","done","come","some","son","tongue","front","month","other","mother",
  "brother","nothing","cover","money","honey","donkey","long","song","ring","king",
  "wing","thing","bring","sting","swing","spring","string","strong","young","wrong",
  "shop","shot","shut","shed","fish","dish","wish","push","bush","cash",
  "dash","gash","hash","lash","mash","rash","chat","chop","rich","such",
  "much","chest","bench","lunch","munch","punch","branch","chick","chill","chimp",
  "chant","chart","cheese","cheek","choose","chase","chance","change","charge","them",
  "that","than","then","with","bath","path","teeth","tooth","cloth","both",
  "moth","smooth","breath","death","health","wealth","earth","worth","north","south",
  "truth","youth","whale","wheat","wheel","while","white","why","what","when",
  "where","which","black","block","blow","bloom","blank","blast","blend","bless",
  "blind","blink","clap","clip","club","clog","clash","class","clean","clear",
  "click","climb","cling","clock","close","cloud","clown","flag","flame","flash",
  "flat","flee","fleet","flesh","float","flock","flood","floor","flour","flower",
  "glad","glide","globe","gloom","glory","glow","glue","plan","plot","plug",
  "plant","plate","play","plenty","pluck","plum","plus","scare","score","scout",
  "scream","screen","skate","skill","skin","skip","skirt","sky","slam","slap",
  "sleep","slice","slide","slight","slip","slope","slot","slow","slug","small",
  "smell","smile","smoke","snack","snail","snake","snap","snow","soak","spark",
  "spell","spend","spill","spin","spine","spoon","spot","spray","stand","star",
  "start","state","stay","steal","steam","steel","steep","steer","step","stick",
  "still","sting","stir","stock","stone","stop","store","storm","story","street",
  "stretch","strike","string","strip","strong","study","stuff","trail","train","trap",
  "trash","travel","treat","tree","trick","trip","troop","truck","trust","truth",
  "try","twin","twist",
];

async function fetchIpaAll(word: string): Promise<{ text: string; dialect: string }[] | "rate-limited"> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "Boss478/1.0" },
    });

    if (res.ok) {
      const data = await res.json();
      const entry = data[0];
      if (!entry?.phonetics) return [];
      return (entry.phonetics as { text?: string }[])
        .filter((p) => p.text)
        .map((p) => ({
          text: p.text!,
          dialect: detectIpaDialect(p.text!),
        }));
    }

    if (res.status === 404) return [];
    if (res.status === 429 || res.status === 503) {
      const backoff = 5000 * attempt;
      process.stdout.write(`[429] retry ${attempt}/5 in ${backoff}ms ... `);
      await delay(backoff);
      continue;
    }

    return [];
  }

  return "rate-limited";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const uniqueWords = [...new Set(WORDS.map((w) => w.toLowerCase()))];
  console.log(`Seeding dictionary for ${uniqueWords.length} words...\n`);

  const entries: DictEntry[] = [];
  let noIpa = 0;
  let failed = 0;

  for (let i = 0; i < uniqueWords.length; i++) {
    const w = uniqueWords[i];

    const result = await fetchIpaAll(w);

    if (result === "rate-limited") {
      console.log(`[${i + 1}] ${w} - rate-limited`);
      failed++;
      await delay(5000);
      continue;
    }

    if (result.length === 0) {
      console.log(`[${i + 1}] ${w} - no IPA`);
      noIpa++;
      await delay(500);
      continue;
    }

    const seen = new Set<string>();
    for (const v of result) {
      const phonemeIds = parseIpaToPhonemes(v.text);
      if (phonemeIds.length === 0) continue;
      const key = `${w}|${v.dialect}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ word: w, phonemeIds, dialect: v.dialect, ipa: v.text });
    }

    const last = entries[entries.length - 1];
    console.log(`[${i + 1}] ${w} - ${seen.size} v: [${last?.phonemeIds?.join(",")}]`);

    await delay(2200);
  }

  console.log(`\nDone! ${entries.length}/${uniqueWords.length} words (${noIpa} no IPA, ${failed} failed)`);

  const outputPath = path.resolve(PROJECT_ROOT, "src/data/pronunciation-dictionary.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Written to ${outputPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});