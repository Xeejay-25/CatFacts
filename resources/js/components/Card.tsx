import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '@/types/game';

interface CardComponentProps {
    card: CardType;
    onClick: () => void;
    isDisabled: boolean;
}

const CardComponent: React.FC<CardComponentProps> = ({ card, onClick, isDisabled }) => {
    const { isFlipped, isMatched, symbol } = card;

    return (
        <div className="relative w-full aspect-square">
            <motion.div
                className={`absolute inset-0 w-full h-full cursor-pointer ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                onClick={!isDisabled ? onClick : undefined}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Card Back (shown when not flipped) */}
                <div
                    className={`absolute inset-0 w-full h-full rounded-xl shadow-lg backface-hidden ${isMatched
                            ? 'bg-gradient-to-br from-green-400 to-green-600 border-2 border-green-300'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-300'
                        }`}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                    }}
                >
                    <div className="flex items-center justify-center h-full">
                        <div className="text-4xl">
                            {isMatched ? '✨' : '🐾'}
                        </div>
                    </div>
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="h-full w-full bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
                    </div>
                </div>

                {/* Card Front (shown when flipped) */}
                <div
                    className={`absolute inset-0 w-full h-full rounded-xl shadow-lg backface-hidden ${isMatched
                            ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400'
                            : 'bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300'
                        }`}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <div className="flex items-center justify-center h-full">
                        <motion.div
                            className="text-6xl sm:text-5xl md:text-6xl"
                            initial={{ scale: 0 }}
                            animate={{ scale: isFlipped || isMatched ? 1 : 0 }}
                            transition={{ delay: 0.3, duration: 0.3, ease: 'backOut' }}
                        >
                            {symbol}
                        </motion.div>
                    </div>

                    {/* Success glow effect for matched cards */}
                    {isMatched && (
                        <motion.div
                            className="absolute inset-0 rounded-xl bg-green-400/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CardComponent;