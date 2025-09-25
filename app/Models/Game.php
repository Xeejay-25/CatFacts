<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    public function scopeCompleted($query)
    {
        return $query->where('status', 'won');
    }

    /**
     * Scope to get games by difficulty
     */
    public function scopeByDifficulty($query, $difficulty)
    {
        return $query->where('difficulty', $difficulty);
    }

    /**
     * Get the collected cat facts for this game
     */
    public function getCollectedCatFacts()
    {
        if (!$this->collected_facts) {
            return collect();
        }

        return CatFact::whereIn('id', $this->collected_facts)->get();
    }
}
