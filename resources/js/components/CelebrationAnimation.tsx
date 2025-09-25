import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CelebrationAnimationProps {
    isVisible: boolean;
}

const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({ isVisible }) => {
    const emojis = useMemo(() => ['🎉', '✨', '🐱', '🌟', '🎊', '💫'], []);
    const confettiArray = useMemo(() => Array.from({ length: 20 }), []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-40">
            {emojis.map((emoji, index) => (
                <motion.div
                    key={index}
                    className="absolute text-4xl"
                    initial={{
                        opacity: 0,
                        scale: 0,
                        x: Math.random() * window.innerWidth,
                        y: window.innerHeight + 50
                    }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1, 1.2, 0],
                        y: -100,
                        rotate: 360
                    }}
                    transition={{
                        duration: 3,
                        delay: index * 0.2,
                        ease: 'easeOut'
                    }}
                >
                    {emoji}
                </motion.div>
            ))}

            {/* Confetti particles */}
            {confettiArray.map((_, index) => (
                <motion.div
                    key={`confetti-${index}`}
                    className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                    initial={{
                        opacity: 1,
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                    }}
                    animate={{
                        opacity: [1, 0],
                        x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
                        y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
                        scale: [1, 0]
                    }}
                    transition={{
                        duration: 2,
                        delay: index * 0.1,
                        ease: 'easeOut'
                    }}
                />
            ))}
        </div>
    );
};

export default CelebrationAnimation;