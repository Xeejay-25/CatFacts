<?php

namespace App\Services;

use App\Models\Game;
use App\Models\CatFact;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GameService
{
    /**
     * Calculate optimized game score
     */
    public function calculateScore(Game $game): int
    {
        return Game::calculateScore(
            $game->matched_pairs,
            $game->moves,
            $game->time_elapsed,
            $game->difficulty
        );
    }

    /**
     * Complete a game and update related statistics
     */
    public function completeGame(Game $game, array $finalStats = []): Game
    {
        DB::beginTransaction();
        
        try {
            // Update game with final stats
            $game->update(array_merge([
                'status' => 'won',
                'completed_at' => now(),
            ], $finalStats));

            // Recalculate score if not provided
            if (!isset($finalStats['score'])) {
                $game->score = $this->calculateScore($game);
                $game->save();
            }

            // Clear related caches
            $this->clearGameCaches($game);

            DB::commit();
            
            return $game->fresh();
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Get leaderboard data with caching
     */
    public function getLeaderboard(array $filters = []): array
    {
        $cacheKey = 'game_leaderboard_' . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 300, function () use ($filters) {
            $query = Game::with(['user:id,name']);

            // Apply filters
            if (!empty($filters['difficulty'])) {
                $query->byDifficulty($filters['difficulty']);
            }

            if (!empty($filters['user_id'])) {
                $query->where('user_id', $filters['user_id']);
            }

            if (empty($filters['include_all'])) {
                $query->completed();
            }

            if (!empty($filters['recent_days'])) {
                $query->recent($filters['recent_days']);
            }

            $limit = min($filters['limit'] ?? 10, 50);

            return $query->orderBy('score', 'desc')
                ->orderBy('time_elapsed', 'asc')
                ->limit($limit)
                ->get()
                ->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'player' => $game->user ? $game->user->name : 'Anonymous',
                        'score' => $game->score,
                        'moves' => $game->moves,
                        'time_elapsed' => $game->time_elapsed,
                        'difficulty' => $game->difficulty,
                        'status' => $game->status,
                        'completed_at' => $game->completed_at,
                        'facts_collected' => count($game->collected_facts ?? []),
                    ];
                });
        });
    }

    /**
     * Get game analytics
     */
    public function getGameAnalytics(): array
    {
        return Cache::remember('game_analytics', 600, function () {
            $totalGames = Game::count();
            $completedGames = Game::completed()->count();
            $totalPlayers = User::withCompletedGames()->count();
            $anonymousGames = Game::whereNull('user_id')->count();

            // Games by difficulty
            $gamesByDifficulty = Game::select('difficulty')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('difficulty')
                ->pluck('count', 'difficulty')
                ->toArray();

            // Average completion stats
            $completionStats = Game::completed()
                ->selectRaw('
                    AVG(score) as avg_score,
                    AVG(time_elapsed) as avg_time,
                    AVG(moves) as avg_moves,
                    MAX(score) as highest_score,
                    MIN(time_elapsed) as fastest_time
                ')
                ->first();

            return [
                'total_games' => $totalGames,
                'completed_games' => $completedGames,
                'completion_rate' => $totalGames > 0 ? round(($completedGames / $totalGames) * 100, 2) : 0,
                'total_players' => $totalPlayers,
                'anonymous_games' => $anonymousGames,
                'games_by_difficulty' => $gamesByDifficulty,
                'average_stats' => [
                    'score' => round($completionStats->avg_score ?? 0),
                    'time_elapsed' => round($completionStats->avg_time ?? 0),
                    'moves' => round($completionStats->avg_moves ?? 0),
                    'highest_score' => $completionStats->highest_score ?? 0,
                    'fastest_time' => $completionStats->fastest_time ?? 0,
                ]
            ];
        });
    }

    /**
     * Clear game-related caches
     */
    public function clearGameCaches(Game $game): void
    {
        $patterns = [
            'game_leaderboard_*',
            'game_analytics',
            'leaderboard_*',
            'user_stats_*',
            'user_details_' . $game->user_id,
        ];

        foreach ($patterns as $pattern) {
            if (str_contains($pattern, '*')) {
                // For patterns with wildcards, we'd need a more sophisticated cache tagging system
                // For now, just clear common keys
                Cache::forget(str_replace('*', '', $pattern));
            } else {
                Cache::forget($pattern);
            }
        }
    }

    /**
     * Validate game state for updates
     */
    public function validateGameUpdate(Game $game, array $updateData): array
    {
        $errors = [];

        // Don't allow updating completed games
        if ($game->isCompleted()) {
            $errors[] = 'Cannot update a completed game';
        }

        // Validate moves don't decrease
        if (isset($updateData['moves']) && $updateData['moves'] < $game->moves) {
            $errors[] = 'Moves cannot decrease';
        }

        // Validate time doesn't decrease
        if (isset($updateData['time_elapsed']) && $updateData['time_elapsed'] < $game->time_elapsed) {
            $errors[] = 'Time elapsed cannot decrease';
        }

        // Validate matched pairs don't exceed total
        if (isset($updateData['matched_pairs']) && $updateData['matched_pairs'] > $game->total_pairs) {
            $errors[] = 'Matched pairs cannot exceed total pairs';
        }

        // Validate score is reasonable
        if (isset($updateData['score']) && $updateData['score'] < 0) {
            $errors[] = 'Score cannot be negative';
        }

        return $errors;
    }
}