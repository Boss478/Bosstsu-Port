"use client";

import FlashcardMenuScreen from "./FlashcardMenuScreen";
import FlashcardResultScreen from "./FlashcardResultScreen";
import FlashcardPlayingScreen from "./FlashcardPlayingScreen";
import { FlashcardProvider, useFlashcardContext } from "./FlashcardContext";

function FlashcardGameEngine() {
  const { gameState, currentWord } = useFlashcardContext();

  if (gameState === "MENU") {
    return <FlashcardMenuScreen />;
  }

  if (gameState === "PLAYING" && currentWord) {
    return <FlashcardPlayingScreen />;
  }

  if (gameState === "RESULT") {
    return <FlashcardResultScreen />;
  }

  return null;
}

export default function FlashcardClient() {
  return (
    <FlashcardProvider>
      <FlashcardGameEngine />
    </FlashcardProvider>
  );
}
