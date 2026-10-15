<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Search\Filter;

use Flarum\Search\Database\DatabaseSearchState;
use Flarum\Search\Filter\FilterInterface;
use Flarum\Search\SearchState;
use Flarum\Search\ValidateFilterTrait;

/**
 * @implements FilterInterface<DatabaseSearchState>
 */
class AvailableFilter implements FilterInterface
{
    use ValidateFilterTrait;

    public function getFilterKey(): string
    {
        return 'available';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        // Admins see every tour; the forum asks for the ones it would actually run for them.
        if ($this->asBool($value) && ! $negate) {
            $state->getQuery()->scopes(['availableTo' => [$state->getActor()]]);
        }
    }
}
