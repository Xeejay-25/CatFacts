<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatFact;
use App\Http\Requests\PopulateCatFactsRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CatFactController extends Controller
{
    /**
     * Get a random cat fact (from database first, external API as fallback)
     */
    public function random(): JsonResponse
    {
        try {
            // First, try to get from database
            $fact = CatFact::random();
            
            if ($fact) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'fact' => $fact->fact,
                        'length' => $fact->length,
                        'source' => 'database'
                    ]
                ]);
            }

            // If no facts in database, fetch from external API
            return $this->fetchFromExternalApi();
        } catch (\Exception $e) {
            Log::error('Error fetching cat fact: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch cat fact',
                'data' => [
                    'fact' => 'Cats are amazing creatures! 🐱',
                    'source' => 'fallback'
                ]
            ], 500);
        }
    }

    /**
     * Get multiple random cat facts
     */
    public function randomMultiple(Request $request): JsonResponse
    {
        try {
            $count = min($request->get('count', 5), 20); // Cap at 20
            
            $facts = CatFact::randomMultiple($count);
            
            if ($facts->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No cat facts available',
                    'data' => []
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'facts' => $facts->map(function ($fact) {
                        return $fact->only(['id', 'fact', 'length']);
                    }),
                    'count' => $facts->count(),
                    'source' => 'database'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching multiple cat facts: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch cat facts',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Search cat facts
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'query' => 'required|string|min:2|max:100',
                'limit' => 'sometimes|integer|min:1|max:50'
            ]);

            $query = $request->get('query');
            $limit = $request->get('limit', 10);
            
            $facts = CatFact::search($query, $limit);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'facts' => $facts->map(function ($fact) {
                        return $fact->only(['id', 'fact', 'length']);
                    }),
                    'query' => $query,
                    'count' => $facts->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching cat facts: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to search cat facts',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Fetch multiple cat facts to populate database
     */
    public function populate(PopulateCatFactsRequest $request): JsonResponse
    {
        try {
            $count = $request->validated()['count'];
            $imported = 0;
            $duplicates = 0;
            $errors = 0;

            DB::beginTransaction();

            for ($i = 0; $i < $count && $errors < 5; $i++) {
                try {
                    $response = Http::timeout(10)->get('https://catfact.ninja/fact');
                    
                    if ($response->successful()) {
                        $data = $response->json();
                        
                        // Check if fact already exists
                        $exists = CatFact::where('fact', $data['fact'])->exists();
                        
                        if (!$exists) {
                            CatFact::create([
                                'fact' => $data['fact'],
                                'length' => $data['length'] ?? strlen($data['fact']),
                                'is_active' => true,
                            ]);
                            $imported++;
                        } else {
                            $duplicates++;
                        }
                    } else {
                        $errors++;
                    }
                    
                    // Small delay to be respectful to the API
                    if ($i < $count - 1) {
                        usleep(100000); // 0.1 second
                    }
                } catch (\Exception $e) {
                    $errors++;
                    Log::warning('Failed to fetch cat fact: ' . $e->getMessage());
                }
            }

            DB::commit();
            
            // Clear cache after populating
            Cache::forget('random_cat_fact_pool');
            Cache::forget('cat_facts_statistics');

            return response()->json([
                'success' => true,
                'data' => [
                    'imported' => $imported,
                    'duplicates' => $duplicates,
                    'errors' => $errors,
                    'total_in_database' => CatFact::count()
                ],
                'message' => "Successfully processed {$count} facts. Imported: {$imported}, Duplicates: {$duplicates}, Errors: {$errors}"
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error populating cat facts: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error populating cat facts',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get all cat facts with pagination and filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'per_page' => 'sometimes|integer|min:1|max:100',
                'min_length' => 'sometimes|integer|min:1',
                'max_length' => 'sometimes|integer|min:1',
                'search' => 'sometimes|string|max:100'
            ]);

            $perPage = $request->get('per_page', 15);
            $minLength = $request->get('min_length');
            $maxLength = $request->get('max_length');
            $search = $request->get('search');

            $query = CatFact::active();

            if ($minLength) {
                $query->minLength($minLength);
            }

            if ($maxLength) {
                $query->maxLength($maxLength);
            }

            if ($search) {
                $query->where('fact', 'LIKE', "%{$search}%");
            }

            $facts = $query->orderBy('length')
                ->paginate($perPage, ['id', 'fact', 'length', 'created_at']);

            return response()->json([
                'success' => true,
                'data' => $facts,
                'filters' => [
                    'min_length' => $minLength,
                    'max_length' => $maxLength,
                    'search' => $search,
                    'per_page' => $perPage,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching cat facts: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch cat facts',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get cat facts statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = CatFact::getStatistics();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching cat facts statistics: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch statistics',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Fetch fact from external API
     */
    private function fetchFromExternalApi(): JsonResponse
    {
        $cacheKey = 'external_cat_fact_' . now()->format('Y-m-d-H');
        
        return Cache::remember($cacheKey, 3600, function () {
            try {
                $response = Http::timeout(10)->get('https://catfact.ninja/fact');
                
                if ($response->successful()) {
                    $data = $response->json();
                    
                    // Optionally save to database for future use
                    try {
                        $exists = CatFact::where('fact', $data['fact'])->exists();
                        if (!$exists) {
                            CatFact::create([
                                'fact' => $data['fact'],
                                'length' => $data['length'] ?? strlen($data['fact']),
                                'is_active' => true,
                            ]);
                            
                            // Clear cache so new fact can be included
                            Cache::forget('random_cat_fact_pool');
                        }
                    } catch (\Exception $e) {
                        // Don't fail the request if we can't save to DB
                        Log::warning('Failed to save external fact to database: ' . $e->getMessage());
                    }
                    
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'fact' => $data['fact'],
                            'length' => $data['length'] ?? strlen($data['fact']),
                            'source' => 'external_api'
                        ]
                    ]);
                }
                
                throw new \Exception('External API request failed');
            } catch (\Exception $e) {
                Log::error('External API error: ' . $e->getMessage());
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'fact' => 'Cats have been domesticated for over 4,000 years! 🐱',
                        'length' => 56,
                        'source' => 'fallback'
                    ]
                ]);
            }
        });
    }
}
