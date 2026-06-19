import { NextResponse } from 'next/server';
import { detectIpaDialect } from '@/lib/detect-ipa-dialect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const fields = searchParams.get('fields')?.split(',').map(f => f.trim()) || [];

  if (!word) {
    return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      const result: Record<string, unknown> = { audioUrl: null };
      if (fields.includes('word')) result.word = word;
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      });
    }

    const data = await res.json();
    const entry = data[0];
    const result: Record<string, unknown> = {};

    if (fields.includes('ipa')) {
      result.ipa = entry.phonetic || entry.phonetics?.[0]?.text || null;
    }
    if (fields.includes('ipa_all')) {
      result.ipa_all = (entry.phonetics || [])
        .filter((p: { text?: string }) => p.text)
        .map((p: { text: string }) => ({
          text: p.text,
          dialect: detectIpaDialect(p.text),
        }));
    }
    if (fields.includes('definition')) {
      const def = entry.meanings?.[0]?.definitions?.[0];
      result.definition = def?.definition || null;
      result.example = def?.example || null;
    }
    if (fields.includes('word')) {
      result.word = entry.word || word;
    }

    const firstAudioUrl = entry.phonetics?.find(
      (p: { audio?: string }) => p.audio
    )?.audio;

    if (firstAudioUrl) {
      const audioRes = await fetch(firstAudioUrl);
      if (audioRes.ok) {
        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');
        const mimeType = firstAudioUrl.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
        result.audioUrl = `data:${mimeType};base64,${base64Audio}`;
      }
    }

    if (!('audioUrl' in result)) {
      result.audioUrl = null;
    }

    interface ParsedEntry {
      word: string;
      ipa: string | null;
      wordClass: string | null;
      definition: string | null;
      example: string | null;
      audioUrl: string | null;
    }

    // Parse all entries and meanings for heteronyms
    const entriesList: ParsedEntry[] = [];
    for (const ent of data) {
      const phoneticsList = (ent.phonetics || []) as Array<{ text?: string; audio?: string }>;
      const ipaText = ent.phonetic || phoneticsList.find((p) => p.text)?.text || null;
      const entryAudioUrl = phoneticsList.find((p) => p.audio)?.audio || null;

      let base64AudioUrl: string | null = null;
      if (entryAudioUrl) {
        try {
          const audioRes = await fetch(entryAudioUrl);
          if (audioRes.ok) {
            const arrayBuffer = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Audio = buffer.toString('base64');
            const mimeType = entryAudioUrl.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
            base64AudioUrl = `data:${mimeType};base64,${base64Audio}`;
          }
        } catch {}
      }

      const meanings = ent.meanings || [];
      if (meanings.length > 0) {
        for (const meaning of meanings) {
          const wordClass = meaning.partOfSpeech || null;
          const def = meaning.definitions?.[0];
          const candidate = {
            word: ent.word || word,
            ipa: ipaText,
            wordClass: wordClass,
            definition: def?.definition || null,
            example: def?.example || null,
            audioUrl: base64AudioUrl,
          };

          const existingIndex = entriesList.findIndex(
            (e) =>
              e.word.toLowerCase() === candidate.word.toLowerCase() &&
              e.ipa === candidate.ipa &&
              e.wordClass === candidate.wordClass
          );

          if (existingIndex !== -1) {
            if (!entriesList[existingIndex].definition && candidate.definition) {
              entriesList[existingIndex].definition = candidate.definition;
              entriesList[existingIndex].example = candidate.example;
              if (candidate.audioUrl) {
                entriesList[existingIndex].audioUrl = candidate.audioUrl;
              }
            }
          } else {
            entriesList.push(candidate);
          }
        }
      } else {
        const candidate = {
          word: ent.word || word,
          ipa: ipaText,
          wordClass: null,
          definition: null,
          example: null,
          audioUrl: base64AudioUrl,
        };

        const existingIndex = entriesList.findIndex(
          (e) =>
            e.word.toLowerCase() === candidate.word.toLowerCase() &&
            e.ipa === candidate.ipa &&
            e.wordClass === candidate.wordClass
        );

        if (existingIndex === -1) {
          entriesList.push(candidate);
        }
      }
    }

    result.entries = entriesList;

    const cacheHeader = result.audioUrl
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

    return NextResponse.json(result, {
      headers: { 'Cache-Control': cacheHeader },
    });
  } catch (err) {
    console.error('Error fetching dictionary:', err);
    const result: Record<string, unknown> = { audioUrl: null };
    if (fields.includes('word')) result.word = word;
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }
}
