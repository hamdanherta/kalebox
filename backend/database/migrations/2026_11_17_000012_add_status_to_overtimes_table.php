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
        Schema::table('overtimes', function (Blueprint $table) {
            if (!Schema::hasColumn('overtimes', 'status')) {
                $table->string('status', 30)->default('menunggu')->after('notes');
            }
            if (!Schema::hasColumn('overtimes', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('overtimes', 'rejection_note')) {
                $table->text('rejection_note')->nullable()->after('approved_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('overtimes', function (Blueprint $table) {
            if (Schema::hasColumn('overtimes', 'approved_by')) {
                $table->dropForeign(['approved_by']);
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('overtimes', 'rejection_note')) {
                $table->dropColumn('rejection_note');
            }
            if (Schema::hasColumn('overtimes', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
