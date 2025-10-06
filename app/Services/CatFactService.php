<?php

namespace App\Services;

use App\Models\CatFact;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CatFactService
{
    private const EXTERNAL_API_URL = 'https://catfact.ninja/fact';
    private const CACHE_DURATION = 300; // 5 minutes

    /**
     * Get a random cat fact with intelligent caching
     */
    public function getRandomFact(): ?CatFact
    {
        // Try to get from optimized cache pool
        $fact = Cache::remember('random_fact_pool', self::CACHE_DURATION, function () {
            return CatFact::active()
                ->inRandomOrder()
                ->limit(20) // Cache a pool of facts for better randomness
                ->get();
        })->random();

        return $fact;
    }

    /**
     * Get multiple unique random facts
     */
    public function getMultipleRandomFacts(int $count): \Illuminate\Support\Collection
    {
        return CatFact::active()
            ->inRandomOrder()
            ->limit($count)
            ->get(['id', 'fact', 'length']);
    }

    /**
     * Search facts with caching
     */
    public function searchFacts(string $query, int $limit = 10): \Illuminate\Support\Collection
    {
        $cacheKey = 'search_facts_' . md5($query) . '_' . $limit;
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($query, $limit) {
            return CatFact::active()
                ->where('fact', 'LIKE', "%{$query}%")
                ->orderBy('length')
                ->limit($limit)
                ->get(['id', 'fact', 'length']);
        });
    }

    /**
     * Populate database with facts from external API
     */
    public function populateFromExternalAPI(int $count = 50): array
    {
        $imported = 0;
        $duplicates = 0;
        $errors = 0;
        $maxErrors = min(5, ceil($count * 0.1)); // Allow up to 10% errors

        DB::beginTransaction();
        
        try {
            for ($i = 0; $i < $count && $errors < $maxErrors; $i++) {
                try {
                    $response = Http::timeout(10)->get(self::EXTERNAL_API_URL);
                    
                    if ($response->successful()) {
                        $data = $response->json();
                        
                        if ($this->saveCatFact($data)) {
                            $imported++;
                        } else {
                            $duplicates++;
                        }
                    } else {
                        $errors++;
                        Log::warning('External API returned non-successful response', [
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                    }
                    
                    // Respectful delay
                    if ($i < $count - 1) {
                        usleep(100000); // 0.1 second
                    }
                } catch (\Exception $e) {
                    $errors++;
                    Log::error('Error fetching cat fact from external API', [
                        'error' => $e->getMessage(),
                        'attempt' => $i + 1
                    ]);
                }
            }

            DB::commit();
            
            // Clear caches after successful import
            $this->clearFactCaches();

            return [
                'imported' => $imported,
                'duplicates' => $duplicates,
                'errors' => $errors,
                'total_requested' => $count,
                'success_rate' => round((($imported + $duplicates) / $count) * 100, 2)
            ];
            
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Failed to populate cat facts', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Get comprehensive statistics about cat facts
     */
    public function getStatistics(): array
    {
        return Cache::remember('cat_facts_detailed_stats', 3600, function () {
            $stats = CatFact::selectRaw('
                COUNT(*) as total_facts,
                COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_facts,
                COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_facts,
                AVG(length) as avg_length,
                MIN(length) as min_length,
                MAX(length) as max_length,
                STDDEV(length) as length_stddev
            ')->first();

            // Get length distribution
            $lengthDistribution = CatFact::active()
                ->selectRaw('
                    CASE 
                        WHEN length < 50 THEN "short"
                        WHEN length < 150 THEN "medium"
                        ELSE "long"
                    END as length_category,
                    COUNT(*) as count
                ')
                ->groupBy('length_category')
                ->pluck('count', 'length_category')
                ->toArray();

            return [
                'total_facts' => (int) $stats->total_facts,
                'active_facts' => (int) $stats->active_facts,
                'inactive_facts' => (int) $stats->inactive_facts,
                'average_length' => round($stats->avg_length, 2),
                'shortest_length' => (int) $stats->min_length,
                'longest_length' => (int) $stats->max_length,
                'length_std_deviation' => round($stats->length_stddev, 2),
                'length_distribution' => $lengthDistribution,
                'last_updated' => CatFact::latest()->first()?->created_at,
            ];
        });
    }

    /**
     * Get a fact from external API with fallback
     */
    public function getFromExternalAPI(): array
    {
        try {
            $response = Http::timeout(10)->get(self::EXTERNAL_API_URL);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // Try to save to database
                $this->saveCatFact($data);
                
                return [
                    'fact' => $data['fact'],
                    'length' => $data['length'] ?? strlen($data['fact']),
                    'source' => 'external_api'
                ];
            }
            
            throw new \Exception('External API request failed');
        } catch (\Exception $e) {
            Log::error('External API error: ' . $e->getMessage());
            
            return [
                'fact' => 'Cats have been domesticated for over 4,000 years! 🐱',
                'length' => 56,
                'source' => 'fallback'
            ];
        }
    }

    /**
     * Save a cat fact to the database (avoiding duplicates)
     */
    private function saveCatFact(array $data): bool
    {
        $fact = trim($data['fact'] ?? '');
        
        if (empty($fact)) {
            return false;
        }

        // Check if fact already exists
        $exists = CatFact::where('fact', $fact)->exists();
        
        if (!$exists) {
            CatFact::create([
                'fact' => $fact,
                'length' => $data['length'] ?? strlen($fact),
                'is_active' => true,
            ]);
            
            return true;
        }
        
        return false; // Duplicate
    }

    /**
     * Clear all fact-related caches
     */
    public function clearFactCaches(): void
    {
        $cacheKeys = [
            'random_fact_pool',
            'cat_facts_detailed_stats',
            'cat_facts_statistics'
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }

        // Clear search caches (this is a simplified approach)
        // In production, you might want to use cache tags or a more sophisticated system
    }

    /**
     * Batch update facts (useful for admin operations)
     */
    public function batchUpdateFactStatus(array $factIds, bool $isActive): int
    {
        $updated = CatFact::whereIn('id', $factIds)
            ->update(['is_active' => $isActive]);

        if ($updated > 0) {
            $this->clearFactCaches();
        }

        return $updated;
    }
}