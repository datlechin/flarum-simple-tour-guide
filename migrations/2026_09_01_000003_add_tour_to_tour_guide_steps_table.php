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

        $schema->table('tour_guide_steps', function (Blueprint $table) {
            // Nullable to begin with: the rows already in the table have no
            // tour to belong to until one is made for them below.
            $table->unsignedInteger('tour_id')->nullable();

            // 'auto' lets the popover pick a side that fits.
            $table->string('placement', 10)->default('auto');
            $table->string('devices', 10)->default('any');
            $table->boolean('is_enabled')->default(true);

            // Waits for the member to click the highlighted element instead of
            // offering a Next button.
            $table->boolean('advance_on_click')->default(false);
        });

        // "is_trigger_click" said neither what it clicked nor when. It clicks
        // the step's own target on the way to the next step, and it now sits
        // beside advance_on_click, so the two need telling apart. Renamed on
        // its own, because a rename alongside additions is not something every
        // driver sequences the way you would hope.
        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->renameColumn('is_trigger_click', 'clicks_target');
        });

        // Everything written before tours existed belongs to one, so the forum
        // has something to run and the admin has something to edit.
        if ($connection->table('tour_guide_steps')->exists()) {
            $now = date('Y-m-d H:i:s');

            $tourId = $connection->table('tour_guide_tours')->insertGetId([
                'key' => 'welcome',
                'title' => 'Welcome tour',
                'is_enabled' => true,
                'start_mode' => 'auto',
                'route' => null,
                'devices' => 'any',
                'position' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $connection->table('tour_guide_steps')->update(['tour_id' => $tourId]);
        }

        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->unsignedInteger('tour_id')->nullable(false)->change();
            $table->foreign('tour_id')->references('id')->on('tour_guide_tours')->cascadeOnDelete();
        });
    },

    'down' => function (Builder $schema) {
        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->renameColumn('clicks_target', 'is_trigger_click');
        });

        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->dropForeign(['tour_id']);
            $table->dropColumn(['tour_id', 'placement', 'devices', 'is_enabled', 'advance_on_click']);
        });
    },
];
