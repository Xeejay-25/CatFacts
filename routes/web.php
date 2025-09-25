<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/play', function () {
    return Inertia::render('play');
})->name('play');

Route::get('/play/select', function () {
    return Inertia::render('user-select');
})->name('play.select');

Route::get('/play/create', function () {
    return Inertia::render('user-create');
})->name('play.create');

Route::get('/game', function () {
    return Inertia::render('game');
})->name('game');

Route::get('/history', function () {
    return Inertia::render('history');
})->name('history');

Route::get('/leaderboard', function () {
    return Inertia::render('leaderboard');
})->name('leaderboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
