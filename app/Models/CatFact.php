<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class CatFact extends Model
{
    protected $fillable = [
        'fact',
        'length',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Scope to get only active facts
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by minimum length
     */
    public function scopeMinLength(Builder $query, int $minLength): Builder
    {
        return $query->where('length', '>=', $minLength);
    }

    /**
     * Scope to filter by maximum length
     */
    public function scopeMaxLength(Builder $query, int $maxLength): Builder
    {
        return $query->where('length', '<=', $maxLength);
    }

    /**
     * Get a random cat fact (with caching for better performance)
     */
    public static function random(): ?self
    {
        // Cache for 5 minutes to reduce DB load for random facts
        return Cache::remember('random_cat_fact_pool', 300, function () {
            return static::active()->inRandomOrder()->take(10)->get();
        })->random();
    }

    /**
     * Get multiple random facts efficiently
     */
    public static function randomMultiple(int $count = 5): \Illuminate\Support\Collection
    {
        return static::active()
            ->inRandomOrder()
            ->limit($count)
            ->get(['id', 'fact', 'length']);
    }

    /**
     * Get facts by length range
     */
    public static function byLengthRange(int $minLength = 0, int $maxLength = 1000): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()
            ->minLength($minLength)
            ->maxLength($maxLength)
            ->orderBy('length')
            ->get(['id', 'fact', 'length']);
    }

    /**
     * Search facts by content
     */
    public static function search(string $query, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()
            ->where('fact', 'LIKE', "%{$query}%")
            ->orderBy('length')
            ->limit($limit)
            ->get(['id', 'fact', 'length']);
    }

    /**
     * Get fact statistics
     */
    public static function getStatistics(): array
    {
        return Cache::remember('cat_facts_statistics', 3600, function () {
            $total = static::count();
            $active = static::active()->count();
            $avgLength = static::active()->avg('length');
            $minLength = static::active()->min('length');
            $maxLength = static::active()->max('length');
            
            return [
                'total_facts' => $total,
                'active_facts' => $active,
                'inactive_facts' => $total - $active,
                'average_length' => round($avgLength, 2),
                'shortest_length' => $minLength,
                'longest_length' => $maxLength,
            ];
        });
    }
}
