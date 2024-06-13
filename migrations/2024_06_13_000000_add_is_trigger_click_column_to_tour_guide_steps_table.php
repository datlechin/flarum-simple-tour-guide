<?php

use Illuminate\Database\Schema\Blueprint;

use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->boolean('is_trigger_click')->default(false);
        });
    },
    'down' => function (Builder $schema) {
        $schema->table('tour_guide_steps', function (Blueprint $table) {
            $table->dropColumn('is_trigger_click');
        });
    },
];
