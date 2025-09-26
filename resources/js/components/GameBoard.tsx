import React from 'react';
import { motion } from 'framer-motion';
import CardComponent from './Card';
import { Card as CardType } from '@/types/game';
import { getGridConfig } from '@/lib/gameUtils';

interface GameBoardProps {
    cards: CardType[];
    onCardClick: (cardId: number) => void;
    difficulty: 'easy' | 'medium' | 'hard';
    isDisabled: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
    cards,
    onCardClick,
    difficulty,
    isDisabled
}) => {
    const { gridCols } = getGridConfig(difficulty);

    // Adjust card size and spacing based on difficulty
    const getCardSizing = () => {
        switch (difficulty) {
            case 'hard':
                return {
                    maxWidth: `${gridCols * 90}px`, // Smaller cards for 6x6 grid
                    gap: 'gap-2 mt-15',
                };
            case 'medium':
                return {
                    maxWidth: `${gridCols * 100}px`, // Medium cards
                    gap: 'gap-3 mt-5'
                };
            default: // easy
                return {
                    maxWidth: `${gridCols * 120}px`, // Larger cards for easy
                    gap: 'gap-3 sm:gap-4 mt-20'
                };
        }
    };

    const { maxWidth, gap } = getCardSizing();

    return (
        <div className="w-full max-w-4xl mx-auto p-2">
            <motion.div
                className={`grid ${gap} mx-auto`}
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    maxWidth
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: index * 0.05,
                            ease: 'easeOut'
                        }}
                        className="w-full"
                    >
                        <CardComponent
                            card={card}
                            onClick={() => onCardClick(card.id)}
                            isDisabled={isDisabled}
                            difficulty={difficulty}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default GameBoard;