<?php

use App\Http\Controllers\Api\CatFactController;
use App\Http\Controllers\Api\GameController;
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

// Cat Facts API Routes
Route::prefix('cat-facts')->group(function () {
    Route::get('random', [CatFactController::class, 'random']);
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
    Route::get('{game}', [GameController::class, 'show']); // GET /api/games/{id}
    Route::put('{game}', [GameController::class, 'update']); // PUT /api/games/{id}
    Route::post('{game}/add-fact', [GameController::class, 'addFact']); // POST /api/games/{id}/add-fact
    
    // Protected routes for authenticated users
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user/history', [GameController::class, 'history']);
    });
});