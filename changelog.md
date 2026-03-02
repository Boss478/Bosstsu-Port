# Website Update Log

- **v1.1.5**:
  - `*` Completely overhauled the "Is it spelled correctly?" game engine by moving a massive 6,800-word dataset off the initial page load into a Server Action. Implemented a scalable in-memory server caching system and dynamic background client fetching, drastically improving time-to-first-byte (TTFB), client-side animation latency ($O(V) \to O(1)$), and data security.
- **v1.1.4**:
  - `*` Fixed CSV parsing for empty definitions to prevent displaying "false".
  - `*` Hidden Definitions for incorrectly spelled words in Practice and Result screens.
  - `*` Improved Mobile UI by locking game screen height and hiding Header/Footer to prevent scrolling.
- **v1.1.3**:
  - `+` Integrated Oxford dictionary scraping to enhance the 5000 word dataset with distinct parts-of-speech definitions and synonyms.
- **v1.1.2**:
  - `+` Added English Oxford 5000 word set to the "Is it spelled correctly?" game, complete with word class and CEFR level display.
- **v1.1.1**:
  - `*` Enhanced "Is it spelled correctly?" game with secure CSV data, refined mode mechanics (Practice vs Test feedback), Life/Hardcore variations, and complete end-game analytics (Streaks, Speed, All Word History).
