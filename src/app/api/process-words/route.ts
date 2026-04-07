import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inputPath = path.join(process.cwd(), 'src', 'data', 'oxford-5000.csv');
    const dataOutputPath = path.join(process.cwd(), 'src', 'data', 'games', 'spelling', 'english_word.csv');
    const publicOutputPath = path.join(process.cwd(), 'public', 'files', 'english_word.csv');

    let fileData = await fs.readFile(inputPath, 'utf-8');
    fileData = fileData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = fileData.split('\n');
    
    // misspellings dictionary
    const misspellings: Record<string, string> = {
        'accommodate': 'acommodate',
        'achieve': 'acheive',
        'definitely': 'definately',
        'embarrass': 'embarass',
        'fluorescent': 'flourescent',
        'guarantee': 'garantee',
        'harass': 'harrass',
        'independent': 'independant',
        'memento': 'momento',
        'necessary': 'neccessary',
        'occurrence': 'occurence',
        'perseverance': 'perseverence',
        'privilege': 'privelege',
        'publicly': 'publically',
        'receive': 'recieve',
        'recommend': 'recomend',
        'separate': 'seperate',
        'supersede': 'supercede',
        'weird': 'wierd',
        'accidentally': 'accidently',
        'acquire': 'aquire',
        'amateur': 'amature',
        'apparent': 'apparant',
        'argument': 'arguement',
        'calendar': 'calender',
        'category': 'catagory',
        'cemetery': 'cemetary',
        'colleague': 'collegue',
        'commit': 'comit',
        'committee': 'comittee',
        'conscience': 'conscense',
        'conscious': 'consious',
        'consensus': 'concensus',
        'criticize': 'critize',
        'discipline': 'disipline',
        'equipment': 'equiptment',
        'exceed': 'excede',
        'existence': 'existance',
        'experience': 'experiance',
        'fascinating': 'fasinating',
        'foreign': 'foriegn',
        'gauge': 'guage',
        'grateful': 'greatful',
        'ignorance': 'ignorence',
        'imitate': 'immitate',
        'immediately': 'imediately',
        'intelligence': 'inteligence',
        'interrupt': 'interupt',
        'knowledge': 'knowlege',
        'leisure': 'liesure',
        'library': 'libary',
        'maintenance': 'maintainance',
        'maneuver': 'manuever',
        'medieval': 'medival',
        'millennium': 'millenium',
        'miniature': 'miniture',
        'misspell': 'mispell',
        'noticeable': 'noticable',
        'occasion': 'occassion',
        'piece': 'peice',
        'possession': 'posession',
        'precede': 'preceed',
        'presence': 'presance',
        'pronunciation': 'pronounciation',
        'questionnaire': 'questionaire',
        'receipt': 'reciept',
        'reference': 'referance',
        'referred': 'refered',
        'relevant': 'revelant',
        'restaurant': 'restarant',
        'rhyme': 'rime',
        'rhythm': 'rythm',
        'schedule': 'scheduel',
        'sergeant': 'sargent',
        'skillful': 'skilful',
        'successful': 'succesful',
        'surprise': 'suprise',
        'threshold': 'threshhold',
        'twelfth': 'twelth',
        'tyranny': 'tyrany',
        'until': 'untill',
        'vacuum': 'vaccuum',
        'whether': 'wether',
        'tomorrow': 'tommorow',
        'forward': 'foward',
        'especially': 'especialy',
        'across': 'accross',
        'basically': 'normaly',
        'beginning': 'begining',
        'business': 'buisness',
    };

    function generateMisspelling(word: string) {
        if (word.length < 3) return word + word.charAt(word.length - 1);
        
        const reps = [
            ['tion', 'sion'], ['sion', 'tion'],
            ['ance', 'ence'], ['ence', 'ance'],
            ['able', 'ible'], ['ible', 'able'],
            ['ary', 'ery'], ['ery', 'ary'],
            ['ie', 'ei'], ['ei', 'ie'],
            ['ea', 'ee'], ['ee', 'ea'],
            ['ou', 'oa'], ['oa', 'ou'],
            ['ph', 'f'], ['f', 'ph']
        ];
        for (const [old, newStr] of reps) {
            if (word.includes(old)) return word.replace(old, newStr);
        }
        
        const doubles = ['mm', 'nn', 'll', 'ss', 'pp', 'tt', 'cc', 'ff', 'rr'];
        for (const d of doubles) {
            if (word.includes(d)) return word.replace(d, d[0]);
        }
        
        const singles = ['m', 'n', 'l', 's', 'p', 't', 'r'];
        for (const s of singles) {
            const regex = new RegExp(`(?<=[aeiou])${s}(?=[aeiouy])`);
            if (regex.test(word)) {
                return word.replace(regex, `${s}${s}`);
            }
        }
        
        if (word.endsWith('e') && !['a','e','i','o','u'].includes(word[word.length - 2])) {
            return word.slice(0, -1);
        }
        
        if (word.length > 3) {
            const idx = Math.floor(word.length / 2);
            return word.substring(0, idx) + word[idx + 1] + word[idx] + word.substring(idx + 2);
        }
        
        return word.slice(0, -1);
    }
    
    // Parse
    lines.shift(); // header
    
    const validWords: {word: string, wclass: string, level: string}[] = [];
    const seen = new Set<string>();
    
    for (const l of lines) {
       const p = l.split(',');
       if (p.length < 3) continue;
       const word = p[0].trim();
       const wclass = p[1].trim();
       const level = p[2].trim().toLowerCase();
       
       if (level === 'a1' || level === 'a2') continue;
       if (wclass.includes('article') && ['a', 'an', 'the'].includes(word.toLowerCase())) continue;
       if (word.length <= 3) continue;
       
       if (!seen.has(word)) {
           validWords.push({word, wclass, level});
           seen.add(word);
       }
    }
    
    // Sort correctly according to true variations only
    validWords.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
    
    const outRows = ['word,isCorrect,class,level'];
    for (const item of validWords) {
        // True variant
        outRows.push(`${item.word},true,${item.wclass},${item.level}`);
        // False variant
        let wrong = misspellings[item.word];
        if (!wrong) {
            wrong = generateMisspelling(item.word);
            if (wrong === item.word) wrong = item.word + item.word[item.word.length-1];
        }
        outRows.push(`${wrong},false,${item.wclass},${item.level}`);
    }
    
    const finalCsv = outRows.join('\n');
    await fs.writeFile(dataOutputPath, finalCsv);
    await fs.writeFile(publicOutputPath, finalCsv);

    return NextResponse.json({ success: true, count: outRows.length - 1 });
  } catch {
    console.error('Process Words Error');
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการประมวลผล' });
  }
}
