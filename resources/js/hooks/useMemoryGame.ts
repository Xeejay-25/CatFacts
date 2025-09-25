import { useState, useEffect, useCallback } from 'react';
import { GameState, Card } from '@/types/game';
import { generateCards, cardsMatch, calculateScore } from '@/lib/gameUtils';

const initialGameState: GameState = {
    cards: [],
    score: 0,
    moves: 0,
    gameStatus: 'idle',
    selectedCards: [],
    matchedPairs: 0,
    difficulty: 'easy',
    timeElapsed: 0,
    catFacts: [],
    showFact: false,
    currentFact: null,
};

export const useMemoryGame = (difficulty: 'easy' | 'medium' | 'hard' = 'easy') => {
    const [gameState, setGameState] = useState<GameState>(() => ({
        ...initialGameState,
        difficulty,
        cards: generateCards(difficulty),
    }));

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (gameState.gameStatus === 'playing') {
            interval = setInterval(() => {
                setGameState(prev => ({
                    ...prev,
                    timeElapsed: prev.timeElapsed + 1,
                }));
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [gameState.gameStatus]);

    // Start game
    const startGame = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            gameStatus: 'playing',
            timeElapsed: 0,
            moves: 0,
            score: 0,
            matchedPairs: 0,
            selectedCards: [],
            catFacts: [],
            cards: prev.cards.map(card => ({
                ...card,
                isFlipped: false,
                isMatched: false,
            })),
        }));
    }, []);

    // Reset game
    const resetGame = useCallback(() => {
        setGameState(prev => ({
            ...initialGameState,
            difficulty: prev.difficulty,
            cards: generateCards(prev.difficulty),
        }));
    }, []);

    // Change difficulty
    const changeDifficulty = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
        setGameState(prev => ({
            ...initialGameState,
            difficulty: newDifficulty,
            cards: generateCards(newDifficulty),
        }));
    }, []);

    // Fetch cat fact
    const fetchCatFact = useCallback(async (): Promise<string> => {
        try {
            const response = await fetch('https://catfact.ninja/fact');
            const data = await response.json();
            return data.fact;
        } catch (error) {
            console.error('Failed to fetch cat fact:', error);
            return 'Cats are amazing creatures that bring joy to millions of people worldwide! 🐱';
        }
    }, []);

    // Show cat fact reward
    const showCatFactReward = useCallback(async () => {
        const fact = await fetchCatFact();
        setGameState(prev => ({
            ...prev,
            catFacts: [...prev.catFacts, fact],
            currentFact: fact,
            showFact: true,
        }));
    }, [fetchCatFact]);

    // Close cat fact modal
    const closeCatFact = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            showFact: false,
            currentFact: null,
        }));
    }, []);

    // Handle card click
    const handleCardClick = useCallback(async (cardId: number) => {
        const cardIndex = gameState.cards.findIndex(card => card.id === cardId);
        const card = gameState.cards[cardIndex];

        // Can't click if card is already flipped/matched or game isn't playing
        if (
            card.isFlipped ||
            card.isMatched ||
            gameState.gameStatus !== 'playing' ||
            gameState.selectedCards.length >= 2
        ) {
            return;
        }

        // Flip the card
        setGameState(prev => {
            const newCards = [...prev.cards];
            newCards[cardIndex] = { ...card, isFlipped: true };
            const newSelectedCards = [...prev.selectedCards, cardIndex];

            return {
                ...prev,
                cards: newCards,
                selectedCards: newSelectedCards,
            };
        });

        // If this is the second card selected, check for match
        if (gameState.selectedCards.length === 1) {
            const firstCardIndex = gameState.selectedCards[0];
            const firstCard = gameState.cards[firstCardIndex];

            setTimeout(async () => {
                setGameState(prev => {
                    const newCards = [...prev.cards];
                    const isMatch = cardsMatch(firstCard, card);
                    let newMatchedPairs = prev.matchedPairs;
                    let newMoves = prev.moves + 1;

                    if (isMatch) {
                        // Mark cards as matched
                        newCards[firstCardIndex] = { ...newCards[firstCardIndex], isMatched: true };
                        newCards[cardIndex] = { ...newCards[cardIndex], isMatched: true };
                        newMatchedPairs += 1;

                        // Show cat fact reward for matches
                        setTimeout(() => showCatFactReward(), 500);
                    } else {
                        // Flip cards back
                        newCards[firstCardIndex] = { ...newCards[firstCardIndex], isFlipped: false };
                        newCards[cardIndex] = { ...newCards[cardIndex], isFlipped: false };
                    }

                    // Check if game is won
                    const totalPairs = Math.floor(newCards.length / 2);
                    const isGameWon = newMatchedPairs === totalPairs;
                    const newScore = isGameWon
                        ? calculateScore(newMoves, prev.timeElapsed, prev.difficulty)
                        : prev.score;

                    return {
                        ...prev,
                        cards: newCards,
                        selectedCards: [],
                        moves: newMoves,
                        matchedPairs: newMatchedPairs,
                        gameStatus: isGameWon ? 'won' : 'playing',
                        score: newScore,
                    };
                });
            }, 1000);
        }
    }, [gameState.cards, gameState.selectedCards, gameState.gameStatus, gameState.moves, gameState.matchedPairs, gameState.timeElapsed, gameState.difficulty, showCatFactReward]);

    return {
        gameState,
        startGame,
        resetGame,
        changeDifficulty,
        handleCardClick,
        closeCatFact,
        isCardClickDisabled: gameState.selectedCards.length >= 2 || gameState.gameStatus !== 'playing',
    };
};