import React from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";

export default function SimpleWelcome() {
    return (
        <>
            <Head title="Cat Facts Memory Game" />
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 flex items-center justify-center">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    {/* Title Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-12"
                    >
                        <div className="flex items-center justify-center mb-8">
                            <motion.div
                                animate={{
                                    rotate: [0, -10, 10, -5, 5, 0],
                                    scale: [1, 1.1, 1, 1.05, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 3
                                }}
                                className="text-8xl mr-4"
                            >
                                🐱
                            </motion.div>
                            <div>
                                <h1 className="text-6xl font-bold text-gray-800 mb-4">
                                    Cat Facts
                                </h1>
                                <h2 className="text-4xl font-semibold text-indigo-700">
                                    Memory Game
                                </h2>
                            </div>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
                        >
                            Match cards, score points, and discover fascinating cat facts!
                            Test your memory skills while learning amazing things about our feline friends.
                        </motion.p>
                    </motion.div>

                    {/* Main Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        {/* Play Button */}
                        <Link href="/play">
                            <motion.button
                                whileHover={{
                                    scale: 1.05,
                                    boxShadow: "0 20px 40px rgba(139, 69, 19, 0.3)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="group bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-2xl font-bold py-6 px-12 rounded-2xl shadow-xl transition-all duration-300 min-w-[200px]"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <motion.span
                                        animate={{ rotate: [0, -10, 10, 0] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                        }}
                                    >
                                        🎮
                                    </motion.span>
                                    <span className="group-hover:translate-x-1 transition-transform">
                                        Play
                                    </span>
                                </div>
                            </motion.button>
                        </Link>

                        {/* View Leaderboard Button */}
                        <Link href="/leaderboard">
                            <motion.button
                                whileHover={{
                                    scale: 1.05,
                                    boxShadow: "0 20px 40px rgba(255, 193, 7, 0.3)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="group bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white text-2xl font-bold py-6 px-12 rounded-2xl shadow-xl transition-all duration-300 min-w-[200px]"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 1.5
                                        }}
                                    >
                                        🏆
                                    </motion.span>
                                    <span className="group-hover:translate-x-1 transition-transform">
                                        View Leaderboard
                                    </span>
                                </div>
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Fun Animation Elements */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="mt-16 flex justify-center space-x-8"
                    >
                        {['🃏', '🎯', '⭐', '🧠', '💫'].map((emoji, index) => (
                            <motion.div
                                key={emoji}
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 2 + index * 0.2,
                                    repeat: Infinity,
                                    delay: index * 0.3
                                }}
                                className="text-3xl opacity-60"
                            >
                                {emoji}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </>
    );
}