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

return Migration::createTable('tour_guide_tours', function (Blueprint $table) {
    $table->increments('id');

    // Stable across sites, so a tour can be exported, imported and launched by
    // name from other code.
    $table->string('key', 100)->unique();

    // Admin-facing only; members never see it.
    $table->string('title');

    $table->boolean('is_enabled')->default(true);

    // 'auto' starts itself for anybody eligible, 'manual' waits to be launched.
    // Not called `trigger`: that is a reserved word, so every raw query that
    // ever touches this table would have to remember to quote it.
    $table->string('start_mode', 20)->default('auto');

    // A Flarum route name, e.g. 'index' or 'discussion'. Null runs anywhere.
    $table->string('route', 100)->nullable();

    // 'any', 'desktop' or 'mobile'.
    $table->string('devices', 10)->default('any');

    // Group ids that may see the tour. Null or empty means everybody.
    $table->json('group_ids')->nullable();

    // Only members whose account is younger than this. Null means any age.
    $table->unsignedInteger('max_account_age_days')->nullable();

    $table->unsignedInteger('position')->default(0);

    $table->timestamps();
});
