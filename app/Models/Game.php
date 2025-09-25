<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class Game extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'difficulty',
        'score',
        'moves',
        'time_elapsed',
        'matched_pairs',
        'total_pairs',
        'status',
        'collected_facts',
        'completed_at',
    ];

    protected $casts = [
        'collected_facts' => 'array',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the game
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get completed games
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'won');
    }

    /**
     * Scope to get games by difficulty
     */
    public function scopeByDifficulty(Builder $query, string $difficulty): Builder
    {
        return $query->where('difficulty', $difficulty);
    }

    /**
     * Scope to get games for a specific user or session
     */
    public function scopeForUserOrSession(Builder $query, ?int $userId = null, ?string $sessionId = null): Builder
    {
        return $query->when($userId, function ($q) use ($userId) {
            return $q->where('user_id', $userId);
        })->when($sessionId && !$userId, function ($q) use ($sessionId) {
            return $q->where('session_id', $sessionId);
        });
    }

    /**
     * Scope to get recent games
     */
    public function scopeRecent(Builder $query, int $days = 7): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Get the collected cat facts for this game with optimized query
     */
    public function getCollectedCatFacts(): Collection
    {
        if (!$this->collected_facts || empty($this->collected_facts)) {
            return collect();
        }

        return CatFact::whereIn('id', $this->collected_facts)
            ->select(['id', 'fact', 'length'])
            ->get();
    }

    /**
     * Add a fact to the collected facts
     */
    public function addCollectedFact(int $factId): bool
    {
        $collectedFacts = $this->collected_facts ?? [];
        
        if (!in_array($factId, $collectedFacts)) {
            $collectedFacts[] = $factId;
            $this->collected_facts = $collectedFacts;
            return $this->save();
        }
        
        return true; // Already collected
    }

    /**
     * Get total pairs based on difficulty
     */
    public static function getTotalPairsForDifficulty(string $difficulty): int
    {
        return match($difficulty) {
            'easy' => 8,
            'medium' => 12,
            'hard' => 18,
            default => 8,
        };
    }

    /**
     * Check if game is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'won';
    }

    /**
     * Mark game as completed
     */
    public function markAsCompleted(): bool
    {
        $this->status = 'won';
        $this->completed_at = now();
        return $this->save();
    }

    /**
     * Calculate score based on performance metrics
     */
    public static function calculateScore(int $matchedPairs, int $moves, int $timeElapsed, string $difficulty): int
    {
        $baseScore = $matchedPairs * 100;
        
        // Difficulty multiplier
        $multiplier = match($difficulty) {
            'easy' => 1.0,
            'medium' => 1.5,
            'hard' => 2.0,
            default => 1.0,
        };
        
        // Time bonus (faster completion gets higher bonus)
        $timeBonus = max(0, 3000 - $timeElapsed);
        
        // Move penalty (fewer moves is better)
        $movePenalty = max(0, $moves - $matchedPairs * 2) * 10;
        
        $finalScore = (int) (($baseScore + $timeBonus - $movePenalty) * $multiplier);
        
        return max(0, $finalScore);
    }
}
