import { useState, useEffect, useCallback } from 'react';
import { GameState, CatFact } from '@/types/game';
import { generateCards, cardsMatch, calculateScore } from '@/lib/gameUtils';
import ApiService from '@/services/api';

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
    gameId: null,
    sessionId: null,
};

export const useMemoryGame = (difficulty: 'easy' | 'medium' | 'hard' = 'easy', userId?: number) => {
    const [gameState, setGameState] = useState<GameState>(() => ({
        ...initialGameState,
        difficulty,
        cards: generateCards(difficulty),
        sessionId: ApiService.getSessionId(),
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

                // Auto-save game progress every 10 seconds
                if (gameState.timeElapsed % 10 === 0 && gameState.gameId) {
                    updateGameProgress();
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [gameState.gameStatus, gameState.timeElapsed]);

    // Update game progress on backend
    const updateGameProgress = useCallback(async () => {
        if (!gameState.gameId) return;

        try {
            await ApiService.updateGame(gameState.gameId, {
                score: gameState.score,
                moves: gameState.moves,
                time_elapsed: gameState.timeElapsed,
                matched_pairs: gameState.matchedPairs,
            });
        } catch (error) {
            console.error('Failed to update game progress:', error);
        }
    }, [gameState.gameId, gameState.score, gameState.moves, gameState.timeElapsed, gameState.matchedPairs]);

    // Start game
    const startGame = useCallback(async () => {
        try {
            const response = await ApiService.startGame(gameState.difficulty, userId);
            
            if (response.success && response.data) {
                setGameState(prev => ({
                    ...prev,
                    gameStatus: 'playing',
                    timeElapsed: 0,
                    moves: 0,
                    score: 0,
                    matchedPairs: 0,
                    selectedCards: [],
                    catFacts: [],
                    gameId: response.data!.game.id,
                    sessionId: response.data!.session_id,
                    cards: prev.cards.map(card => ({
                        ...card,
                        isFlipped: false,
                        isMatched: false,
                    })),
                }));

                console.log('Game started:', response.data.game);
            } else {
                throw new Error(response.message || 'Failed to start game');
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            // Start local game as fallback
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
        }
    }, [gameState.difficulty, userId]);

    // Reset game
    const resetGame = useCallback(async () => {
        // Mark current game as abandoned if active
        if (gameState.gameId && gameState.gameStatus === 'playing') {
            try {
                await ApiService.updateGame(gameState.gameId, {
                    status: 'abandoned',
                    score: gameState.score,
                    moves: gameState.moves,
                    time_elapsed: gameState.timeElapsed,
                    matched_pairs: gameState.matchedPairs,
                });
            } catch (error) {
                console.error('Failed to abandon game session:', error);
            }
        }

        setGameState(prev => ({
            ...initialGameState,
            difficulty: prev.difficulty,
            cards: generateCards(prev.difficulty),
            sessionId: prev.sessionId,
        }));
    }, [gameState.gameId, gameState.gameStatus, gameState.score, gameState.moves, gameState.timeElapsed, gameState.matchedPairs]);

    // Change difficulty
    const changeDifficulty = useCallback(async (newDifficulty: 'easy' | 'medium' | 'hard') => {
        // Mark current game as abandoned if active
        if (gameState.gameId && gameState.gameStatus === 'playing') {
            try {
                await ApiService.updateGame(gameState.gameId, {
                    status: 'abandoned',
                    score: gameState.score,
                    moves: gameState.moves,
                    time_elapsed: gameState.timeElapsed,
                    matched_pairs: gameState.matchedPairs,
                });
            } catch (error) {
                console.error('Failed to abandon game session:', error);
            }
        }

        setGameState(prev => ({
            ...initialGameState,
            difficulty: newDifficulty,
            cards: generateCards(newDifficulty),
            sessionId: prev.sessionId,
        }));
    }, [gameState.gameId, gameState.gameStatus, gameState.score, gameState.moves, gameState.timeElapsed, gameState.matchedPairs]);

    // Get cat fact from backend
    const getCatFactReward = useCallback(async (): Promise<CatFact | null> => {
        if (!gameState.gameId) {
            // Fallback to API call if no game session
            try {
                const response = await ApiService.getRandomCatFact();
                if (response.success && response.data) {
                    return response.data;
                }
            } catch (error) {
                console.error('Failed to get cat fact:', error);
            }
            return null;
        }

        try {
            const response = await ApiService.addFactToGame(gameState.gameId);
            if (response.success && response.data) {
                return response.data.fact;
            }
        } catch (error) {
            console.error('Failed to add fact to game:', error);
        }

        return null;
    }, [gameState.gameId]);

    // Show cat fact reward
    const showCatFactReward = useCallback(async () => {
        const fact = await getCatFactReward();
        if (fact) {
            setGameState(prev => ({
                ...prev,
                catFacts: [...prev.catFacts, fact],
                currentFact: fact,
                showFact: true,
            }));

            // Hide fact after 3 seconds
            setTimeout(() => {
                setGameState(prev => ({
                    ...prev,
                    showFact: false,
                    currentFact: null,
                }));
            }, 3000);
        }
    }, [getCatFactReward]);

    // Complete game
    const completeGame = useCallback(async (finalScore: number) => {
        if (gameState.gameId) {
            try {
                await ApiService.updateGame(gameState.gameId, {
                    status: 'won',
                    score: finalScore,
                    moves: gameState.moves,
                    time_elapsed: gameState.timeElapsed,
                    matched_pairs: gameState.matchedPairs,
                });
                console.log('Game completed on backend');
            } catch (error) {
                console.error('Failed to complete game on backend:', error);
            }
        }
    }, [gameState.gameId, gameState.moves, gameState.timeElapsed, gameState.matchedPairs]);

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

                    // Complete game if won
                    if (isGameWon) {
                        console.log('Game won! Final score:', newScore);
                        completeGame(newScore);
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
    }, [gameState.cards, gameState.selectedCards, gameState.gameStatus, showCatFactReward, completeGame]);

    return {
        gameState,
        startGame,
        resetGame,
        changeDifficulty,
        handleCardClick,
        isCardClickDisabled: gameState.selectedCards.length >= 2 || gameState.gameStatus !== 'playing',
        updateGameProgress,
    };
};