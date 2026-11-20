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
        Schema::table('contents', function (Blueprint $table) {
            $table->text('caption')->nullable()->change();
            $table->unsignedBigInteger('uploader_user_id')->nullable()->change();
            $table->dateTime('deadline')->nullable()->change();
            $table->dateTime('publish_schedule')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            $table->text('caption')->nullable(false)->change();
            $table->unsignedBigInteger('uploader_user_id')->nullable(false)->change();
            $table->dateTime('deadline')->nullable(false)->change();
            $table->dateTime('publish_schedule')->nullable(false)->change();
        });
    }
};
