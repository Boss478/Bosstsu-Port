'use client';

import type { FC } from 'react';
import type { IllustrationProps } from './CardIllustrations';
import { CardIllustration } from './CardIllustrations';
import { WORD_ART_CHUNK as ArtAtoC } from './art/ArtAtoC';
import { WORD_ART_CHUNK as ArtDtoG } from './art/ArtDtoG';
import { WORD_ART_CHUNK as ArtHtoL } from './art/ArtHtoL';
import { WORD_ART_CHUNK as ArtMtoP } from './art/ArtMtoP';
import { WORD_ART_CHUNK as ArtQtoT } from './art/ArtQtoT';
import { WORD_ART_CHUNK as ArtUtoZ } from './art/ArtUtoZ';

export const WORD_ART: Record<string, FC<IllustrationProps>> = {
  ...ArtAtoC,
  ...ArtDtoG,
  ...ArtHtoL,
  ...ArtMtoP,
  ...ArtQtoT,
  ...ArtUtoZ,
};

interface CardWordIllustrationProps {
  word?: string;
  letter?: string;
  size?: number;
}

export function CardWordIllustration({ word, letter, size = 48 }: CardWordIllustrationProps) {
  const Art = word ? WORD_ART[word] : undefined;
  if (!Art) {
    if (letter) return <CardIllustration letter={letter} size={size} />;
    return (
      <span aria-hidden="true" className="text-3xl">
        🔮
      </span>
    );
  }
  return (
    <span aria-hidden="true">
      <Art size={size} />
    </span>
  );
}
