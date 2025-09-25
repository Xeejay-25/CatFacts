<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get a random cat fact
     */
    public static function random()
    {
        return static::active()->inRandomOrder()->first();
    }
}
