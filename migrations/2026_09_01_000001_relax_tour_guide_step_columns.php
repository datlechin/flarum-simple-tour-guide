<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->table('tour_guide_steps', function (Blueprint $table) {
            // A step's body is prose, and 255 characters is not enough of it.
            $table->text('description')->change();

            // A step with no target is shown on its own in the middle of the
            // screen, for a welcome or a sign-off.
            $table->string('target')->nullable()->change();
        });
    },

    'down' => function (Builder $schema) {
        $schema->getConnection()
            ->table('tour_guide_steps')
            ->whereNull('target')
            ->update(['target' => '']);

        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->string('description')->change();
            $table->string('target')->nullable(false)->change();
        });
    },
];
