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
            $table->unsignedBigInteger('pic_user_id')->nullable()->change();
            $table->unsignedBigInteger('designer_user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            $table->unsignedBigInteger('pic_user_id')->nullable(false)->change();
            $table->unsignedBigInteger('designer_user_id')->nullable(false)->change();
        });
    }
};
