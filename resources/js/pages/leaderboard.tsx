import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Star, Clock, Target, Medal, Crown } from 'lucide-react';

interface LeaderboardEntry {
    id: number;
    player: string;
    score: number;
    moves: number;
    time_elapsed: number;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'won' | 'playing' | 'abandoned';
    completed_at: string;
    created_at: string;
    facts_collected: number;
}

interface UserRanking {
    user_id: number;
    name: string;
    total_games: number;
    completed_games: number;
    total_score: number;
    best_score: number;
    average_score: number;
    average_time: number;
    facts_collected: number;
}

export default function Leaderboard() {
    const [topGames, setTopGames] = useState<LeaderboardEntry[]>([]);
    const [topPlayers, setTopPlayers] = useState<UserRanking[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboards();
    }, [selectedDifficulty]);

    const fetchLeaderboards = async () => {
        setLoading(true);
        try {
            // Fetch top games
            const gamesParam = selectedDifficulty !== 'all' ? `?difficulty=${selectedDifficulty}&limit=10` : '?limit=10';
            const gamesResponse = await fetch(`/api/games/leaderboard${gamesParam}`);
            const gamesData = await gamesResponse.json();

            // Fetch top players
            const playersResponse = await fetch('/api/users/leaderboard');
            const playersData = await playersResponse.json();

            if (gamesData.success) {
                setTopGames(gamesData.leaderboard || []);
            }

            if (playersData.success) {
                setTopPlayers(playersData.leaderboard || []);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboards:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
        if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="w-5 h-5 flex items-center justify-center font-bold text-gray-500">#{index + 1}</span>;
    };

    const difficultyColors = {
        easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
        <>
            <Head title="Leaderboard - Cat Facts Memory Game" />

            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center justify-between mb-8"
                        >
                            <div className="flex items-center gap-4">
                                <Link href="/">
                                    <Button variant="ghost" size="sm">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Game
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold text-indigo-700">
                                        🏆 Leaderboard
                                    </h1>
                                    <p className="text-gray-600">
                                        Top scores and player rankings
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading leaderboards...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Top Games */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                                Top Game Scores
                                            </CardTitle>
                                            <CardDescription>
                                                Best individual game performances
                                            </CardDescription>
                                            
                                            {/* Difficulty Filter */}
                                            <div className="flex gap-2 mt-4">
                                                {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
                                                    <Button
                                                        key={difficulty}
                                                        size="sm"
                                                        variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                                                        onClick={() => setSelectedDifficulty(difficulty)}
                                                        className="capitalize"
                                                    >
                                                        {difficulty}
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {topGames.length === 0 ? (
                                                <p className="text-center text-gray-500 py-8">
                                                    No completed games yet!
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {topGames.map((game, index) => (
                                                        <motion.div
                                                            key={game.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            className={`flex items-center justify-between p-3 rounded-lg border ${
                                                                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {getRankIcon(index)}
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">
                                                                        {game.player}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {formatDate(game.completed_at || game.created_at)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-3">
                                                                <Badge className={difficultyColors[game.difficulty]}>
                                                                    {game.difficulty}
                                                                </Badge>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-lg text-gray-900">
                                                                        {game.score.toLocaleString()}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {formatTime(game.time_elapsed)} • {game.moves} moves
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Top Players */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Star className="w-5 h-5 text-purple-500" />
                                                Top Players
                                            </CardTitle>
                                            <CardDescription>
                                                Best overall player statistics
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {topPlayers.length === 0 ? (
                                                <p className="text-center text-gray-500 py-8">
                                                    No players yet!
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {topPlayers.map((player, index) => (
                                                        <motion.div
                                                            key={player.user_id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                                            className={`p-4 rounded-lg border ${
                                                                index < 3 ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    {getRankIcon(index)}
                                                                    <div className="font-semibold text-lg text-gray-900">
                                                                        {player.name}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-xl text-purple-600">
                                                                        {player.best_score.toLocaleString()}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">Best Score</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center mb-1">
                                                                        <Target className="w-4 h-4 text-blue-500 mr-1" />
                                                                    </div>
                                                                    <div className="font-semibold">{player.completed_games}</div>
                                                                    <div className="text-gray-500">Completed</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center mb-1">
                                                                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                                                    </div>
                                                                    <div className="font-semibold">{Math.round(player.average_score).toLocaleString()}</div>
                                                                    <div className="text-gray-500">Avg Score</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="flex items-center justify-center mb-1">
                                                                        <Clock className="w-4 h-4 text-green-500 mr-1" />
                                                                    </div>
                                                                    <div className="font-semibold">{formatTime(player.average_time)}</div>
                                                                    <div className="text-gray-500">Avg Time</div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}