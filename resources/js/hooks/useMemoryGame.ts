import { useState, useEffect, useCallback } from 'react';
import { GameState } from '@/types/game';
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

// Game session management
let currentGameId: number | null = null;

export const useMemoryGame = (difficulty: 'easy' | 'medium' | 'hard' = 'easy', userId?: number) => {
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

    // Fetch cat fact from backend
    const fetchCatFact = useCallback(async (): Promise<string> => {
        try {
            const response = await fetch('/api/cat-facts/random');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.fact;
        } catch (error) {
            console.error('Failed to fetch cat fact from backend:', error);
            return 'Cats are amazing creatures that bring joy to millions of people worldwide! 🐱';
        }
    }, []);

    // Start a game session on the backend
    const startGameSession = useCallback(async (difficulty: string) => {
        try {
            const requestBody: { difficulty: string; user_id?: number } = { difficulty };
            if (userId) {
                requestBody.user_id = userId;
            }

            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            currentGameId = data.game.id;
            return data;
        } catch (error) {
            console.error('Failed to start game session:', error);
            return null;
        }
    }, [userId]);

    // End a game session on the backend
    const endGameSession = useCallback(async (score: number, moves: number, timeElapsed: number) => {
        if (!currentGameId) return;

        try {
            const response = await fetch(`/api/games/${currentGameId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    score,
                    moves,
                    time_elapsed: timeElapsed,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            currentGameId = null;
            return data;
        } catch (error) {
            console.error('Failed to end game session:', error);
        }
    }, []);

    // Start game
    const startGame = useCallback(async () => {
        // Start backend game session
        await startGameSession(gameState.difficulty);

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
    }, [gameState.difficulty, startGameSession]);

    // Reset game
    const resetGame = useCallback(async () => {
        // If there's an active game session, mark it as abandoned
        if (currentGameId && gameState.gameStatus === 'playing') {
            try {
                await fetch(`/api/games/${currentGameId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        status: 'abandoned',
                        score: gameState.score,
                        moves: gameState.moves,
                        time_elapsed: gameState.timeElapsed,
                        matched_pairs: gameState.matchedPairs,
                    }),
                });
                currentGameId = null;
            } catch (error) {
                console.error('Failed to abandon game session:', error);
            }
        }

        setGameState(prev => ({
            ...initialGameState,
            difficulty: prev.difficulty,
            cards: generateCards(prev.difficulty),
        }));
    }, [gameState.gameStatus, gameState.score, gameState.moves, gameState.timeElapsed, gameState.matchedPairs]);

    // Change difficulty
    const changeDifficulty = useCallback(async (newDifficulty: 'easy' | 'medium' | 'hard') => {
        // If there's an active game session, mark it as abandoned
        if (currentGameId && gameState.gameStatus === 'playing') {
            try {
                await fetch(`/api/games/${currentGameId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        status: 'abandoned',
                        score: gameState.score,
                        moves: gameState.moves,
                        time_elapsed: gameState.timeElapsed,
                        matched_pairs: gameState.matchedPairs,
                    }),
                });
                currentGameId = null;
            } catch (error) {
                console.error('Failed to abandon game session:', error);
            }
        }

        setGameState(({
            ...initialGameState,
            difficulty: newDifficulty,
            cards: generateCards(newDifficulty),
        }));
    }, [gameState.gameStatus, gameState.score, gameState.moves, gameState.timeElapsed, gameState.matchedPairs]);

    // Show cat fact reward
    const showCatFactReward = useCallback(async () => {
        const fact = await fetchCatFact();
        setGameState(prev => ({
            ...prev,
            catFacts: [...prev.catFacts, fact],
            // Remove the modal display - just add the fact silently
        }));
    }, [fetchCatFact]);

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
                    const newMoves = prev.moves + 1;

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

                    // End game session if won
                    if (isGameWon) {
                        endGameSession(newScore, newMoves, prev.timeElapsed);
                    }

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
    }, [gameState.cards, gameState.selectedCards, gameState.gameStatus, showCatFactReward, endGameSession]);

    return {
        gameState,
        startGame,
        resetGame,
        changeDifficulty,
        handleCardClick,
        isCardClickDisabled: gameState.selectedCards.length >= 2 || gameState.gameStatus !== 'playing',
    };
};