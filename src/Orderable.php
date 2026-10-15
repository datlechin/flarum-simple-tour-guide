<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide;

use Illuminate\Database\Eloquent\Builder;

trait Orderable
{
    /**
     * @param Builder<static> $siblings
     */
    public static function nextPosition(Builder $siblings): int
    {
        return (int) $siblings->max('position') + 1;
    }

    /**
     * @param Builder<static> $siblings
     * @param array<int> $ids
     */
    public static function reorder(Builder $siblings, array $ids): void
    {
        $rest = (clone $siblings)
            ->whereNotIn('id', $ids)
            ->orderBy('position')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $siblings->getConnection()->transaction(function () use ($siblings, $ids, $rest) {
            foreach (array_values(array_merge($ids, $rest)) as $position => $id) {
                (clone $siblings)->whereKey($id)->update(['position' => $position]);
            }
        });
    }
}
