<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the games for this user
     */
    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }

    /**
     * Get completed games only
     */
    public function completedGames(): HasMany
    {
        return $this->games()->completed();
    }

    /**
     * Get recent games (within specified days)
     */
    public function recentGames(int $days = 7): HasMany
    {
        return $this->games()->recent($days);
    }

    /**
     * Scope for users with at least one completed game
     */
    public function scopeWithCompletedGames(Builder $query): Builder
    {
        return $query->whereHas('games', function ($q) {
            $q->completed();
        });
    }

    /**
     * Scope for active users (played recently)
     */
    public function scopeActive(Builder $query, int $days = 30): Builder
    {
        return $query->whereHas('games', function ($q) use ($days) {
            $q->where('created_at', '>=', now()->subDays($days));
        });
    }

    /**
     * Get user's game statistics
     */
    public function getGameStatistics(): array
    {
        $gamesQuery = $this->games();
        
        return [
            'total_games' => $gamesQuery->count(),
            'completed_games' => $gamesQuery->completed()->count(),
            'total_score' => $gamesQuery->sum('score'),
            'best_score' => $gamesQuery->max('score'),
            'average_score' => round($gamesQuery->completed()->avg('score') ?? 0),
            'average_time' => round($gamesQuery->completed()->avg('time_elapsed') ?? 0),
            'total_facts_collected' => $gamesQuery->completed()
                ->get()
                ->sum(function ($game) {
                    return count($game->collected_facts ?? []);
                }),
            'favorite_difficulty' => $this->getFavoriteDifficulty(),
        ];
    }

    /**
     * Get user's favorite difficulty level
     */
    public function getFavoriteDifficulty(): ?string
    {
        return $this->games()
            ->select('difficulty')
            ->groupBy('difficulty')
            ->orderByRaw('COUNT(*) DESC')
            ->value('difficulty');
    }

    /**
     * Get user's best game
     */
    public function getBestGame(): ?Game
    {
        return $this->games()
            ->completed()
            ->orderBy('score', 'desc')
            ->first();
    }
}
