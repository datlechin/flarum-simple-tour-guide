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
 * Overrides for a step's wording, one row per locale.
 *
 * The step's own title and description stay put and act as the fallback, so a
 * tour is readable the moment it is written and translating it is optional,
 * per step and per language.
 */
return Migration::createTable('tour_guide_step_translations', function (Blueprint $table) {
    $table->increments('id');
    $table->unsignedInteger('step_id');
    $table->string('locale', 20);
    $table->string('title');
    $table->text('description');
    $table->timestamps();

    $table->unique(['step_id', 'locale']);
    $table->foreign('step_id')->references('id')->on('tour_guide_steps')->cascadeOnDelete();
});
