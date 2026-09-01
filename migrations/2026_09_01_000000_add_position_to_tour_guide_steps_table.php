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
            $table->unsignedInteger('position')->default(0);
        });

        // A tour is a sequence, but until now nothing recorded one, so the
        // steps came back in whatever order the database felt like. Seed the
        // order from the ids, which is the order they were written in, and
        // leave the rest to the admin's drag handles.
        $connection = $schema->getConnection();

        foreach ($connection->table('tour_guide_steps')->orderBy('id')->pluck('id') as $position => $id) {
            $connection->table('tour_guide_steps')
                ->where('id', $id)
                ->update(['position' => $position]);
        }
    },

    'down' => function (Builder $schema) {
        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    },
];
