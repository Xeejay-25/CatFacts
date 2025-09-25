// Game Types for Memory Card Game

export interface Card {
    id: number;
    symbol: string; // Cat emoji or image
    isFlipped: boolean;
    isMatched: boolean;
}

export interface GameState {
    cards: Card[];
    score: number;
    moves: number;
    gameStatus: 'idle' | 'playing' | 'paused' | 'won';
    selectedCards: number[]; // indices of currently selected cards
    matchedPairs: number;
    difficulty: 'easy' | 'medium' | 'hard';
    timeElapsed: number;
    catFacts: string[]; // Array to store earned cat facts
    showFact: boolean; // Whether to show the cat fact modal
    currentFact: string | null; // Current fact being displayed
}

export interface GameSettings {
    difficulty: 'easy' | 'medium' | 'hard';
    gridSize: number; // Number of pairs (easy: 8, medium: 12, hard: 18)
}

// Cat symbols for the cards
export const CAT_SYMBOLS = [
    '🐱', '🐈', '🐈‍⬛', '😺', '😸', '😹',
    '😻', '😼', '😽', '🙀', '😿', '😾',
    '🦁', '🐅', '🐆', '🐯', '🦄', '🦋'
];

// Difficulty settings
export const DIFFICULTY_SETTINGS = {
    easy: { pairs: 8, gridCols: 4 },
    medium: { pairs: 12, gridCols: 4 },
    hard: { pairs: 18, gridCols: 6 }
};