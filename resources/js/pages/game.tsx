import React, { useEffect, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import GameBoard from "@/components/GameBoard";
import CelebrationAnimation from "@/components/CelebrationAnimation";

// Memory Game Component with full functionality
function MemoryGameComponent({ user }: { user: { id: number; name: string } }) {
    const [celebrationState, setCelebrationState] = useState({
        showMain: false,
        showFact: false
    });

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
            setCelebrationState(prev => ({ ...prev, showMain: true }));
            const timer = setTimeout(() =>
                setCelebrationState(prev => ({ ...prev, showMain: false })), 6000);
            return () => clearTimeout(timer);
        }
    }, [gameState.gameStatus]);

    // Trigger fact celebration when new cat fact is added
    useEffect(() => {
        const factCount = gameState.catFacts.length;
        if (factCount > 0) {
            setCelebrationState(prev => ({ ...prev, showFact: true }));
            const timer = setTimeout(() =>
                setCelebrationState(prev => ({ ...prev, showFact: false })), 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState.catFacts.length]);

    return (
        <>
            <Head title="Cat Facts Memory Game" />
            <div className="h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 overflow-hidden">
                <div className="h-full flex flex-col p-2">
                    {/* Compact Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex justify-between items-center mb-2"
                    >
                        <div className="flex items-center gap-2 ml-3.5">
                            <h1 className="text-4xl font-bold">
                                🐱 <span className="bg-gradient-to-r from-yellow-300 via-pink-600 to-blue-600 bg-clip-text text-transparent">Cat Facts Memory</span>
                            </h1>
                            <div className="text-1xl px-2 py-1 bg-green-500 text-white rounded-full font-medium">
                                {user.name}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href="/play/select"
                                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-l font-medium rounded-md transition-colors shadow-md"
                            >
                                Switch
                            </Link>
                            <Link
                                href="/history"
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-l font-medium rounded-md transition-colors shadow-md"
                            >
                                History
                            </Link>
                        </div>
                    </motion.div>

                    {/* Main Game Grid Layout */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
                        
                        {/* Left Panel - Stats & Controls */}
                        <div className="lg:col-span-1 space-y-3 ml-3">
                            {/* Game Stats */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4"
                            >
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Game Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Score</span>
                                        <span className="text-lg font-bold text-blue-600">🏆 {gameState.score}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Moves</span>
                                        <span className="text-lg font-bold text-green-600">🎯 {gameState.moves}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Pairs</span>
                                        <span className="text-lg font-bold text-purple-600">💝 {gameState.matchedPairs}/{totalPairs}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Time</span>
                                        <span className="text-lg font-bold text-orange-600 font-mono">⏱️ {Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Game Controls */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4"
                            >
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Controls</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={gameState.gameStatus === 'playing' ? resetGame : startGame}
                                        className={`w-full px-3 py-2 text-white rounded-lg text-xs font-medium transition-all duration-300 ${
                                            gameState.gameStatus === 'idle' 
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                        }`}
                                    >
                                        {gameState.gameStatus === 'idle' ? '🎮 Start Game' : '🔄 Reset Game'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Clear session data
                                            sessionStorage.removeItem('selectedUserId');
                                            sessionStorage.removeItem('selectedUser');
                                            // Clear browser history to prevent back navigation
                                            window.history.replaceState(null, '', '/play');
                                            window.history.pushState(null, '', '/play');
                                            // Redirect to play page
                                            router.visit('/play', { replace: true });
                                        }}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-medium transition-all duration-300"
                                    >
                                        🚪 Exit Game
                                    </button>
                                    <select
                                        value={gameState.difficulty}
                                        onChange={(e) => changeDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-medium focus:outline-none cursor-pointer"
                                    >
                                        <option value="easy" className="bg-purple-600">🟢 Easy (4x3)</option>
                                        <option value="medium" className="bg-purple-600">🟡 Medium (6x4)</option>
                                        <option value="hard" className="bg-purple-600">🔴 Hard (6x6)</option>
                                    </select>
                                </div>
                            </motion.div>

                            {/* Cat Facts Panel */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 flex-1"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Cat Facts</h3>
                                    <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full font-medium">
                                        📚 {gameState.catFacts.length}
                                    </div>
                                </div>
                                
                                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                                    {gameState.catFacts.length === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="text-gray-400 text-3xl mb-3">🐱</div>
                                            <p className="text-xs text-gray-500">
                                                Match cards to unlock<br />fascinating cat facts!
                                            </p>
                                        </div>
                                    ) : (
                                        gameState.catFacts.map((fact, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className="group"
                                            >
                                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-lg p-3 hover:shadow-sm transition-all duration-200">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                            {index + 1}
                                                        </div>
                                                        <p className="text-xs text-gray-700 leading-relaxed flex-1">{fact.fact}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Center Panel - Game Board */}
                        <div className="lg:col-span-2 flex flex-col min-h-0 mr-10">
                            <div className="flex-1 flex items-start justify-center ">
                                <GameBoard
                                    cards={gameState.cards}
                                    onCardClick={handleCardClick}
                                    difficulty={gameState.difficulty}
                                    isDisabled={isCardClickDisabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Win Modal */}
                {gameState.gameStatus === 'won' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="fixed inset-0 flex items-center justify-center"
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

                    {/* Celebrations */}
                    {celebrationState.showMain && <CelebrationAnimation isVisible={celebrationState.showMain} />}
                    {celebrationState.showFact && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, x: 100 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.5, x: 100 }}
                            className="fixed top-6 right-6 z-50"
                        >
                            <div className="bg-white/95 backdrop-blur-sm border border-yellow-200/50 rounded-2xl shadow-2xl p-4 max-w-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-xl">🐱</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                                            New Cat Fact!
                                        </div>
                                        <div className="text-xs text-gray-600 font-medium">
                                            Check the side panel →
                                        </div>
                                    </div>
                                </div>
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
