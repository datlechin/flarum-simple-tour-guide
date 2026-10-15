<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

use Flarum\Formatter\Formatter;
use Illuminate\Database\Schema\Builder;

$convert = function (Builder $schema, Closure $transform): void {
    foreach (['tour_guide_steps', 'tour_guide_step_translations'] as $table) {
        $schema->getConnection()
            ->table($table)
            ->whereNotNull('content')
            ->where('content', '!=', '')
            ->chunkById(100, function ($rows) use ($schema, $table, $transform) {
                foreach ($rows as $row) {
                    $schema->getConnection()
                        ->table($table)
                        ->where('id', $row->id)
                        ->update(['content' => $transform($row->content)]);
                }
            });
    }
};

return [
    'up' => function (Builder $schema) use ($convert) {
        $formatter = resolve(Formatter::class);

        $convert($schema, fn (string $text) => $formatter->parse($text));
    },

    'down' => function (Builder $schema) use ($convert) {
        $formatter = resolve(Formatter::class);

        $convert($schema, fn (string $xml) => $formatter->unparse($xml));
    },
];
