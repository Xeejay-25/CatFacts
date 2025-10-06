<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Game;
use Illuminate\Support\Facades\Auth;

class GameAuthorization
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $gameId = $request->route('game');
        
        if (!$gameId) {
            return response()->json([
                'success' => false,
                'message' => 'Game ID is required.'
            ], 400);
        }

        $game = Game::find($gameId);
        
        if (!$game) {
            return response()->json([
                'success' => false,
                'message' => 'Game not found.'
            ], 404);
        }

        // Check authorization
        $sessionId = $request->header('X-Session-ID') ?? $request->get('session_id');
        $userId = Auth::id();

        $isAuthorized = false;

        // Check if user owns the game (authenticated user)
        if ($userId && $game->user_id && $game->user_id == $userId) {
            $isAuthorized = true;
        }
        
        // Check if session matches (anonymous user)
        elseif ($sessionId && $game->session_id === $sessionId) {
            $isAuthorized = true;
        }
        
        // Check if this is a game with no user and no session (legacy data)
        elseif (!$game->user_id && !$game->session_id) {
            $isAuthorized = true;
        }

        if (!$isAuthorized) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access this game.'
            ], 403);
        }

        // Add game to request for controller use
        $request->merge(['game_model' => $game]);

        return $next($request);
    }
}