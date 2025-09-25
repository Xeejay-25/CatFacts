<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\CatFact;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class GameController extends Controller
{
    /**
     * Start a new game session
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'difficulty' => 'required|in:easy,medium,hard',
            'session_id' => 'nullable|string'
        ]);

        $sessionId = $request->session_id ?: Str::uuid()->toString();
        $difficulty = $request->difficulty;

        // Calculate total pairs based on difficulty
        $totalPairs = match($difficulty) {
            'easy' => 8,
            'medium' => 12,
            'hard' => 18,
        };

        $game = Game::create([
            'user_id' => Auth::id(),
            'session_id' => $sessionId,
            'difficulty' => $difficulty,
            'score' => 0,
            'moves' => 0,
            'time_elapsed' => 0,
            'matched_pairs' => 0,
            'total_pairs' => $totalPairs,
            'status' => 'playing',
        ]);

        return response()->json([
            'success' => true,
            'game' => $game,
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Update game progress
     */
    public function update(Request $request, $gameId): JsonResponse
    {
        $request->validate([
            'score' => 'sometimes|integer|min:0',
            'moves' => 'sometimes|integer|min:0',
            'time_elapsed' => 'sometimes|integer|min:0',
            'matched_pairs' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:playing,won,abandoned',
        ]);

        $game = Game::findOrFail($gameId);

        // Verify ownership (user or session)
        if ($game->user_id && $game->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $game->update($request->only([
            'score', 'moves', 'time_elapsed', 'matched_pairs', 'status'
        ]));

        if ($request->status === 'won') {
            $game->completed_at = now();
            $game->save();
        }

        return response()->json([
            'success' => true,
            'game' => $game->fresh(),
        ]);
    }

    /**
     * Add a cat fact to game (when player makes a match)
     */
    public function addFact(Request $request, $gameId): JsonResponse
    {
        $game = Game::findOrFail($gameId);

        // Verify ownership
        if ($game->user_id && $game->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get a random cat fact
        $fact = CatFact::random();

        if (!$fact) {
            return response()->json([
                'success' => false,
                'message' => 'No cat facts available'
            ], 404);
        }

        // Add fact to collected facts
        $collectedFacts = $game->collected_facts ?? [];
        if (!in_array($fact->id, $collectedFacts)) {
            $collectedFacts[] = $fact->id;
            $game->collected_facts = $collectedFacts;
            $game->save();
        }

        return response()->json([
            'success' => true,
            'fact' => $fact->fact,
            'game' => $game->fresh(),
        ]);
    }

    /**
     * Get game by ID or session
     */
    public function show(Request $request, $gameId): JsonResponse
    {
        $game = Game::with('user')->findOrFail($gameId);

        // Include collected cat facts
        $collectedFacts = $game->getCollectedCatFacts();

        return response()->json([
            'success' => true,
            'game' => $game,
            'collected_facts' => $collectedFacts->map(function ($fact) {
                return [
                    'id' => $fact->id,
                    'fact' => $fact->fact,
                ];
            }),
        ]);
    }

    /**
     * Get leaderboard
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $difficulty = $request->get('difficulty');
        $limit = $request->get('limit', 10);

        $query = Game::completed()
            ->with('user')
            ->orderBy('score', 'desc')
            ->orderBy('time_elapsed', 'asc')
            ->limit($limit);

        if ($difficulty) {
            $query->byDifficulty($difficulty);
        }

        $games = $query->get();

        return response()->json([
            'success' => true,
            'leaderboard' => $games->map(function ($game) {
                return [
                    'id' => $game->id,
                    'player' => $game->user ? $game->user->name : 'Anonymous',
                    'score' => $game->score,
                    'moves' => $game->moves,
                    'time_elapsed' => $game->time_elapsed,
                    'difficulty' => $game->difficulty,
                    'completed_at' => $game->completed_at,
                    'facts_collected' => count($game->collected_facts ?? []),
                ];
            }),
        ]);
    }

    /**
     * Get user's game history
     */
    public function history(Request $request): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $games = Game::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'games' => $games,
        ]);
    }
}
