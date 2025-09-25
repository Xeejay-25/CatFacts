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
        Schema::create('cat_facts', function (Blueprint $table) {
            $table->id();
            $table->text('fact');
            $table->integer('length');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Add index for better performance when fetching random facts
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cat_facts');
    }
};
