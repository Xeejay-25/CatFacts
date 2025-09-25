import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Clock, Target, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Game {
    id: number;
    player: string;
    score: number;
    moves: number;
    time_elapsed: number;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'playing' | 'won' | 'abandoned';
    completed_at: string;
    created_at: string;
    facts_collected: number;
}

interface LeaderboardResponse {
    success: boolean;
    leaderboard: Game[];
}

const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusColors = {
    won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    playing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    abandoned: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function GameHistory() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ id: number; name: string } | null>(null);

    useEffect(() => {
        // Get selected user from sessionStorage
        const userId = sessionStorage.getItem('selectedUserId');
        const userJson = sessionStorage.getItem('selectedUser');

        if (userId && userJson) {
            try {
                const userData = JSON.parse(userJson);
                setSelectedUser({
                    id: parseInt(userId),
                    name: userData.name
                });
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchGameHistory();
        }
    }, [selectedUser]);

    const fetchGameHistory = async () => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`/api/games/leaderboard?user_id=${selectedUser.id}&limit=50`);
            const data: LeaderboardResponse = await response.json();

            if (data.success && data.leaderboard) {
                setGames(data.leaderboard);
            }
        } catch (error) {
            console.error('Failed to fetch game history:', error);
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
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 1000) return 'text-green-600 dark:text-green-400';
        if (score >= 500) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    return (
        <>
            <Head title="Game History" />

            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Link href="/game">
                                    <Button variant="ghost" size="sm">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Game
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Game History
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {selectedUser ? `${selectedUser.name}'s game history` : 'View completed memory games'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-300">Loading game history...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && games.length === 0 && (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        No games yet!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                                        Complete some memory games to see your history here.
                                    </p>
                                    <Link href="/">
                                        <Button>
                                            Start Playing
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Games List */}
                        {!loading && games.length > 0 && (
                            <div className="space-y-4">
                                {games.map((game) => (
                                    <Card key={game.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <CardTitle className="text-lg">
                                                        {game.player} - Game #{game.id}
                                                    </CardTitle>
                                                    <Badge className={difficultyColors[game.difficulty]}>
                                                        {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                                                    </Badge>
                                                    <Badge className={statusColors[game.status]}>
                                                        {game.status === 'won' ? 'Completed' : game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <CardDescription>
                                                    {formatDate(game.completed_at || game.created_at)}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {/* Score */}
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">Score</p>
                                                        <p className={`font-semibold ${getScoreColor(game.score)}`}>
                                                            {game.score.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Time */}
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">Time</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {formatTime(game.time_elapsed)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Moves */}
                                                <div className="flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">Moves</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {game.moves}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Facts Collected */}
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-purple-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">Facts</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {game.facts_collected}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}