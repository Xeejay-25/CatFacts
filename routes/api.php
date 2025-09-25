<?php

use App\Http\Controllers\Api\CatFactController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// User Management Routes
Route::prefix('users')->group(function () {
    Route::get('stats', [UserController::class, 'stats']);
    Route::get('leaderboard', [UserController::class, 'leaderboard']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('{user}', [UserController::class, 'show']);
});

// Cat Facts API Routes
Route::prefix('cat-facts')->group(function () {
    Route::get('random', [CatFactController::class, 'random']);
    Route::get('random-multiple', [CatFactController::class, 'randomMultiple']);
    Route::get('search', [CatFactController::class, 'search']);
    Route::get('statistics', [CatFactController::class, 'statistics']);
    Route::get('/', [CatFactController::class, 'index']);
    
    // Protected routes for populating database
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('populate', [CatFactController::class, 'populate']);
    });
});

// Game API Routes
Route::prefix('games')->group(function () {
    Route::post('/', [GameController::class, 'start']); // POST /api/games (start new game)
    Route::get('leaderboard', [GameController::class, 'leaderboard']); // GET /api/games/leaderboard
    
    // Routes that require game authorization
    Route::middleware('game.auth')->group(function () {
        Route::get('{game}', [GameController::class, 'show']); // GET /api/games/{id}
        Route::put('{game}', [GameController::class, 'update']); // PUT /api/games/{id}
        Route::post('{game}/add-fact', [GameController::class, 'addFact']); // POST /api/games/{id}/add-fact
    });
    
    // Protected routes for authenticated users
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user/history', [GameController::class, 'history']);
    });
});