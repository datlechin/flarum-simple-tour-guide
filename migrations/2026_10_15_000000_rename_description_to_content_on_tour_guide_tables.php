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
        foreach (['tour_guide_steps', 'tour_guide_step_translations'] as $name) {
            $schema->table($name, function (Blueprint $table) {
                $table->renameColumn('description', 'content');
            });

            // HasFormattedContent stores an empty body as null.
            $schema->table($name, function (Blueprint $table) {
                $table->text('content')->nullable()->change();
            });

            $schema->getConnection()->table($name)->where('content', '')->update(['content' => null]);
        }
    },

    'down' => function (Builder $schema) {
        foreach (['tour_guide_steps', 'tour_guide_step_translations'] as $name) {
            $schema->getConnection()->table($name)->whereNull('content')->update(['content' => '']);

            $schema->table($name, function (Blueprint $table) {
                $table->text('content')->nullable(false)->change();
            });

            $schema->table($name, function (Blueprint $table) {
                $table->renameColumn('content', 'description');
            });
        }
    },
];
