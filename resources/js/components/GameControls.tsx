import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Play, Trophy, Clock, Target } from 'lucide-react';
import { formatTime } from '@/lib/gameUtils';

interface GameControlsProps {
    score: number;
    moves: number;
    timeElapsed: number;
    gameStatus: 'idle' | 'playing' | 'won';
    difficulty: 'easy' | 'medium' | 'hard';
    matchedPairs: number;
    totalPairs: number;
    onStart: () => void;
    onReset: () => void;
    onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const GameControls: React.FC<GameControlsProps> = ({
    score,
    moves,
    timeElapsed,
    gameStatus,
    difficulty,
    matchedPairs,
    totalPairs,
    onStart,
    onReset,
    onDifficultyChange,
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Game Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                    whileHover={{ scale: 1.05 }}
                >
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{score}</div>
                    <div className="text-sm text-gray-600">Score</div>
                </motion.div>

                <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                    whileHover={{ scale: 1.05 }}
                >
                    <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{moves}</div>
                    <div className="text-sm text-gray-600">Moves</div>
                </motion.div>

                <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                    whileHover={{ scale: 1.05 }}
                >
                    <Clock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{formatTime(timeElapsed)}</div>
                    <div className="text-sm text-gray-600">Time</div>
                </motion.div>

                <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center"
                    whileHover={{ scale: 1.05 }}
                >
                    <div className="text-4xl mb-2">🐱</div>
                    <div className="text-2xl font-bold text-gray-800">{matchedPairs}/{totalPairs}</div>
                    <div className="text-sm text-gray-600">Pairs</div>
                </motion.div>
            </div>

            {/* Game Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
                {/* Difficulty Selection */}
                <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <motion.button
                            key={level}
                            onClick={() => onDifficultyChange(level)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${difficulty === level
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
                    {gameStatus === 'idle' && (
                        <motion.button
                            onClick={onStart}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Play className="w-5 h-5" />
                            Start Game
                        </motion.button>
                    )}

                    <motion.button
                        onClick={onReset}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RotateCcw className="w-5 h-5" />
                        {gameStatus === 'idle' ? 'New Game' : 'Reset'}
                    </motion.button>
                </div>
            </div>

            {/* Game Status Messages */}
            <div className="text-center">
                {gameStatus === 'idle' && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg text-gray-700"
                    >
                        Ready to play? Match pairs of cats to earn cat facts! 🐾
                    </motion.p>
                )}

                {gameStatus === 'won' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-2xl shadow-xl"
                    >
                        <div className="text-4xl mb-2">🎉</div>
                        <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
                        <p className="text-lg">
                            You completed the game in {moves} moves and {formatTime(timeElapsed)}!
                        </p>
                        <p className="text-xl font-bold mt-2">Final Score: {score}</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default GameControls;