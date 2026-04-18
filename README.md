# Boss478 Portfolio & Educational Platform

Welcome to the Boss478 project repository! This project serves as a comprehensive portfolio, an interactive educational platform, and a repository for interactive web-based games and tools (like an Online Python Compiler and various educational games).

## System Requirements

- **Node.js**: v20 or higher
- **Package Manager**: npm (v10+)
- **Environment Variables**: Configure local environment variables for the database and secrets (e.g., MongoDB connection string).

## Role

**Portfolio & Educational Gamification Platform**: 
Designed to act as an immersive personal showcase highlighting previous work (Portfolio), a dynamic image gallery (Gallery), and a robust learning hub. The hub specifically integrates tailored gamified learning logic, featuring:
- Alphabet Adventure
- Number Game (with difficulties ranging from 1 to 100)
- Spellchecker
- A localized Online Python Compiler designed for study and exploration.

## Frontend

- **Framework**: Next.js 16.2 (App Router)
- **Library**: React 19.2
- **Styling Architecture**: Tailwind CSS v4 configured with PostCSS
- **State & Theme Management**: Next-Themes built into a centralized `<ThemeProvider>` (Dark/Light mode support)
- **Tooling & Libraries**: `react-image-crop` for UI image handling, `isomorphic-dompurify` for HTML sanitization, and heavy use of custom CSS-based Micro-animations (utilities like `.glass`, float animations, and custom page transitions).

## Backend

- **Infrastructure**: Next.js Server Components and Server Actions / API Routes.
- **Image Processing**: Utilizes `sharp` and `heic-convert` for server-side robust image interpretation, optimization, and manipulation.
- **Core Operations**: Handles file processing protocols, directory reading (`exifr`), and secure communication with the database architecture.

## Database Design

- **Database System**: MongoDB 
- **ODM**: Mongoose v9.1.6
- **Architecture / Models**: 
  - `Portfolio`: Contains structured records of project showcases.
  - `Gallery`: Stores robust image metadata and uploaded gallery items.
  - `Learning`: Educational resources, python compiler data context, and course logic.
  - `Game`: State tracking and meta-information for educational web-based games.
  - `Tag`: A global metadata tagging system used for filtering and categorizing content universally.

## Theme

The application's graphical theme heavily hinges upon modern UI heuristics—seamlessly balancing minimalist geometry (Glassmorphism, `.glass` cards) with highly responsive interactions and bespoke typography.

### Icon
- **Vector Icons Library**: Flaticon UI Icons (`@flaticon/flaticon-uicons`)
- **Included Styles**: Readily utilizes `Solid Rounded` and generic `Brands` packs across the platform layout grids.

### Color Palette
- **Light Mode**:
  - Background Canvas: `#ffffff`
  - Foreground (Text Base): `#171717`
- **Dark Mode**: 
  - Background Canvas: `#0a0a0a`
  - Foreground (Text Base): `#ededed`
- **Typography & Brand Context**: 
  - **Typefaces**: Built purely offline via local fonts (`Geist Sans`, `Geist Mono` for technical blocks, and `Mali` primarily for playful/educational contexts spanning 5 core weights).
