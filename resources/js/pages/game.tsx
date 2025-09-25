import React, { useEffect, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import GameBoard from "@/components/GameBoard";
import CelebrationAnimation from "@/components/CelebrationAnimation";

// Memory Game Component with full functionality
function MemoryGameComponent({ user }: { user: { id: number; name: string } }) {
    const [showCelebration, setShowCelebration] = useState(false);
    const [showFactCelebration, setShowFactCelebration] = useState(false);

    const {
        gameState,
        startGame,
        resetGame,
        changeDifficulty,
        handleCardClick,
        isCardClickDisabled,
    } = useMemoryGame('easy', user.id);

    const totalPairs = Math.floor(gameState.cards.length / 2);

    // Trigger celebration when game is won
    useEffect(() => {
        if (gameState.gameStatus === 'won') {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [gameState.gameStatus]);

    // Trigger fact celebration when new cat fact is added
    useEffect(() => {
        const factCount = gameState.catFacts.length;
        if (factCount > 0) {
            setShowFactCelebration(true);
            const timer = setTimeout(() => setShowFactCelebration(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState.catFacts.length]);

    return (
        <>
            <Head title="Cat Facts Memory Game" />
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        <div className="flex justify-center mb-4">
                            <div className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-md mr-4">
                                🎮 Playing as: <strong className="ml-2">{user.name}</strong>
                            </div>
                            <Link
                                href="/play/select"
                                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors"
                            >
                                🔄 Switch Player
                            </Link>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Cat Facts Memory Game
                        </h1>
                        <p className="text-lg text-gray-600">
                            Match the cards to learn fun facts about cats!
                        </p>
                    </motion.div>

                    {/* Game Stats */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-xl shadow-lg p-6 mb-8"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-600">
                                    {gameState.score}
                                </div>
                                <div className="text-sm text-blue-500">Score</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-600">
                                    {gameState.moves}
                                </div>
                                <div className="text-sm text-green-500">Moves</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-600">
                                    {gameState.matchedPairs}/{totalPairs}
                                </div>
                                <div className="text-sm text-purple-500">Pairs</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-orange-600">
                                    {Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="text-sm text-orange-500">Time</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Game Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-4 mb-8"
                    >
                        <button
                            onClick={startGame}
                            disabled={gameState.gameStatus === 'playing'}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                        >
                            {gameState.gameStatus === 'idle' ? 'Start Game' : 'Playing...'}
                        </button>
                        <button
                            onClick={resetGame}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Reset Game
                        </button>
                        <select
                            value={gameState.difficulty}
                            onChange={(e) => changeDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="easy">Easy (4x3)</option>
                            <option value="medium">Medium (4x4)</option>
                            <option value="hard">Hard (6x4)</option>
                        </select>
                    </motion.div>

                    {/* Game Board */}
                    <GameBoard
                        cards={gameState.cards}
                        onCardClick={handleCardClick}
                        difficulty={gameState.difficulty}
                        isDisabled={isCardClickDisabled}
                    />

                    {/* Cat Facts Display */}
                    {gameState.catFacts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl shadow-lg p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-2xl mr-2">🐱</span>
                                Cat Facts You've Learned ({gameState.catFacts.length})
                            </h3>
                            <div className="space-y-3">
                                {gameState.catFacts.map((fact, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="bg-white rounded-lg p-4 shadow-sm"
                                    >
                                        <p className="text-gray-700">{fact}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Win Modal */}
                    {gameState.gameStatus === 'won' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4">
                                <div className="text-6xl mb-4">🎉</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                                    Congratulations!
                                </h2>
                                <p className="text-lg text-gray-600 mb-6">
                                    You completed the game in <strong>{gameState.moves}</strong> moves
                                    and <strong>{Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}</strong>!
                                </p>
                                <div className="text-2xl font-bold text-green-600 mb-6">
                                    Final Score: {gameState.score}
                                </div>
                                <button
                                    onClick={resetGame}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-lg transition-colors"
                                >
                                    Play Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Celebrations */}
                {showCelebration && <CelebrationAnimation isVisible={showCelebration} />}
                {showFactCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed top-4 right-4 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-lg shadow-lg z-40"
                    >
                        <div className="flex items-center">
                            <span className="text-xl mr-2">🐱</span>
                            New Cat Fact Unlocked!
                        </div>
                    </motion.div>
                )}
            </div>
        </>
    );
}

export default function Game() {
    const [selectedUser, setSelectedUser] = useState<{ id: number, name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('Game page loading, checking for selected user...');
        const userId = sessionStorage.getItem('selectedUserId');
        const userJson = sessionStorage.getItem('selectedUser');

        if (userId && userJson) {
            try {
                const userData = JSON.parse(userJson);
                setSelectedUser({
                    id: parseInt(userId),
                    name: userData.name
                });
                setIsLoading(false);
            } catch (error) {
                console.error('Error parsing user data:', error);
                sessionStorage.removeItem('selectedUserId');
                sessionStorage.removeItem('selectedUser');
                setTimeout(() => router.visit('/play/select'), 500);
            }
        } else {
            setTimeout(() => router.visit('/play/select'), 1000);
        }
    }, []);

    if (isLoading) {
        return (
            <>
                <Head title="Cat Facts Memory Game" />
                <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-xl text-gray-700 mb-4">Loading game...</div>
                    </div>
                </div>
            </>
        );
    }

    if (!selectedUser) {
        return (
            <>
                <Head title="Cat Facts Memory Game" />
                <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-xl text-gray-700 mb-4">No user selected</div>
                        <div className="text-sm text-gray-600">Redirecting...</div>
                    </div>
                </div>
            </>
        );
    }

    return <MemoryGameComponent user={selectedUser} />;
}
