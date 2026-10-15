<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Access;

use Datlechin\FlarumSimpleTourGuide\Tour;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;

class ScopeTourVisibility
{
    /**
     * @param Builder<Tour> $query
     */
    public function __invoke(User $actor, Builder $query): void
    {
        if ($actor->isGuest()) {
            $query->whereRaw('FALSE');
        } elseif (! $actor->isAdmin()) {
            $query->availableTo($actor);
        }
    }
}
