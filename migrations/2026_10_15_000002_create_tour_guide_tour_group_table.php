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

return Migration::createTable('tour_guide_tour_group', function (Blueprint $table) {
    $table->unsignedInteger('tour_id');
    $table->unsignedInteger('group_id');

    $table->primary(['tour_id', 'group_id']);

    $table->foreign('tour_id')->references('id')->on('tour_guide_tours')->cascadeOnDelete();
    $table->foreign('group_id')->references('id')->on('groups')->cascadeOnDelete();
});
