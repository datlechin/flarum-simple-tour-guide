<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

/**
 * One row per member per tour they have been through.
 *
 * Replaces the single timestamp on the users table, which could only ever
 * describe one tour, and records where they stopped so the admin can see which
 * step loses people.
 */
return Migration::createTable('tour_guide_completions', function (Blueprint $table) {
    $table->increments('id');
    $table->unsignedInteger('user_id');
    $table->unsignedInteger('tour_id');

    // 'finished' reached the end, 'dismissed' left early.
    $table->string('outcome', 20)->default('finished');

    // The step they were on when they left. Null once that step is deleted.
    $table->unsignedInteger('last_step_id')->nullable();

    $table->timestamp('completed_at')->useCurrent();

    $table->unique(['user_id', 'tour_id']);
    $table->index(['tour_id', 'outcome']);

    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
    $table->foreign('tour_id')->references('id')->on('tour_guide_tours')->cascadeOnDelete();
    $table->foreign('last_step_id')->references('id')->on('tour_guide_steps')->nullOnDelete();
});
