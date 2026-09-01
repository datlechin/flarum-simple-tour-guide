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

/**
 * Carries the old one-tour-per-forum dismissal over to the completions table,
 * then takes the column off the users table.
 */
return [
    'up' => function (Builder $schema) {
        $connection = $schema->getConnection();

        $tourId = $connection->table('tour_guide_tours')->orderBy('id')->value('id');

        if ($tourId !== null) {
            $dismissals = $connection->table('users')
                ->whereNotNull('tour_guide_dismissed_at')
                ->select('id', 'tour_guide_dismissed_at')
                ->get();

            foreach ($dismissals->chunk(500) as $chunk) {
                $connection->table('tour_guide_completions')->insertOrIgnore(
                    $chunk->map(fn ($user) => [
                        'user_id' => $user->id,
                        'tour_id' => $tourId,
                        // The old column recorded that the tour was over, never
                        // whether it was finished or abandoned. Finished is the
                        // kinder assumption: it is the one that does not invent
                        // a drop-off that may never have happened.
                        'outcome' => 'finished',
                        'last_step_id' => null,
                        'completed_at' => $user->tour_guide_dismissed_at,
                    ])->all()
                );
            }
        }

        $schema->table('users', function (Blueprint $table) {
            $table->dropColumn('tour_guide_dismissed_at');
        });
    },

    'down' => function (Builder $schema) {
        $schema->table('users', function (Blueprint $table) {
            $table->timestamp('tour_guide_dismissed_at')->nullable();
        });

        $connection = $schema->getConnection();

        $tourId = $connection->table('tour_guide_tours')->orderBy('id')->value('id');

        if ($tourId === null) {
            return;
        }

        $completions = $connection->table('tour_guide_completions')
            ->where('tour_id', $tourId)
            ->select('user_id', 'completed_at')
            ->get();

        foreach ($completions as $completion) {
            $connection->table('users')
                ->where('id', $completion->user_id)
                ->update(['tour_guide_dismissed_at' => $completion->completed_at]);
        }
    },
];
