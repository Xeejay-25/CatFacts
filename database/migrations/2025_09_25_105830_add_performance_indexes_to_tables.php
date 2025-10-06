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
        // Add performance indexes to cat_facts table
        Schema::table('cat_facts', function (Blueprint $table) {
            // Index for ordering by length
            $table->index('length');
            // Composite index for active facts ordered by length
            $table->index(['is_active', 'length']);
        });

        // Add performance indexes to games table
        Schema::table('games', function (Blueprint $table) {
            // Index for difficulty filtering
            $table->index('difficulty');
            // Composite index for leaderboard queries (completed games by score)
            $table->index(['status', 'score', 'time_elapsed']);
            // Index for recent games
            $table->index('created_at');
            // Composite index for user's completed games
            $table->index(['user_id', 'status', 'created_at']);
        });

        // Add performance indexes to users table
        Schema::table('users', function (Blueprint $table) {
            // Index for name searches (if we implement user search later)
            $table->index('name');
            // Index for created_at for analytics
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cat_facts', function (Blueprint $table) {
            $table->dropIndex(['length']);
            $table->dropIndex(['is_active', 'length']);
        });

        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['difficulty']);
            $table->dropIndex(['status', 'score', 'time_elapsed']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id', 'status', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['created_at']);
        });
    }
};
