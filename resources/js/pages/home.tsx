import React, { useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import GameBoard from "@/components/GameBoard";
import CelebrationAnimation from "@/components/CelebrationAnimation";

export default function Home() {
    const {
        gameState,
        startGame,
        resetGame,
        changeDifficulty,
        handleCardClick,
        isCardClickDisabled,
    } = useMemoryGame('easy');

    const [showCelebration, setShowCelebration] = useState(false);
    const [showFactCelebration, setShowFactCelebration] = useState(false);

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
                            <Link
                                href="/history"
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors duration-200"
                            >
                                📊 View Game History
                            </Link>
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-extrabold text-indigo-700 mb-4">
                            🐱 Cat Facts Memory Game
                        </h1>
                        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                            Match pairs of adorable cats and earn fascinating cat facts as rewards!
                        </p>
                    </motion.div>

                    {/* 3 Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Game Stats */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">📊 Game Stats</h2>

                            <motion.div
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                                whileHover={{ scale: 1.05 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="text-3xl mb-2">🏆</div>
                                <div className="text-2xl font-bold text-gray-800">{gameState.score}</div>
                                <div className="text-sm text-gray-600">Score</div>
                            </motion.div>

                            <motion.div
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                                whileHover={{ scale: 1.05 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="text-3xl mb-2">🎯</div>
                                <div className="text-2xl font-bold text-gray-800">{gameState.moves}</div>
                                <div className="text-sm text-gray-600">Moves</div>
                            </motion.div>

                            <motion.div
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                                whileHover={{ scale: 1.05 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="text-3xl mb-2">⏱️</div>
                                <div className="text-2xl font-bold text-gray-800">{Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}</div>
                                <div className="text-sm text-gray-600">Time</div>
                            </motion.div>

                            <motion.div
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                                whileHover={{ scale: 1.05 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="text-3xl mb-2">🐱</div>
                                <div className="text-2xl font-bold text-gray-800">{gameState.matchedPairs}/{totalPairs}</div>
                                <div className="text-sm text-gray-600">Pairs</div>
                            </motion.div>
                        </div>

                        {/* Column 2: Game Controls and Game Board */}
                        <div className="space-y-6">
                            {/* Game Controls */}
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 Game</h2>

                                <div className="flex flex-col gap-4 items-center justify-center mb-4">
                                    {/* Difficulty Selection */}
                                    <div className="flex gap-2">
                                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                                            <motion.button
                                                key={level}
                                                onClick={() => changeDifficulty(level)}
                                                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${gameState.difficulty === level
                                                    ? 'bg-indigo-600 text-white shadow-lg'
                                                    : 'bg-white/80 text-gray-700 hover:bg-white'
                                                    }`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {gameState.gameStatus === 'idle' && (
                                            <motion.button
                                                onClick={startGame}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all text-sm"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span className="text-sm">▶️</span>
                                                Start Game
                                            </motion.button>
                                        )}

                                        <motion.button
                                            onClick={resetGame}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all text-sm"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span className="text-sm">🔄</span>
                                            {gameState.gameStatus === 'idle' ? 'New Game' : 'Reset'}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Game Status Messages */}
                                {gameState.gameStatus === 'idle' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-gray-700 mb-4"
                                    >
                                        Ready to play? Match pairs of cats to earn cat facts! 🐾
                                    </motion.p>
                                )}

                                {gameState.gameStatus === 'won' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-2xl shadow-xl mb-4"
                                    >
                                        <div className="text-3xl mb-2">🎉</div>
                                        <h3 className="text-lg font-bold mb-2">Congratulations!</h3>
                                        <p className="text-sm">
                                            You completed the game in {gameState.moves} moves and {Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}!
                                        </p>
                                        <p className="text-lg font-bold mt-2">Final Score: {gameState.score}</p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Game Board */}
                            <GameBoard
                                cards={gameState.cards}
                                onCardClick={handleCardClick}
                                difficulty={gameState.difficulty}
                                isDisabled={isCardClickDisabled}
                            />
                        </div>

                        {/* Column 3: Cat Facts Collection */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">🏆 Cat Facts Collection</h2>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-indigo-200 h-fit sticky top-4"
                            >
                                <div className="flex items-center justify-center mb-4">
                                    <motion.div
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-full text-lg font-semibold"
                                        animate={showFactCelebration ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {gameState.catFacts.length}
                                    </motion.div>
                                </div>

                                {gameState.catFacts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="text-4xl mb-3">🐾</div>
                                        <p className="text-sm">Match cat pairs to collect fascinating facts!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                        {gameState.catFacts.map((fact, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-200 ${index === gameState.catFacts.length - 1 && showFactCelebration ? 'ring-2 ring-green-400' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="text-lg flex-shrink-0">🐾</div>
                                                    <p className="text-gray-700 text-xs leading-relaxed">
                                                        {fact}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Celebration Animations */}
                <CelebrationAnimation isVisible={showCelebration} />

                {/* Subtle fact celebration */}
                {showFactCelebration && (
                    <motion.div
                        className="fixed top-4 right-4 z-30 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                    >
                        <span className="text-lg">🐾</span>
                        <span className="text-sm font-medium">New cat fact added!</span>
                    </motion.div>
                )}
            </div>
        </>
    );
}
