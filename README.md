# Smart Scrabble - AI Powered Board Game

A browser-based Scrabble game featuring AI opponents with **Greedy** and **Heuristic** strategies. Built as a term project for TOBB ETU YAP 441 course.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwind-css)

## Features

- **15x15 Standard Scrabble Board** with all bonus squares (TW, DW, TL, DL)
- **Human vs AI** gameplay with two AI difficulty levels
- **Greedy AI**: Selects the highest-scoring move each turn
- **Heuristic AI**: Uses weighted evaluation considering board control, rack management, and strategic positioning
- **Trie-based Dictionary**: O(k) word validation using prefix tree data structure
- **Anchor-based Move Generation**: Efficient move generation algorithm using DFS
- **Real-time Scoring** with bonus square calculations and bingo bonus
- **Move History** tracking with score breakdown
- **Classic Scrabble Theme** with wooden tile aesthetics
- **Responsive Design** - playable on desktop and mobile

## AI Strategies

### Greedy Strategy
The greedy agent generates all valid moves and selects the one with the highest immediate score. This serves as a baseline strategy.

### Heuristic Strategy
The heuristic agent evaluates moves using a weighted combination of factors:
- **Raw Score** (weight: 1.0) - The immediate point value of the move
- **Bonus Exposure Penalty** (weight: -8.0) - Penalizes moves that open premium squares to the opponent
- **Tile Usage Reward** (weight: 3.0) - Encourages using more tiles per turn
- **Rack Balance** (weight: 2.0) - Maintains a balanced vowel/consonant ratio
- **Center Proximity** (weight: 1.5) - Rewards plays near the board center
- **Board Openness Penalty** (weight: -2.0) - Penalizes creating too many new anchor points

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **Data Structure**: Trie (Prefix Tree) for dictionary
- **Algorithm**: Anchor-based move generation with DFS
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  game/           # Game engine
    types.ts      # TypeScript type definitions
    constants.ts  # Board layout, letter points, tile distribution
    trie.ts       # Trie data structure for word validation
    tileBag.ts    # Tile bag management
    board.ts      # Board operations and validation
    scoring.ts    # Score calculation with bonus squares
    moveGenerator.ts  # Anchor-based move generation (DFS)
    aiGreedy.ts   # Greedy AI strategy
    aiHeuristic.ts    # Heuristic AI strategy
    gameState.ts  # Game state management (reducer)
  components/     # React UI components
  styles/         # CSS modules
  app/            # Next.js app router pages
```

## Game Rules

- Standard 15x15 Scrabble board with bonus squares
- 98 letter tiles (no blank/joker tiles)
- First move must cover the center star
- All words must be valid English words from the dictionary
- Cross-words are validated automatically
- Game ends when tile bag is empty and a player uses all tiles, or after 4 consecutive passes

## References

- Appel, A. W., & Jacobson, G. J. (1988). The World's Fastest Scrabble Program
- Sheppard, B. (2002). World-championship-caliber Scrabble (Maven)
- Gordon, S. A. (1994). A Faster Scrabble Move Generation Algorithm (GADDAG)

## Author

**Iclal Suzan** - TOBB ETU Computer Engineering
Student ID: 211401020
Course: YAP 441 - Term Project (Spring 2025-26)
