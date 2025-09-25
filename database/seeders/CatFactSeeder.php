<?php

namespace Database\Seeders;

use App\Models\CatFact;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CatFactSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $factsToSeed = 10;
        $imported = 0;

        $this->command->info("Fetching {$factsToSeed} cat facts from external API...");

        for ($i = 0; $i < $factsToSeed; $i++) {
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
                        $this->command->info("Imported fact {$imported}: " . substr($data['fact'], 0, 50) . '...');
                    }
                }
                
                // Small delay to be respectful to the API
                usleep(200000); // 0.2 seconds
            } catch (\Exception $e) {
                Log::error('Error fetching cat fact: ' . $e->getMessage());
                $this->command->warn("Failed to fetch fact {$i}");
            }
        }

        // Add some fallback facts in case the API fails
        $fallbackFacts = [
            'Cats have been domesticated for over 4,000 years.',
            'A group of cats is called a "clowder."',
            'Cats can rotate their ears 180 degrees.',
            'The first cat in space was a French cat named Felicette in 1963.',
            'Cats have a third eyelid called a "nictitating membrane."',
            'A cat\'s purr vibrates at a frequency that promotes bone healing.',
            'Cats can make over 100 vocal sounds, while dogs only make about 10.',
            'The oldest known pet cat was found in a 9,500-year-old grave.',
            'Cats sleep 12-16 hours per day.',
            'A cat\'s nose print is unique, much like a human\'s fingerprint.',
        ];

        foreach ($fallbackFacts as $fact) {
            if (!CatFact::where('fact', $fact)->exists()) {
                CatFact::create([
                    'fact' => $fact,
                    'length' => strlen($fact),
                    'is_active' => true,
                ]);
                $imported++;
            }
        }

        $this->command->info("Successfully imported {$imported} cat facts!");
        $this->command->info("Total cat facts in database: " . CatFact::count());
    }
}
