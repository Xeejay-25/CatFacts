<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatFact;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

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
                    'fact' => $fact->fact,
                    'source' => 'database'
                ]);
            }

            // If no facts in database, fetch from external API
            return $this->fetchFromExternalApi();
        } catch (\Exception $e) {
            Log::error('Error fetching cat fact: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Unable to fetch cat fact',
                'fact' => 'Cats are amazing creatures! 🐱' // Fallback fact
            ], 500);
        }
    }

    /**
     * Fetch multiple cat facts to populate database
     */
    public function populate(Request $request): JsonResponse
    {
        $count = $request->get('count', 50); // Default to 50 facts
        $imported = 0;

        try {
            for ($i = 0; $i < $count; $i++) {
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
                    }
                }
                
                // Small delay to be respectful to the API
                usleep(100000); // 0.1 second
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$imported} new cat facts",
                'imported' => $imported,
                'total_in_database' => CatFact::count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error populating cat facts: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error populating cat facts',
                'imported' => $imported
            ], 500);
        }
    }

    /**
     * Get all cat facts with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $facts = CatFact::active()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $facts
        ]);
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
                    $exists = CatFact::where('fact', $data['fact'])->exists();
                    if (!$exists) {
                        CatFact::create([
                            'fact' => $data['fact'],
                            'length' => $data['length'] ?? strlen($data['fact']),
                            'is_active' => true,
                        ]);
                    }
                    
                    return response()->json([
                        'success' => true,
                        'fact' => $data['fact'],
                        'source' => 'external_api'
                    ]);
                }
                
                throw new \Exception('External API request failed');
            } catch (\Exception $e) {
                Log::error('External API error: ' . $e->getMessage());
                
                return response()->json([
                    'success' => true,
                    'fact' => 'Cats have been domesticated for over 4,000 years! 🐱',
                    'source' => 'fallback'
                ]);
            }
        });
    }
}
