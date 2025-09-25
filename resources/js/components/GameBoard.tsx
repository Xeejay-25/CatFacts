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

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <motion.div
                className={`grid gap-3 sm:gap-4 mx-auto`}
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    maxWidth: `${gridCols * 120}px`
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
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default GameBoard;