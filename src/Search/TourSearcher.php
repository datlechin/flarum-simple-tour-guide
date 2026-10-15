<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Search;

use Datlechin\FlarumSimpleTourGuide\Tour;
use Flarum\Search\Database\AbstractSearcher;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;

class TourSearcher extends AbstractSearcher
{
    /**
     * @return Builder<Tour>
     */
    public function getQuery(User $actor): Builder
    {
        return Tour::whereVisibleTo($actor);
    }
}
