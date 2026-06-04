import AlphabetAdventureClient from "./AlphabetAdventureClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alphabet Adventure | ผจญภัยโลกตัวอักษร",
  description: "Learn English the fun way with Alphabet Adventure! Master A-Z through 6 engaging levels: Thai Match, Phonics Match, Letter Match, Missing Caps, Missing Lowercase, and Typing Challenge. Perfect for Grade 1 students.",
};

export default function AlphabetAdventurePage() {
  return <AlphabetAdventureClient />;
}
