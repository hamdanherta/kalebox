<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo'); // png/svg ratio 1:1 <= 500KB
            $table->string('account_link')->nullable();
            $table->timestamps();
        });

        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('brief');
            $table->text('caption');
            $table->foreignId('idea_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('pic_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('designer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('uploader_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('production_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('content_type', ['carousel', 'feed', 'stories', 'flyer', 'reels']);
            $table->foreignId('platform_id')->constrained('promotion_platforms')->cascadeOnDelete();
            $table->dateTime('deadline');
            $table->dateTime('publish_schedule');
            $table->string('result_link')->nullable(); // paste link
            
            // 7 Status Resmi
            $table->string('status')->default('Ide');
            $table->boolean('is_high_priority')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('content_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('contents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_status_histories');
        Schema::dropIfExists('contents');
        Schema::dropIfExists('promotion_platforms');
    }
};
