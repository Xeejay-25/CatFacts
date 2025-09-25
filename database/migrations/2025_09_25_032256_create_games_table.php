<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->unique(); // For anonymous users
            $table->enum('difficulty', ['easy', 'medium', 'hard']);
            $table->integer('score');
            $table->integer('moves');
            $table->integer('time_elapsed'); // in seconds
            $table->integer('matched_pairs');
            $table->integer('total_pairs');
            $table->enum('status', ['playing', 'won', 'abandoned'])->default('playing');
            $table->json('collected_facts')->nullable(); // Store IDs of collected cat facts
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            // Add indexes for better performance
            $table->index(['user_id', 'created_at']);
            $table->index('session_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
