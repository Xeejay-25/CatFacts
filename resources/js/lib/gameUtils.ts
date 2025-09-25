import { Card, CAT_SYMBOLS, DIFFICULTY_SETTINGS } from '@/types/game';

// Shuffle array using Fisher-Yates algorithm
export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Generate cards for the game
export const generateCards = (difficulty: 'easy' | 'medium' | 'hard'): Card[] => {
    const { pairs } = DIFFICULTY_SETTINGS[difficulty];
    const selectedSymbols = CAT_SYMBOLS.slice(0, pairs);

    // Create pairs of cards
    const cards: Card[] = [];
    selectedSymbols.forEach((symbol, index) => {
        // First card of the pair
        cards.push({
            id: index * 2,
            symbol,
            isFlipped: false,
            isMatched: false,
        });

        // Second card of the pair
        cards.push({
            id: index * 2 + 1,
            symbol,
            isFlipped: false,
            isMatched: false,
        });
    });

    return shuffleArray(cards);
};

// Calculate score based on moves and time
export const calculateScore = (moves: number, timeElapsed: number, difficulty: 'easy' | 'medium' | 'hard'): number => {
    const difficultyMultiplier = {
        easy: 1,
        medium: 1.5,
        hard: 2
    };

    // Base score calculation
    const timeBonus = Math.max(0, 300 - timeElapsed); // Bonus for completing quickly
    const movesPenalty = Math.max(0, moves - 20); // Penalty for too many moves
    const baseScore = 1000 + timeBonus - (movesPenalty * 10);

    return Math.round(baseScore * difficultyMultiplier[difficulty]);
};

// Check if two cards match
export const cardsMatch = (card1: Card, card2: Card): boolean => {
    return card1.symbol === card2.symbol && card1.id !== card2.id;
};

// Format time for display
export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Get grid configuration based on difficulty
export const getGridConfig = (difficulty: 'easy' | 'medium' | 'hard') => {
    return DIFFICULTY_SETTINGS[difficulty];
};