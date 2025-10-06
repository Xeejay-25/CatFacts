<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\CatFact;
use App\Http\Requests\StartGameRequest;
use App\Http\Requests\UpdateGameRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GameController extends Controller
{
    /**
     * Start a new game session
     */
    public function start(StartGameRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            $sessionId = $request->session_id ?: Str::uuid()->toString();
            $difficulty = $request->difficulty;
            $userId = $request->user_id ?? Auth::id();

            // Calculate total pairs based on difficulty
            $totalPairs = Game::getTotalPairsForDifficulty($difficulty);

            $game = Game::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'difficulty' => $difficulty,
                'score' => 0,
                'moves' => 0,
                'time_elapsed' => 0,
                'matched_pairs' => 0,
                'total_pairs' => $totalPairs,
                'status' => 'playing',
            ]);

            // Clear leaderboard cache for this user when new game is created
            $this->clearLeaderboardCache($userId);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'game' => $game->only([
                        'id', 'session_id', 'difficulty', 'score', 'moves', 
                        'time_elapsed', 'matched_pairs', 'total_pairs', 'status'
                    ]),
                    'session_id' => $sessionId,
                ],
                'message' => 'Game started successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to start game',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update game progress
     */
    public function update(UpdateGameRequest $request, $gameId): JsonResponse
    {
        try {
            $game = $request->game_model ?? Game::findOrFail($gameId);
            
            // Prevent updating completed games
            if ($game->isCompleted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot update a completed game'
                ], 422);
            }

            DB::beginTransaction();

            $updateData = $request->validated();
            
            // Auto-complete game if all pairs are matched
            if (isset($updateData['matched_pairs']) && $updateData['matched_pairs'] >= $game->total_pairs) {
                $updateData['status'] = 'won';
                $updateData['completed_at'] = now();
                
                // Calculate optimized score if not provided
                if (!isset($updateData['score'])) {
                    $updateData['score'] = Game::calculateScore(
                        $updateData['matched_pairs'],
                        $updateData['moves'] ?? $game->moves,
                        $updateData['time_elapsed'] ?? $game->time_elapsed,
                        $game->difficulty
                    );
                }
            }

            $game->update($updateData);
            
            // Clear leaderboard cache for this user when game is updated
            $this->clearLeaderboardCache($game->user_id);
            
            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'game' => $game->fresh()->only([
                        'id', 'session_id', 'difficulty', 'score', 'moves',
                        'time_elapsed', 'matched_pairs', 'total_pairs', 'status',
                        'completed_at'
                    ])
                ],
                'message' => $game->isCompleted() ? 'Game completed!' : 'Game updated successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update game',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Add a cat fact to game (when player makes a match)
     */
    public function addFact(Request $request, $gameId): JsonResponse
    {
        try {
            $game = $request->game_model ?? Game::findOrFail($gameId);

            // Get a random cat fact that hasn't been collected yet
            $excludeIds = $game->collected_facts ?? [];
            $fact = CatFact::active()
                ->when(!empty($excludeIds), function ($query) use ($excludeIds) {
                    return $query->whereNotIn('id', $excludeIds);
                })
                ->inRandomOrder()
                ->first(['id', 'fact', 'length']);

            if (!$fact) {
                // If no new facts available, get any random fact
                $fact = CatFact::random();
            }

            if (!$fact) {
                return response()->json([
                    'success' => false,
                    'message' => 'No cat facts available'
                ], 404);
            }

            DB::beginTransaction();
            
            // Add fact to collected facts
            $game->addCollectedFact($fact->id);
            
            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'fact' => $fact->only(['id', 'fact']),
                    'facts_collected' => count($game->fresh()->collected_facts ?? [])
                ],
                'message' => 'Cat fact collected!'
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add cat fact',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get game by ID or session
     */
    public function show(Request $request, $gameId): JsonResponse
    {
        try {
            $game = Game::with(['user:id,name'])
                ->findOrFail($gameId);

            // Get collected cat facts
            $collectedFacts = $game->getCollectedCatFacts();

            return response()->json([
                'success' => true,
                'data' => [
                    'game' => [
                        'id' => $game->id,
                        'user' => $game->user ? $game->user->only(['id', 'name']) : null,
                        'session_id' => $game->session_id,
                        'difficulty' => $game->difficulty,
                        'score' => $game->score,
                        'moves' => $game->moves,
                        'time_elapsed' => $game->time_elapsed,
                        'matched_pairs' => $game->matched_pairs,
                        'total_pairs' => $game->total_pairs,
                        'status' => $game->status,
                        'completed_at' => $game->completed_at,
                        'created_at' => $game->created_at,
                        'facts_collected_count' => $collectedFacts->count(),
                    ],
                    'collected_facts' => $collectedFacts->map(function ($fact) {
                        return $fact->only(['id', 'fact']);
                    }),
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Game not found',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 404);
        }
    }

    /**
     * Get leaderboard with optimized queries
     */
    public function leaderboard(Request $request): JsonResponse
    {
        try {
            $difficulty = $request->get('difficulty');
            $userId = $request->get('user_id');
            $limit = min($request->get('limit', 10), 50); // Cap at 50
            $includeAll = $request->boolean('include_all', false);
            $orderBy = $request->get('order_by', 'score'); // 'score' or 'date'

            $cacheKey = "leaderboard_{$difficulty}_{$userId}_{$limit}_{$includeAll}_{$orderBy}";
            
            $leaderboard = Cache::remember($cacheKey, 300, function () use ($difficulty, $userId, $limit, $includeAll, $orderBy) {
                $query = Game::with(['user:id,name']);

                // Filter by user if provided
                if ($userId) {
                    $query->where('user_id', $userId);
                }

                // If include_all is false (default), only show completed games
                if (!$includeAll) {
                    $query->completed();
                }

                if ($difficulty) {
                    $query->byDifficulty($difficulty);
                }

                // Order by date for history view, score for leaderboard view
                if ($orderBy === 'date') {
                    $query->orderBy('created_at', 'desc');
                } else {
                    $query->orderBy('score', 'desc')
                          ->orderBy('time_elapsed', 'asc');
                }

                return $query->limit($limit)
                    ->get(['id', 'user_id', 'score', 'moves', 'time_elapsed', 
                           'difficulty', 'status', 'completed_at', 'created_at', 'collected_facts']);
            });

            $formattedLeaderboard = $leaderboard->map(function ($game) {
                return [
                    'id' => $game->id,
                    'player' => $game->user ? $game->user->name : 'Anonymous',
                    'score' => $game->score,
                    'moves' => $game->moves,
                    'time_elapsed' => $game->time_elapsed,
                    'difficulty' => $game->difficulty,
                    'status' => $game->status,
                    'completed_at' => $game->completed_at,
                    'created_at' => $game->created_at,
                    'facts_collected' => count($game->collected_facts ?? []),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'leaderboard' => $formattedLeaderboard,
                    'total_entries' => $formattedLeaderboard->count(),
                    'filters' => [
                        'difficulty' => $difficulty,
                        'user_id' => $userId,
                        'include_all' => $includeAll,
                        'order_by' => $orderBy,
                        'limit' => $limit,
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch leaderboard',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get user's game history
     */
    public function history(Request $request): JsonResponse
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $perPage = min($request->get('per_page', 10), 50); // Cap at 50
            $difficulty = $request->get('difficulty');
            $status = $request->get('status');

            $query = Game::where('user_id', Auth::id());
            
            if ($difficulty) {
                $query->byDifficulty($difficulty);
            }
            
            if ($status) {
                $query->where('status', $status);
            }

            $games = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, [
                    'id', 'difficulty', 'score', 'moves', 'time_elapsed',
                    'matched_pairs', 'total_pairs', 'status', 'completed_at',
                    'created_at', 'collected_facts'
                ]);

            return response()->json([
                'success' => true,
                'data' => $games,
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch game history',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Clear leaderboard cache for a specific user
     */
    private function clearLeaderboardCache($userId): void
    {
        // Clear game leaderboard cache
        $difficulties = ['easy', 'medium', 'hard', null];
        $limits = [10, 50]; // Common limit values
        $includeAllValues = [true, false];
        $orderByValues = ['score', 'date'];

        foreach ($difficulties as $difficulty) {
            foreach ($limits as $limit) {
                foreach ($includeAllValues as $includeAll) {
                    foreach ($orderByValues as $orderBy) {
                        $cacheKey = "leaderboard_{$difficulty}_{$userId}_{$limit}_{$includeAll}_{$orderBy}";
                        Cache::forget($cacheKey);
                    }
                }
            }
        }

        // Clear user leaderboard cache (used by leaderboard page)
        $userLimits = [20, 100]; // Common user leaderboard limits
        $userDifficulties = ['easy', 'medium', 'hard', null];
        $periods = ['day', 'week', 'month', 'all'];

        foreach ($userLimits as $limit) {
            foreach ($userDifficulties as $difficulty) {
                foreach ($periods as $period) {
                    $cacheKey = "leaderboard_players_{$limit}_{$difficulty}_{$period}";
                    Cache::forget($cacheKey);
                }
            }
        }
    }
}
