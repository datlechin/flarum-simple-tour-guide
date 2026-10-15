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
        $connection = $schema->getConnection();
        $groupIds = $connection->table('groups')->pluck('id')->map(fn ($id) => (int) $id)->all();

        $rows = $connection->table('tour_guide_tours')
            ->whereNotNull('group_ids')
            ->pluck('group_ids', 'id')
            ->flatMap(fn ($ids, $tourId) => collect(json_decode($ids, true) ?: [])
                ->map(fn ($id) => (int) $id)
                ->intersect($groupIds)
                ->unique()
                ->map(fn ($id) => ['tour_id' => $tourId, 'group_id' => $id]))
            ->values()
            ->all();

        $connection->table('tour_guide_tour_group')->insertOrIgnore($rows);

        $schema->table('tour_guide_tours', function (Blueprint $table) {
            $table->dropColumn('group_ids');
        });
    },

    'down' => function (Builder $schema) {
        $schema->table('tour_guide_tours', function (Blueprint $table) {
            $table->json('group_ids')->nullable();
        });

        $connection = $schema->getConnection();

        $connection->table('tour_guide_tour_group')
            ->get()
            ->groupBy('tour_id')
            ->each(fn ($rows, $tourId) => $connection->table('tour_guide_tours')
                ->where('id', $tourId)
                ->update(['group_ids' => json_encode($rows->pluck('group_id')->map(fn ($id) => (int) $id)->values())]));
    },
];
