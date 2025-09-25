import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import GameControls from "@/components/GameControls";
import GameBoard from "@/components/GameBoard";
import CatFactModal from "@/components/CatFactModal";
import CelebrationAnimation from "@/components/CelebrationAnimation";

export default function Home() {
    const {
        gameState,
        startGame,
        resetGame,
        changeDifficulty,
        handleCardClick,
        closeCatFact,
        isCardClickDisabled,
    } = useMemoryGame('easy');

    const [showCelebration, setShowCelebration] = useState(false);

    const totalPairs = Math.floor(gameState.cards.length / 2);

    // Trigger celebration when game is won
    useEffect(() => {
        if (gameState.gameStatus === 'won') {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [gameState.gameStatus]);

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
                        <h1 className="text-5xl sm:text-6xl font-extrabold text-indigo-700 mb-4">
                            🐱 Cat Facts Memory Game
                        </h1>
                        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                            Match pairs of adorable cats and earn fascinating cat facts as rewards!
                        </p>
                    </motion.div>

                    {/* Game Controls */}
                    <GameControls
                        score={gameState.score}
                        moves={gameState.moves}
                        timeElapsed={gameState.timeElapsed}
                        gameStatus={gameState.gameStatus}
                        difficulty={gameState.difficulty}
                        matchedPairs={gameState.matchedPairs}
                        totalPairs={totalPairs}
                        onStart={startGame}
                        onReset={resetGame}
                        onDifficultyChange={changeDifficulty}
                    />

                    {/* Game Board */}
                    <GameBoard
                        cards={gameState.cards}
                        onCardClick={handleCardClick}
                        difficulty={gameState.difficulty}
                        isDisabled={isCardClickDisabled}
                    />

                    {/* Cat Facts Collection Display */}
                    {gameState.catFacts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto"
                        >
                            <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">
                                🏆 Your Cat Facts Collection ({gameState.catFacts.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {gameState.catFacts.map((fact, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">🐾</div>
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                {fact}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Cat Fact Modal */}
                <CatFactModal
                    isOpen={gameState.showFact}
                    fact={gameState.currentFact || ''}
                    onClose={closeCatFact}
                />

                {/* Celebration Animation */}
                <CelebrationAnimation isVisible={showCelebration} />
            </div>
        </>
    );
}
