<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Game;
use App\Http\Requests\CreateUserRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Get users with their game statistics (cached for performance)
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $cacheKey = 'user_stats_' . $request->get('limit', 50);
            $limit = min($request->get('limit', 50), 100); // Cap at 100
            
            $data = Cache::remember($cacheKey, 300, function () use ($limit) {
                $totalGames = Game::count();
                $totalUsers = User::count();
                
                $users = User::select([
                    'users.id',
                    'users.name', 
                    'users.email',
                    'users.created_at'
                ])
                ->withCount([
                    'games as games_played',
                    'games as completed_games' => function ($query) {
                        $query->where('status', 'won');
                    }
                ])
                ->withSum('games as total_score', 'score')
                ->withMax('games as best_score', 'score')
                ->withAvg('games as average_time', 'time_elapsed')
                ->having('games_played', '>', 0) // Only show users who have played
                ->orderBy('best_score', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($user) {
                    // Get the game with the highest score to determine difficulty
                    $bestGame = $user->games()
                        ->select('difficulty')
                        ->orderBy('score', 'desc')
                        ->first();
                    
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'games_played' => $user->games_played ?? 0,
                        'completed_games' => $user->completed_games ?? 0,
                        'total_score' => (int) ($user->total_score ?? 0),
                        'best_score' => $user->best_score ?? 0,
                        'best_score_difficulty' => $bestGame ? $bestGame->difficulty : null,
                        'average_time' => round($user->average_time ?? 0),
                        'created_at' => $user->created_at->toISOString(),
                    ];
                });

                return [
                    'total_users' => $totalUsers,
                    'total_games' => $totalGames,
                    'active_users' => $users->count(),
                    'users' => $users,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching user stats: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch user statistics',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Create a new user with optimized validation
     */
    public function store(CreateUserRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            $validated = $request->validated();
            
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $validated['name'] . '@catfacts.local',
                'password' => bcrypt('password'), // Default password for game users
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'games_played' => 0,
                        'total_score' => 0,
                        'best_score' => 0,
                        'average_time' => 0,
                        'created_at' => $user->created_at->toISOString(),
                    ]
                ],
                'message' => 'User created successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error creating user: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to create user',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get leaderboard of top players (optimized with single query)
     */
    public function leaderboard(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'limit' => 'sometimes|integer|min:1|max:100',
                'difficulty' => 'sometimes|in:easy,medium,hard',
                'period' => 'sometimes|in:day,week,month,all'
            ]);

            $limit = $request->get('limit', 20);
            $difficulty = $request->get('difficulty');
            $period = $request->get('period', 'all');
            
            $cacheKey = "leaderboard_users_{$limit}_{$difficulty}_{$period}";
            
            $leaderboard = Cache::remember($cacheKey, 600, function () use ($limit, $difficulty, $period) {
                $query = User::select([
                    'users.id as user_id',
                    'users.name',
                    DB::raw('COUNT(games.id) as total_games'),
                    DB::raw('COUNT(CASE WHEN games.status = "won" THEN 1 END) as completed_games'),
                    DB::raw('COALESCE(SUM(games.score), 0) as total_score'),
                    DB::raw('COALESCE(MAX(games.score), 0) as best_score'),
                    DB::raw('COALESCE(AVG(CASE WHEN games.status = "won" THEN games.score END), 0) as average_score'),
                    DB::raw('COALESCE(AVG(CASE WHEN games.status = "won" THEN games.time_elapsed END), 0) as average_time'),
                    DB::raw('COALESCE(SUM(JSON_LENGTH(COALESCE(games.collected_facts, "[]"))), 0) as facts_collected'),
                ])
                ->leftJoin('games', 'users.id', '=', 'games.user_id');

                // Filter by difficulty if specified
                if ($difficulty) {
                    $query->where('games.difficulty', $difficulty);
                }
                
                // Filter by time period if specified
                if ($period !== 'all') {
                    $days = match($period) {
                        'day' => 1,
                        'week' => 7,
                        'month' => 30,
                        default => 365
                    };
                    $query->where('games.created_at', '>=', now()->subDays($days));
                }

                return $query->groupBy('users.id', 'users.name')
                    ->having('total_games', '>', 0) // Show users who have played games
                    ->orderBy('best_score', 'desc')
                    ->orderBy('average_score', 'desc')
                    ->limit($limit)
                    ->get()
                    ->map(function ($player, $index) {
                        return [
                            'rank' => $index + 1,
                            'user_id' => $player->user_id,
                            'name' => $player->name,
                            'total_games' => (int) $player->total_games,
                            'completed_games' => (int) $player->completed_games,
                            'total_score' => (int) $player->total_score,
                            'best_score' => (int) $player->best_score,
                            'average_score' => round($player->average_score),
                            'average_time' => round($player->average_time),
                            'facts_collected' => (int) $player->facts_collected,
                        ];
                    });
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'leaderboard' => $leaderboard,
                    'filters' => [
                        'limit' => $limit,
                        'difficulty' => $difficulty,
                        'period' => $period,
                    ],
                    'total_entries' => $leaderboard->count(),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching leaderboard: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch leaderboard',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get a specific user's details and statistics
     */
    public function show(User $user): JsonResponse
    {
        try {
            $cacheKey = "user_details_{$user->id}";
            
            $userDetails = Cache::remember($cacheKey, 300, function () use ($user) {
                // Get comprehensive stats using the model method
                $stats = $user->getGameStatistics();
                
                // Get recent games
                $recentGames = $user->recentGames(7)
                    ->select(['id', 'difficulty', 'score', 'status', 'completed_at', 'created_at'])
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();

                // Get best game details
                $bestGame = $user->getBestGame();

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'created_at' => $user->created_at->toISOString(),
                    ],
                    'statistics' => $stats,
                    'recent_games' => $recentGames->map(function ($game) {
                        return [
                            'id' => $game->id,
                            'difficulty' => $game->difficulty,
                            'score' => $game->score,
                            'status' => $game->status,
                            'completed_at' => $game->completed_at,
                            'created_at' => $game->created_at,
                        ];
                    }),
                    'best_game' => $bestGame ? [
                        'id' => $bestGame->id,
                        'difficulty' => $bestGame->difficulty,
                        'score' => $bestGame->score,
                        'moves' => $bestGame->moves,
                        'time_elapsed' => $bestGame->time_elapsed,
                        'completed_at' => $bestGame->completed_at,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $userDetails
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching user details: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch user details',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 404);
        }
    }
}
