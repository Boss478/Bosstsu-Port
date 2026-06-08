import AlphabetAdventureClient from '../AlphabetAdventureClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alphabet Adventure BETA | ผจญภัยโลกตัวอักษร (ทดสอบ)',
  description:
    'BETA version of Alphabet Adventure with card collection and tier system! Collect letter cards as you play and unlock special characters.',
};

export default function AlphabetAdventureBetaPage() {
  return <AlphabetAdventureClient beta />;
}
