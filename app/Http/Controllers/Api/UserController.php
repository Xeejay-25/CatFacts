<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Get users with their game statistics
     */
    public function stats(): JsonResponse
    {
        $totalGames = Game::count();
        
        $users = User::withCount([
            'games as games_played',
            'games as completed_games' => function ($query) {
                $query->where('status', 'won');
            }
        ])
        ->withSum('games as total_score', 'score')
        ->withMax('games as best_score', 'score')
        ->withAvg('games as average_time', 'time_elapsed')
        ->orderBy('best_score', 'desc')
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'games_played' => $user->games_played ?? 0,
                'total_score' => (int) ($user->total_score ?? 0),
                'best_score' => $user->best_score ?? 0,
                'average_time' => round($user->average_time ?? 0),
                'created_at' => $user->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'total_users' => $users->count(),
            'total_games' => $totalGames,
            'users' => $users,
        ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:users,name',
            'email' => 'nullable|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email ?? $request->name . '@catfacts.local',
            'password' => bcrypt('password'), // Default password for game users
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'games_played' => 0,
                'total_score' => 0,
                'best_score' => 0,
                'average_time' => 0,
                'created_at' => $user->created_at->toISOString(),
            ],
        ]);
    }

    /**
     * Get leaderboard of top players
     */
    public function leaderboard(): JsonResponse
    {
        $leaderboard = User::select([
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
        ->leftJoin('games', 'users.id', '=', 'games.user_id')
        ->groupBy('users.id', 'users.name')
        ->having('completed_games', '>', 0) // Only show users with completed games
        ->orderBy('best_score', 'desc')
        ->orderBy('average_score', 'desc')
        ->limit(20)
        ->get()
        ->map(function ($player) {
            return [
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

        return response()->json([
            'success' => true,
            'leaderboard' => $leaderboard,
        ]);
    }

    /**
     * Get a specific user's details and statistics
     */
    public function show(User $user): JsonResponse
    {
        $stats = $user->games()
            ->selectRaw('
                COUNT(*) as total_games,
                COUNT(CASE WHEN status = "won" THEN 1 END) as completed_games,
                COALESCE(SUM(score), 0) as total_score,
                COALESCE(MAX(score), 0) as best_score,
                COALESCE(AVG(CASE WHEN status = "won" THEN score END), 0) as average_score,
                COALESCE(AVG(CASE WHEN status = "won" THEN time_elapsed END), 0) as average_time
            ')
            ->first();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->toISOString(),
                'stats' => [
                    'total_games' => (int) $stats->total_games,
                    'completed_games' => (int) $stats->completed_games,
                    'total_score' => (int) $stats->total_score,
                    'best_score' => (int) $stats->best_score,
                    'average_score' => round($stats->average_score),
                    'average_time' => round($stats->average_time),
                ],
            ],
        ]);
    }
}
