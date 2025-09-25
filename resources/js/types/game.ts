// Game Types for Memory Card Game

export interface Card {
    id: number;
    symbol: string; // Cat emoji or image
    isFlipped: boolean;
    isMatched: boolean;
}

export interface CatFact {
    id: number;
    fact: string;
    length?: number;
}

export interface GameSession {
    id: number;
    session_id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    score: number;
    moves: number;
    time_elapsed: number;
    matched_pairs: number;
    total_pairs: number;
    status: 'playing' | 'won' | 'abandoned';
    completed_at?: string;
}

export interface GameState {
    cards: Card[];
    score: number;
    moves: number;
    gameStatus: 'idle' | 'playing' | 'won';
    selectedCards: number[]; // indices of currently selected cards
    matchedPairs: number;
    difficulty: 'easy' | 'medium' | 'hard';
    timeElapsed: number;
    catFacts: CatFact[]; // Array to store earned cat facts
    showFact: boolean; // Whether to show the cat fact modal
    currentFact: CatFact | null; // Current fact being displayed
    gameId: number | null; // Backend game session ID
    sessionId: string | null; // Session ID for anonymous users
}

export interface GameSettings {
    difficulty: 'easy' | 'medium' | 'hard';
    gridSize: number; // Number of pairs (easy: 8, medium: 12, hard: 18)
}

export interface LeaderboardEntry {
    id: number;
    player: string;
    score: number;
    moves: number;
    time_elapsed: number;
    difficulty: string;
    status: string;
    completed_at: string;
    created_at: string;
    facts_collected: number;
    rank?: number;
}

export interface UserStats {
    user_id: number;
    name: string;
    total_games: number;
    completed_games: number;
    total_score: number;
    best_score: number;
    average_score: number;
    average_time: number;
    created_at: string;
    facts_collected?: number;
    rank?: number;
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