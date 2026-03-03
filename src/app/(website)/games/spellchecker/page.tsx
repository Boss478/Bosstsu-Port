import FlashcardClient from './FlashcardClient';

export const metadata = {
  title: 'SpellChecker | Boss478 Games',
  description: 'Test your spelling skills in Thai and English (US). / ฝึกทักษะการสะกดคำภาษาไทยและภาษาอังกฤษ',
};

export default function FlashcardGamePage() {
  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-40 md:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <FlashcardClient />
      </div>
    </div>
  );
}
